import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — returns only name + phone for display on public-facing pages
export async function GET() {
  const setting = await db.schoolSetting.findFirst({ where: { id: 1 } });
  return NextResponse.json({
    name:  setting?.name  ?? "",
    phone: setting?.phone ?? "",
  });
}
