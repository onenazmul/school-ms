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
      academic_year:   setting.academicYear,
      session_start:   setting.sessionStart   ?? "",
      session_end:     setting.sessionEnd     ?? "",
      grading_system:  setting.gradingSystem  ?? "gpa",
      weekly_off_days: JSON.parse(setting.weeklyOffDays || "[]") as string[],
      admit_card_rules: JSON.parse(setting.admitCardRules || "[]") as string[],
    },
  });
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const {
    name, address, city, phone, email, website, eiin, established,
    academic_year, session_start, session_end, grading_system, weekly_off_days, admit_card_rules,
  } = body;

  const setting = await db.schoolSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name:          name         ?? "",
      address:       address      ?? "",
      city:          city         ?? "",
      phone:         phone        ?? "",
      email:         email        ?? "",
      website:       website      ?? "",
      eiin:          eiin         ?? "",
      established:   established  ?? "",
      academicYear:  academic_year  ?? "",
      sessionStart:  session_start  ?? "",
      sessionEnd:    session_end    ?? "",
      gradingSystem: grading_system ?? "gpa",
      weeklyOffDays: Array.isArray(weekly_off_days) ? JSON.stringify(weekly_off_days) : "[]",
      admitCardRules: Array.isArray(admit_card_rules) ? JSON.stringify(admit_card_rules) : "[]",
    },
    update: {
      ...(name           !== undefined && { name }),
      ...(address        !== undefined && { address }),
      ...(city           !== undefined && { city }),
      ...(phone          !== undefined && { phone }),
      ...(email          !== undefined && { email }),
      ...(website        !== undefined && { website }),
      ...(eiin           !== undefined && { eiin }),
      ...(established    !== undefined && { established }),
      ...(academic_year  !== undefined && { academicYear: academic_year }),
      ...(session_start  !== undefined && { sessionStart: session_start }),
      ...(session_end    !== undefined && { sessionEnd: session_end }),
      ...(grading_system !== undefined && { gradingSystem: grading_system }),
      ...(weekly_off_days !== undefined && { weeklyOffDays: JSON.stringify(weekly_off_days) }),
      ...(admit_card_rules !== undefined && { admitCardRules: JSON.stringify(admit_card_rules) }),
    },
  });
  return NextResponse.json({
    setting: {
      ...setting,
      academic_year:   setting.academicYear,
      session_start:   setting.sessionStart   ?? "",
      session_end:     setting.sessionEnd     ?? "",
      grading_system:  setting.gradingSystem  ?? "gpa",
      weekly_off_days: JSON.parse(setting.weeklyOffDays || "[]") as string[],
      admit_card_rules: JSON.parse(setting.admitCardRules || "[]") as string[],
    },
  });
}
