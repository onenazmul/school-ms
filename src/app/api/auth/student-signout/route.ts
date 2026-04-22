// app/api/auth/student-signout/route.ts
import { NextResponse } from "next/server";
import { studentSignOut } from "@/lib/auth/student";

export async function GET() {
  await studentSignOut();
  return NextResponse.redirect(
    new URL("/student-login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  );
}

export async function POST() {
  await studentSignOut();
  return NextResponse.json({ ok: true });
}
