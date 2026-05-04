// app/api/auth/admin-session/route.ts
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";

export async function GET() {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
