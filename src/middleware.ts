// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { jwtVerify } from "jose";

// ─── Route maps ──────────────────────────────────────────────────────────────

const STAFF_ROLE_HOME: Record<string, string> = {
  admin:   "/admin/dashboard",
  teacher: "/teacher/dashboard",
};
const STAFF_ROLE_PREFIX: Record<string, string> = {
  admin:   "/admin",
  teacher: "/teacher",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCookieSession(req: NextRequest, cookieName: string) {
  try {
    const token = req.cookies.get(cookieName)?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

function getStudentCookieSession(req: NextRequest) {
  return getCookieSession(req, "student_session");
}

function getAdminCookieSession(req: NextRequest) {
  return getCookieSession(req, "admin_session");
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Fully public paths ────────────────────────────────────────────────────
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/student-login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // ── Apply paths — redirect logged-in applicants away from form & login ────
  if (pathname === "/apply" || pathname === "/apply/login") {
    const session = await getStudentCookieSession(req);
    if (session) {
      return NextResponse.redirect(new URL("/admission/dashboard", req.url));
    }
    return NextResponse.next();
  }
  // All other /apply/* sub-paths (forgot-password, etc.) are always public
  if (pathname.startsWith("/apply")) {
    return NextResponse.next();
  }

  // ── Admission portal (/admission/*) — guarded by student_session cookie ─────
  // Separate from the student panel; for applicants who have not yet enrolled.
  if (pathname.startsWith("/admission")) {
    const admissionSession = await getStudentCookieSession(req);
    if (!admissionSession) {
      const dest = new URL("/apply/login", req.url);
      dest.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(dest);
    }
    const headers = new Headers(req.headers);
    headers.set("x-user-id",       admissionSession.id          ?? "");
    headers.set("x-user-role",     "student");
    headers.set("x-username",      admissionSession.username     ?? "");
    headers.set("x-laravel-token", admissionSession.laravelToken ?? "");
    return NextResponse.next({ request: { headers } });
  }

  // ── Student panel (/student/*) — guarded by student_session cookie ────────
  // For enrolled students only (separate from admission portal).
  if (pathname.startsWith("/student")) {
    const studentSession = await getStudentCookieSession(req);
    if (!studentSession) {
      const dest = new URL("/student-login", req.url);
      dest.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(dest);
    }
    const headers = new Headers(req.headers);
    headers.set("x-user-id",       studentSession.id            ?? "");
    headers.set("x-user-role",     "student");
    headers.set("x-username",      studentSession.username       ?? "");
    headers.set("x-laravel-token", studentSession.laravelToken   ?? "");
    return NextResponse.next({ request: { headers } });
  }

  // ── Admin panel (/admin) — guarded by admin_session JWT cookie ───────────
  if (pathname.startsWith("/admin")) {
    if (process.env.DEV_OPEN_STAFF === "true") {
      const headers = new Headers(req.headers);
      headers.set("x-user-id",       "dev-admin");
      headers.set("x-user-role",     "admin");
      headers.set("x-laravel-token", "dev-token");
      return NextResponse.next({ request: { headers } });
    }

    const session = await getAdminCookieSession(req);

    if (!session) {
      const dest = new URL("/login", req.url);
      dest.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(dest);
    }

    const headers = new Headers(req.headers);
    headers.set("x-user-id",       session.id            ?? "");
    headers.set("x-user-role",     "admin");
    headers.set("x-laravel-token", session.laravelToken   ?? "");
    return NextResponse.next({ request: { headers } });
  }

  // ── Teacher panel (/teacher) — guarded by Better Auth session ────────────
  if (pathname.startsWith("/teacher")) {
    if (process.env.DEV_OPEN_STAFF === "true") {
      const headers = new Headers(req.headers);
      headers.set("x-user-id",       "dev-teacher");
      headers.set("x-user-role",     "teacher");
      headers.set("x-laravel-token", "dev-token");
      return NextResponse.next({ request: { headers } });
    }

    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      const dest = new URL("/login", req.url);
      dest.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(dest);
    }

    const user = session.user as any;
    const headers = new Headers(req.headers);
    headers.set("x-user-id",       user.id             ?? "");
    headers.set("x-user-role",     "teacher");
    headers.set("x-laravel-token", user.laravelToken    ?? "");
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
