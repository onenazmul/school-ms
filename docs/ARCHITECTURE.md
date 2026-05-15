# Architecture Reference

## Decision: Modify current project (don't start from scratch)

All UI pages, components, forms, and shadcn/Tailwind 4 config are done and working.
Only the data layer changes — replacing Laravel API calls with Prisma + own API routes.
Copying 50+ files to a new repo is more risk than cleanup here.

---

## Final Tech Stack

| Layer | Package | Notes |
|---|---|---|
| Framework | next ^16 | Upgrade from 15. Use proxy.ts (not middleware.ts) |
| Language | TypeScript ^5 | No change |
| Database | MySQL 8 on Hostinger | Remote. Connection string in .env.local |
| ORM | prisma ^6.19.3 | Same version as other app — later versions had issues |
| ORM client | @prisma/client ^6.19.3 | |
| ID generation | @paralleldrive/cuid2 ^2.2.0 | For all non-Better-Auth IDs |
| Auth | better-auth (latest) | Credentials + TOTP 2FA + username plugin |
| Password hashing | bcryptjs ^2.4.0 | better-auth handles this internally |
| Client fetching | swr ^2.4.0 | Replaces @tanstack/react-query |
| File uploads | sharp ^0.33.0 | Resize/thumbnail student photos (no watermark needed) |
| Storage | Local disk, path from env | `UPLOAD_DIR` points to a folder outside the project so it survives git deploys |
| Forms | react-hook-form + zod | No change |
| UI | shadcn/ui + Tailwind 4 | No change |
| Toasts | sonner | No change |
| PDF generation | @react-pdf/renderer | No change |

### Packages to remove
- `@tanstack/react-query`
- `@tanstack/react-query-devtools`
- `jose` (custom student JWT — replaced by Better Auth username plugin)

### Packages to add
- `prisma` ^6.19.3
- `@prisma/client` ^6.19.3
- `@paralleldrive/cuid2` ^2.2.0
- `swr` ^2.4.0
- `sharp` ^0.33.0
- `bcryptjs` ^2.4.0
- `@types/bcryptjs`

---

## Architecture Pattern

```
Browser
  └── SWR hooks (client-side data fetching)
        └── /api/v1/... (Next.js API routes)
              └── Prisma client → MySQL 8 (Hostinger)

Server Components / Server Actions
  └── Prisma client → MySQL 8 (Hostinger)

Auth (Better Auth)
  └── /api/auth/[...all] (Better Auth handler)
        └── Better Auth → MySQL 8 (same DB, auth tables)
```

No separate backend. Next.js handles everything.

---

## Role System

| Role | Login method | Created by |
|---|---|---|
| `admin` | email + password + TOTP | DB seed / manual |
| `teacher` | email + password + TOTP | Admin creates |
| `applicant` | username + password | Auto on form submit |
| `student` | username + password | Same account, role upgraded when admin approves |

**Key rule:** One Better Auth account per person. Applicants get their account on form submission.
When admin approves, the account role changes from `applicant` → `student` and a `Student` DB record is created.

---

## File Structure (new/changed files)

```
src/
  lib/
    db.ts                   ← Prisma singleton (NEW)
    upload.ts               ← Local disk file handler (NEW)
    auth/
      server.ts             ← Better Auth server instance (REWRITE)
      client.ts             ← Better Auth client (REWRITE)
  app/
    api/
      auth/[...all]/        ← Better Auth handler (REWRITE - simplify)
      v1/                   ← All data API routes (NEW - replaces Laravel calls)
        admissions/
        students/
        teachers/
        finance/
        dashboard/
  proxy.ts                  ← Route protection (NEW - replaces middleware.ts)
prisma/
  schema.prisma             ← Full schema (NEW)
  seed.ts                   ← Admin seed (NEW)
```

---

## Key Patterns

### Prisma singleton (`lib/db.ts`)
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### SWR data fetching pattern
```ts
// lib/hooks/use-admissions.ts
import useSWR from 'swr'
const fetcher = (url: string) => fetch(url).then(r => r.json())
export function useAdmissions() {
  return useSWR('/api/v1/admissions', fetcher)
}
```

### API route pattern
```ts
// app/api/v1/admissions/route.ts
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/server'

export async function GET(req: Request) {
  await requireRole(req, ['admin'])
  const admissions = await db.admission.findMany({ orderBy: { createdAt: 'desc' } })
  return Response.json(admissions)
}
```

### File upload pattern
```ts
// lib/upload.ts — mirrors other app
// Accepts File, resizes with sharp, saves to /uploads/{type}/{filename}
// Returns relative path stored in DB
```

---

## Auth Flow: Admin/Teacher

1. POST `/api/auth/sign-in/email` (Better Auth endpoint)
2. Better Auth verifies email + password against `account.password` (bcrypt)
3. If TOTP enabled: redirect to 2FA step
4. Better Auth sets httpOnly session cookie
5. proxy.ts reads session, injects headers for server components

## Auth Flow: Student/Applicant

1. POST `/api/auth/sign-in/username` (Better Auth username plugin)
2. Better Auth verifies username + password
3. Better Auth sets httpOnly session cookie
4. Same session infrastructure as admin — no separate JWT

## proxy.ts Route Protection

```ts
// proxy.ts (Next.js 16 pattern — match your other app exactly)
export const proxy = {
  // /admin/* → requires role: admin
  // /teacher/* → requires role: teacher  
  // /admission/* → requires role: applicant | student
  // /student/* → requires role: student
  // public: /, /login, /student-login, /apply, /api/auth/*
}
```

---

## Environment Variables (.env.local)

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/school_ms"

# Better Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"

# File Storage
# Point this to a folder OUTSIDE the project directory on Hostinger
# so uploads survive git pull / redeploys (e.g. /home/user/uploads or a sibling folder)
UPLOAD_DIR=/home/yourhostinguser/uploads

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
