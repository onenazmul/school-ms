# SchoolOS — School Management System

## Stack
- **Next.js 16** (App Router, Server Components)
- **Tailwind CSS v4** + **Shadcn/UI**
- **Better Auth** (proxied to Laravel 11 API)
- **TanStack Query v5** (optimistic updates, zero-delay UX)
- **Zod** (form validation)
- **Laravel 11** (external API backend)

## Architecture

```
src/
├── app/
│   ├── (auth)/                  # Auth route group
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (admin)/                 # Admin panel
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── finance/
│   │   │   ├── ledger/
│   │   │   ├── fee-config/
│   │   │   ├── bulk-billing/
│   │   │   └── receipts/
│   │   └── layout.tsx
│   ├── (student)/               # Student portal
│   │   ├── dashboard/
│   │   ├── ledger/
│   │   └── layout.tsx
│   ├── (teacher)/               # Teacher panel
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── (public)/                # Public pages
│   │   ├── apply/               # Admission form
│   │   └── layout.tsx
│   └── layout.tsx               # Root layout
├── components/
│   ├── ui/                      # Shadcn components
│   ├── layout/                  # Shell components
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── mobile-nav.tsx
│   └── [feature]/               # Feature components
├── lib/
│   ├── api/                     # Laravel API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── auth/                    # Better Auth config
│   │   ├── server.ts
│   │   └── client.ts
│   ├── queries/                 # TanStack Query hooks
│   └── schemas/                 # Zod schemas
├── providers/
│   └── root-provider.tsx
└── middleware.ts
```
