# Better Auth Setup Reference

## Plugins used
- `credentials` — email + password for admin/teacher (built-in)
- `twoFactor` — TOTP 2FA for admin/teacher
- `username` — username + password for applicant/student

---

## `lib/auth/server.ts`

```ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor } from 'better-auth/plugins'
import { username } from 'better-auth/plugins'
import { db } from '@/lib/db'

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'mysql',
  }),

  emailAndPassword: {
    enabled: true,
    // Only admin/teacher use email login
    // Students use username plugin below
  },

  plugins: [
    twoFactor({
      issuer: 'School MS',
      // Only enforce 2FA for admin and teacher roles
      // Check role in the 2FA hook if needed
    }),
    username({
      requireEmail: false,   // students don't need email
      minUsernameLength: 3,
      maxUsernameLength: 20,
    }),
  ],

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'applicant',
        input: false, // not settable by client directly
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min client-side cache
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL!],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

---

## `lib/auth/client.ts`

```ts
import { createAuthClient } from 'better-auth/react'
import { twoFactorClient } from 'better-auth/client/plugins'
import { usernameClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    twoFactorClient(),
    usernameClient(),
  ],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient
```

---

## `app/api/auth/[...all]/route.ts`

```ts
import { auth } from '@/lib/auth/server'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

That's the entire file. Better Auth handles everything else.

---

## Auth helper: `lib/auth/helpers.ts`

```ts
import { auth } from './server'
import { headers } from 'next/headers'

// Use in server components and API routes
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

// Throws 401 if not authenticated or wrong role
export async function requireRole(
  allowedRoles: string[],
  request?: Request
) {
  const session = request
    ? await auth.api.getSession({ headers: request.headers })
    : await getSession()

  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }
  if (!allowedRoles.includes(session.user.role)) {
    throw new Response('Forbidden', { status: 403 })
  }
  return session
}
```

---

## proxy.ts (Next.js 16 — match your other app's pattern exactly)

```ts
// proxy.ts — copy the export pattern from your other app
// The route protection logic:

const PUBLIC_PATHS = ['/', '/login', '/student-login', '/apply']
const AUTH_API = '/api/auth'

// /admin/*     → role: admin
// /teacher/*   → role: teacher
// /admission/* → role: applicant OR student
// /student/*   → role: student only
```

**Important:** Copy the actual `proxy` export structure from your other app.
The logic above is what needs to be implemented in it — the export syntax is Next.js 16 specific.

---

## Admin/Teacher Sign In (client)

```ts
import { signIn } from '@/lib/auth/client'

// Email + password
const result = await signIn.email({
  email: 'admin@school.com',
  password: 'password',
  callbackURL: '/admin/dashboard',
})

// Then if 2FA is enabled, Better Auth returns a `twoFactorRedirect`
// and you call:
await authClient.twoFactor.verifyTotp({ code: '123456' })
```

---

## Student/Applicant Sign In (client)

```ts
import { authClient } from '@/lib/auth/client'

// Username + password (username plugin)
const result = await authClient.signIn.username({
  username: 'APP-2025-00123',
  password: 'userpassword',
  callbackURL: '/admission/dashboard',
})
```

---

## Creating applicant account on form submission (server action)

```ts
import { auth } from '@/lib/auth/server'
import { createId } from '@paralleldrive/cuid2'
import { db } from '@/lib/db'

async function submitAdmissionAction(formData: FormData) {
  // 1. Validate form
  const data = admissionApplySchema.parse(Object.fromEntries(formData))

  // 2. Generate username
  const count = await db.admission.count()
  const username = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

  // 3. Create DB admission record
  const admission = await db.admission.create({ data: { ...data, status: 'Pending' } })

  // 4. Create Better Auth account
  await auth.api.createUser({
    body: {
      email: data.email || undefined,   // optional
      name: data.nameEn,
      username,
      password: data.password,
      role: 'applicant',
    }
  })

  // 5. Link user to admission
  await db.user.update({
    where: { username },
    data: { admissionId: admission.id }
  })

  // 6. Sign in the new applicant
  // Return username so client can call signIn.username()
  return { success: true, username }
}
```

---

## Session in Server Components

```ts
// app/(admin)/admin/dashboard/page.tsx
import { getSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session || session.user.role !== 'admin') redirect('/login')

  return <div>Welcome {session.user.name}</div>
}
```

---

## Reading session in API routes

```ts
// app/api/v1/admissions/route.ts
import { requireRole } from '@/lib/auth/helpers'

export async function GET(req: Request) {
  const session = await requireRole(['admin'], req)
  // session.user.id, session.user.role available
  const admissions = await db.admission.findMany()
  return Response.json(admissions)
}
```

---

## TOTP 2FA Setup Flow (admin)

```ts
// 1. Admin generates QR code
const setup = await authClient.twoFactor.getTotpUri({ password: 'current-password' })
// show setup.totpURI as QR code

// 2. Admin scans and submits code to enable
await authClient.twoFactor.enable({ code: '123456', password: 'current-password' })

// 3. On next login, Better Auth automatically redirects to 2FA step
```
