"use server";
// lib/auth/admin.ts
// Auth layer for admin staff — email+password against Laravel /api/admin/login.
// Uses the same JWT cookie pattern as student.ts.

import { cookies } from "next/headers";
import { SignJWT } from "jose";

const API_BASE    = process.env.API_URL ?? "https://sms-api.chalanbeel.com";
const TENANT      = process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? "school1.com";
const JWT_SECRET  = process.env.BETTER_AUTH_SECRET!;
const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: "admin";
  schoolId: number | null;
  laravelToken: string;
};

async function mintSessionCookie(user: AdminSession) {
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

export async function adminSignIn(
  email: string,
  password: string,
): Promise<{ success: true; user: AdminSession } | { success: false; message: string }> {
  let data: any;

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Tenant-Domain": TENANT,
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, message: data?.message ?? "Invalid credentials" };
    }
  } catch {
    return { success: false, message: "Could not connect to server. Please try again." };
  }

  const record = data.user ?? {};

  const user: AdminSession = {
    id:           String(record.id ?? ""),
    email:        record.email ?? email,
    name:         record.name ?? "Admin",
    role:         "admin",
    schoolId:     record.school_id ?? null,
    laravelToken: data.token ?? "",
  };

  await mintSessionCookie(user);
  return { success: true, user };
}

export async function adminSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}
