// lib/auth/student.ts
// Auth layer for students/applicants — username+password against Laravel admission endpoints.

"use server";

import { cookies } from "next/headers";
import { SignJWT } from "jose";

const API_BASE    = process.env.API_URL ?? "https://sms-api.chalanbeel.com";
const TENANT      = process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? "school1.com";
const JWT_SECRET  = process.env.BETTER_AUTH_SECRET!;
const COOKIE_NAME = "student_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type StudentSession = {
  id: string;           // admission id
  username: string;
  name: string;
  role: "student";
  laravelToken: string;
  admissionNo: string;  // same as username
};

// ─── Internal: mint cookie from session payload ───────────────────────────────

async function mintSessionCookie(user: StudentSession) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   COOKIE_MAX_AGE,
    path:     "/",
  });
}

// ─── Sign in via login endpoint ───────────────────────────────────────────────

export async function studentSignIn(
  username: string,
  password: string
): Promise<{ success: true; user: StudentSession } | { success: false; message: string }> {
  let data: any;

  try {
    const res = await fetch(`${API_BASE}/api/admission/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Tenant-Domain": TENANT,
      },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, message: data?.message ?? "Invalid username or password" };
    }
  } catch {
    return { success: false, message: "Could not connect to server. Please try again." };
  }

  // API returns either { admission, token } or { user, token }
  const record = data.admission ?? data.user ?? {};

  const user: StudentSession = {
    id:           String(record.id ?? ""),
    username:     record.username ?? username,
    name:         record.name ?? username,
    role:         "student",
    laravelToken: data.token ?? "",
    admissionNo:  record.username ?? username,
  };

  await mintSessionCookie(user);
  return { success: true, user };
}

// ─── Sign in directly from admission apply response ──────────────────────────
// Called right after a successful POST /admission — no need for a second login call.

export async function studentSignInFromAdmission(
  admission: {
    id: number | string;
    username: string;
    name: string;
    [key: string]: any;
  },
  token: string
): Promise<{ success: true; user: StudentSession }> {
  if (!admission?.id || !admission?.username) {
    throw new Error("Invalid admission record — missing id or username.");
  }

  const user: StudentSession = {
    id:           String(admission.id),
    username:     admission.username,
    name:         admission.name ?? admission.username,
    role:         "student",
    laravelToken: token,
    admissionNo:  admission.username,
  };

  await mintSessionCookie(user);
  return { success: true, user };
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function studentSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Get session ─────────────────────────────────────────────────────────────

export async function getStudentSession(): Promise<StudentSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as StudentSession;
  } catch {
    return null;
  }
}
