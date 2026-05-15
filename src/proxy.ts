import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public paths ─────────────────────────────────────────────────────────
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/v1/uploads") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/student-login"
  ) {
    return NextResponse.next();
  }

  // ── /apply — public form, redirect away if already logged in ──────────────
  if (pathname === "/apply" || pathname === "/apply/login") {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session) {
      const role = (session.user as any).role as string;
      const dest = role === "student" ? "/student/dashboard" : "/admission/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/apply")) return NextResponse.next();

  // ── All protected paths: get session once ────────────────────────────────
  const session = await auth.api.getSession({ headers: req.headers });
  const role = (session?.user as any)?.role as string | undefined;

  function redirectToLogin(loginPath: string) {
    const dest = new URL(loginPath, req.url);
    dest.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(dest);
  }

  function withUserHeaders() {
    const h = new Headers(req.headers);
    h.set("x-user-id", session!.user.id);
    h.set("x-user-role", role!);
    if ((session!.user as any).username) {
      h.set("x-username", (session!.user as any).username);
    }
    return NextResponse.next({ request: { headers: h } });
  }

  // ── /admin/* ──────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session || role !== "admin") return redirectToLogin("/login");
    return withUserHeaders();
  }

  // ── /teacher/* ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/teacher")) {
    if (!session || role !== "teacher") return redirectToLogin("/login");
    return withUserHeaders();
  }

  // ── /admission/* — applicants and enrolled students ───────────────────────
  if (pathname.startsWith("/admission")) {
    if (!session || (role !== "applicant" && role !== "student")) {
      return redirectToLogin("/apply/login");
    }
    return withUserHeaders();
  }

  // ── /student/* — enrolled students only ──────────────────────────────────
  if (pathname.startsWith("/student")) {
    if (!session || role !== "student") return redirectToLogin("/student-login");
    return withUserHeaders();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
