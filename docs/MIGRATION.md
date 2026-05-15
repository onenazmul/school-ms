# Migration Checklist

Migrating school-ms from Laravel API dependency → own DB + Better Auth.
Work through phases in order. Each phase is independently deployable.

---

## Before starting: package changes

### Remove
```bash
npm uninstall @tanstack/react-query @tanstack/react-query-devtools jose
```

### Add
```bash
npm install prisma@6.19.3 @prisma/client@6.19.3 --save-dev
npm install @prisma/client@6.19.3 swr @paralleldrive/cuid2 sharp bcryptjs
npm install --save-dev @types/bcryptjs @types/sharp
```

### Upgrade Next.js
```bash
npm install next@latest
```
After upgrading, rename `src/middleware.ts` → `proxy.ts` (project root) and update the export to match your other app's proxy pattern.

---

## Phase 0 — Foundation

- [ ] Run `npx prisma init` → creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`
- [ ] Copy schema from `docs/SCHEMA.md` into `prisma/schema.prisma`
- [ ] Add `.env.local` variables (see `docs/ARCHITECTURE.md` env section)
- [ ] Run `npx prisma db push` (creates tables in MySQL)
- [ ] Create `src/lib/db.ts` — Prisma singleton
- [ ] Create `src/lib/upload.ts` — local disk file handler with sharp
- [ ] Create `prisma/seed.ts` — admin seed
- [ ] Run `npx prisma db seed`

**Done when:** `npx prisma studio` shows all tables, admin account exists.

---

## Phase 1 — Auth

- [ ] Rewrite `src/lib/auth/server.ts` — Better Auth with credentials + TOTP + username plugins
- [ ] Rewrite `src/lib/auth/client.ts` — Better Auth client with plugin clients
- [ ] Create `src/lib/auth/helpers.ts` — `getSession()`, `requireRole()`
- [ ] Rewrite `src/app/api/auth/[...all]/route.ts` → single `toNextJsHandler(auth)` call
- [ ] Delete `src/app/api/auth/admin-session/` — no longer needed
- [ ] Delete `src/app/api/auth/admin-signout/` — use `authClient.signOut()` directly
- [ ] Delete `src/app/api/auth/student-session/` — no longer needed
- [ ] Delete `src/app/api/auth/student-signout/` — use `authClient.signOut()` directly
- [ ] Rewrite `src/middleware.ts` → move to `proxy.ts` at project root (Next.js 16)
- [ ] Update admin login page — use `signIn.email()` from Better Auth client
- [ ] Update student login page — use `authClient.signIn.username()` from Better Auth client
- [ ] Update admission apply form — use new `submitAdmissionAction` server action
- [ ] Test: admin login → dashboard ✓
- [ ] Test: student login → admission portal ✓
- [ ] Test: TOTP 2FA setup and verify ✓
- [ ] Test: unauthorized routes redirect correctly ✓

**Done when:** All 4 login flows work, protected routes redirect correctly.

---

## Phase 2 — Admissions Module

Remove all `sms-api.chalanbeel.com` calls from admissions. Replace with own API routes.

### API routes to create (`app/api/v1/admissions/`)
- [ ] `GET /api/v1/admissions` — list with filters (status, class, search)
- [ ] `POST /api/v1/admissions` — submit new application (public, creates Better Auth account)
- [ ] `GET /api/v1/admissions/[id]` — get single admission
- [ ] `PUT /api/v1/admissions/[id]` — edit admission (applicant or admin)
- [ ] `POST /api/v1/admissions/[id]/approve` — approve → creates Student record, upgrades role
- [ ] `POST /api/v1/admissions/[id]/reject` — reject → updates status + adminNote
- [ ] `POST /api/v1/admissions/[id]/payment` — submit payment proof

### SWR hooks to create (`lib/hooks/`)
- [ ] `use-admissions.ts` — list with filters
- [ ] `use-admission.ts` — single admission

### Remove
- [ ] `src/lib/actions/admission.ts` — the Laravel server action
- [ ] `src/lib/queries/index.ts` TanStack hooks for admissions
- [ ] `src/providers/query-provider.tsx` (if only used for TanStack)
- [ ] Remove `QueryClientProvider` from layout

### Update pages
- [ ] `app/(admin)/admin/admissions/page.tsx` — use SWR instead of TanStack Query
- [ ] `app/(admin)/admin/admissions/[id]/page.tsx`
- [ ] `app/(admission)/admission/*/` — use own session, no laravelToken
- [ ] `app/(public)/apply/page.tsx` — use new server action

**Done when:** Admin can view, filter, approve, reject admissions. Applicant can submit and track.

---

## Phase 3 — Students Module

- [ ] `GET /api/v1/students` — list with filters (class, section, status)
- [ ] `GET /api/v1/students/[id]` — student profile
- [ ] `PUT /api/v1/students/[id]` — update student info
- [ ] `GET /api/v1/students/[id]/ledger` — bills + payment summary
- [ ] `GET /api/v1/students/[id]/receipts` — receipt history
- [ ] SWR hooks: `use-students.ts`, `use-student.ts`
- [ ] Update admin student list page
- [ ] Update student portal pages (own profile, ledger, receipts)

---

## Phase 4 — Finance Module

- [ ] `GET/POST /api/v1/finance/fee-configs`
- [ ] `GET/PUT/DELETE /api/v1/finance/fee-configs/[id]`
- [ ] `GET /api/v1/finance/bills` — filtered list
- [ ] `POST /api/v1/finance/bulk-billing` — generate bills for a class
- [ ] `GET/POST /api/v1/finance/receipts`
- [ ] `GET /api/v1/finance/ledger`
- [ ] SWR hooks for all finance queries
- [ ] Update all finance admin pages
- [ ] Remove TanStack mutations — use SWR `mutate()` + fetch POST

---

## Phase 5 — Dashboard

- [ ] `GET /api/v1/dashboard/admin` — counts: admissions, students, teachers, unpaid bills
- [ ] `GET /api/v1/dashboard/student` — student's own bills, results summary
- [ ] Update admin dashboard page
- [ ] Update student dashboard page

---

## Phase 6 — Documents (PDF generation)

Documents already use mock data — swap mock data for real DB queries.

- [ ] `app/api/documents/admit-card/[studentId]/route.ts` — query Student + Admission from DB
- [ ] `app/api/documents/id-card/[studentId]/route.ts` — same
- [ ] `app/api/documents/result-card/[studentId]/route.ts` — query ExamResult from DB
- [ ] `app/api/documents/payment-receipt/[submissionId]/route.ts` — query PaymentSubmission from DB
- [ ] Delete `src/lib/mock-data/documents.ts`
- [ ] Delete `src/lib/mock-data/payments.ts`

---

## Phase 7 — Teachers Module

- [ ] Create `Teacher` model in schema (or use `user` with role=teacher + a `TeacherProfile` table)
- [ ] `GET/POST /api/v1/teachers`
- [ ] `GET/PUT/DELETE /api/v1/teachers/[id]`
- [ ] Admin teacher management page
- [ ] Teacher portal (their own dashboard, class assignments)

---

## Cleanup (after all phases done)

- [ ] Delete `src/lib/api/client.ts` — Laravel API wrapper gone
- [ ] Delete `src/lib/auth/student.ts` — custom JWT gone
- [ ] Delete `src/lib/auth/student-client.ts`
- [ ] Remove `X-Tenant-Domain` from anywhere it remains
- [ ] Remove all references to `laravelToken`
- [ ] Remove `jose` from package.json
- [ ] Run `npx tsc --noEmit` — fix any remaining type errors
- [ ] Update `.env.local` — remove `API_BASE_URL`, `API_URL`, `TENANT_DOMAIN`

---

## Files that don't change

These are UI/component files — leave them alone unless a bug surfaces:

- All files in `src/components/` (layout, UI, PDF components)
- All Zod schemas in `src/lib/schemas/` — reuse as-is for API validation
- `tailwind.config`, `components.json`, shadcn setup
- `@react-pdf/renderer` document components
