import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/server";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const setting = await db.schoolSetting.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return NextResponse.json({
    setting: {
      ...setting,
      academic_year: setting.academicYear,
      weekly_off_days: JSON.parse(setting.weeklyOffDays || "[]") as string[],
    },
  });
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const { name, address, city, phone, email, website, eiin, established, academic_year, weekly_off_days } = body;

  const setting = await db.schoolSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name:         name        ?? "",
      address:      address     ?? "",
      city:         city        ?? "",
      phone:        phone       ?? "",
      email:        email       ?? "",
      website:      website     ?? "",
      eiin:         eiin        ?? "",
      established:  established ?? "",
      academicYear: academic_year ?? "",
      weeklyOffDays: Array.isArray(weekly_off_days) ? JSON.stringify(weekly_off_days) : "[]",
    },
    update: {
      ...(name          !== undefined && { name }),
      ...(address       !== undefined && { address }),
      ...(city          !== undefined && { city }),
      ...(phone         !== undefined && { phone }),
      ...(email         !== undefined && { email }),
      ...(website       !== undefined && { website }),
      ...(eiin          !== undefined && { eiin }),
      ...(established   !== undefined && { established }),
      ...(academic_year !== undefined && { academicYear: academic_year }),
      ...(weekly_off_days !== undefined && { weeklyOffDays: JSON.stringify(weekly_off_days) }),
    },
  });
  return NextResponse.json({
    setting: {
      ...setting,
      academic_year: setting.academicYear,
      weekly_off_days: JSON.parse(setting.weeklyOffDays || "[]") as string[],
    },
  });
}
