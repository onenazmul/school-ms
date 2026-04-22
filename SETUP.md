# SchoolOS — Setup Guide

## Prerequisites
- Node.js 20+
- A running Laravel 11 API

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Install Shadcn UI components

```bash
npx shadcn@latest init
# Choose: TypeScript, default style, CSS variables

npx shadcn@latest add button input label form select textarea \
  dialog alert-dialog card badge avatar separator \
  dropdown-menu skeleton tabs sonner
```

Also install Radix Tabs directly:
```bash
npm install @radix-ui/react-tabs
```

---

## 3. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-min-32-chars    # openssl rand -base64 32
NEXT_PUBLIC_API_URL=http://localhost:8000/api
API_URL=http://localhost:8000                   # base URL without /api
```

---

## 4. Auth Architecture

SchoolOS uses **two completely separate auth systems**:

### Staff Auth (Admin + Teacher) — Better Auth
- **URL:** `/login`
- **Endpoint:** `POST {API_URL}/api/auth/login`
- **Credentials:** email + password
- **Session:** Better Auth JWT cookie (`better-auth.session_token`)
- **Redirect on success:** `/admin/dashboard` or `/teacher/dashboard`

### Student Auth — Custom JWT
- **URL:** `/student-login`
- **Endpoint:** `POST {API_URL}/api/admission/login`
- **Credentials:** username + password
- **Session:** Custom `student_session` httpOnly JWT cookie (signed with `BETTER_AUTH_SECRET`)
- **Redirect on success:** `/student/dashboard`

The two systems are completely independent. The middleware checks:
- `/student/*` routes → verifies `student_session` cookie → redirects to `/student-login` if missing
- `/admin/*` and `/teacher/*` routes → verifies Better Auth session → redirects to `/login` if missing

---

## 5. Laravel API Requirements

### Staff Auth
| Method | Endpoint | Returns |
|--------|----------|---------|
| POST | /api/auth/login | `{ user: { id, name, email, role }, token }` |
| POST | /api/auth/logout | 204 |

The `role` field must be: `admin` or `teacher` (students do NOT use this endpoint).

### Student Auth
| Method | Endpoint | Returns |
|--------|----------|---------|
| POST | /api/admission/login | `{ user: { id, username, name, admission_no }, token }` |

The `username` field is the student's unique login handle (assigned at admission).

### Admission
| Method | Endpoint | Behaviour |
|--------|----------|-----------|
| POST | /api/admissions/apply | Creates student record, assigns `username`, hashes password |

After a successful `apply`, the Next.js app immediately calls `studentSignIn(username, password)` to auto-authenticate the new student. The `username` returned in the apply response is used for the login call.

### Finance
| Method | Endpoint |
|--------|----------|
| GET/POST | /api/finance/fee-configs |
| PUT/DELETE | /api/finance/fee-configs/:id |
| GET/POST | /api/finance/bills |
| POST | /api/finance/bulk-billing |
| GET/POST | /api/finance/receipts |
| GET | /api/finance/ledger |
| GET | /api/students/:id/ledger |

### Dashboard Stats
| Method | Endpoint |
|--------|----------|
| GET | /api/dashboard/admin |
| GET | /api/dashboard/student |
| GET | /api/dashboard/teacher |

---

## 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- Staff login: [http://localhost:3000/login](http://localhost:3000/login)
- Student login: [http://localhost:3000/student-login](http://localhost:3000/student-login)
- Admission form: [http://localhost:3000/apply](http://localhost:3000/apply)

---

## 7. Route Structure

| URL | Panel | Auth |
|-----|-------|------|
| `/login` | Staff auth | Public |
| `/student-login` | Student auth | Public |
| `/apply` | Admission form | Public |
| `/admin/dashboard` | Admin | Better Auth (admin) |
| `/admin/students` | Student list | Better Auth (admin) |
| `/admin/students/new` | Add student | Better Auth (admin) |
| `/admin/students/:id` | Student profile | Better Auth (admin) |
| `/admin/students/:id/edit` | Edit student | Better Auth (admin) |
| `/admin/teachers` | Teacher list | Better Auth (admin) |
| `/admin/teachers/:id` | Teacher profile | Better Auth (admin) |
| `/admin/teachers/:id/edit` | Edit teacher | Better Auth (admin) |
| `/admin/classes` | Classes | Better Auth (admin) |
| `/admin/classes/:id` | Class detail | Better Auth (admin) |
| `/admin/finance/fee-config` | Fee types CRUD | Better Auth (admin) |
| `/admin/finance/bulk-billing` | Bulk billing | Better Auth (admin) |
| `/admin/finance/ledger` | Full ledger | Better Auth (admin) |
| `/admin/finance/receipts` | Issue receipt | Better Auth (admin) |
| `/admin/finance/receipts/history` | Receipt log | Better Auth (admin) |
| `/admin/reports` | Reports | Better Auth (admin) |
| `/admin/settings` | Settings | Better Auth (admin) |
| `/teacher/dashboard` | Teacher home | Better Auth (teacher) |
| `/teacher/classes` | My classes | Better Auth (teacher) |
| `/teacher/classes/:id` | Class detail | Better Auth (teacher) |
| `/teacher/students` | My students | Better Auth (teacher) |
| `/teacher/attendance` | Attendance | Better Auth (teacher) |
| `/student/dashboard` | Student home | Student cookie |
| `/student/ledger` | My ledger | Student cookie |
| `/student/receipts` | My receipts | Student cookie |
| `/student/profile` | My profile | Student cookie |

---

## 8. Optimistic Updates Pattern

All mutations in `lib/queries/index.ts` follow this pattern:

```ts
onMutate: async (data) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, optimisticUpdate(data)); // instant UI
  return { previous };
},
onError: (_err, _data, ctx) => {
  queryClient.setQueryData(queryKey, ctx?.previous); // rollback
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey }); // sync with server
},
```

---

## 9. Adding New Pages

1. Place under the correct route group: `(admin)`, `(teacher)`, or `(student)`
2. Add nav link in `src/components/layout/sidebar.tsx` (staff) or `student-sidebar.tsx` (student)
3. Add API endpoints to `src/lib/api/endpoints.ts`
4. Add TanStack Query hooks to `src/lib/queries/index.ts`
   - Use `useStaffToken()` for admin/teacher queries
   - Use `useStudentToken()` for student portal queries
5. Add Zod schemas to `src/lib/schemas/index.ts`
