// app/api/auth/student-session/route.ts
import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student";

export async function GET() {
  const user = await getStudentSession();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
