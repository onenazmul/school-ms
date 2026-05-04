// app/api/auth/admin-signout/route.ts
import { NextResponse } from "next/server";
import { adminSignOut } from "@/lib/auth/admin";

export async function POST() {
  await adminSignOut();
  return NextResponse.json({ success: true });
}
