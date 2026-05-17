import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";
import { logActivity } from "@/lib/activity-log";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const now = new Date();
  const currentMonth = MONTHS[now.getMonth()];
  const currentYear = String(now.getFullYear());

  // Optional: allow caller to override month/year
  let body: { month?: string; year?: string } = {};
  try { body = await req.json(); } catch { /* optional body */ }
  const month = body.month ?? currentMonth;
  const year = body.year ?? currentYear;

  if (!MONTHS.includes(month))
    return NextResponse.json({ message: "Invalid month" }, { status: 422 });

  // All active monthly fee configs
  const feeConfigs = await db.feeConfig.findMany({
    where: { isActive: true, type: "monthly" },
  });

  if (feeConfigs.length === 0)
    return NextResponse.json({ message: "No active monthly fee configs found", created: 0, skipped: 0 });

  const results: { feeName: string; created: number; skipped: number }[] = [];
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const fee of feeConfigs) {
    const applicableClasses: string[] = fee.applicableClasses
      ? JSON.parse(fee.applicableClasses as string) as string[]
      : [];
    if (applicableClasses.length === 0) continue;

    // Compute due date: dueDay of current month
    const dueDay = fee.dueDay ?? 15;
    const dueDate = new Date(`${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`);

    const students = await db.student.findMany({
      where: { className: { in: applicableClasses }, status: "Active" },
      select: { id: true },
    });

    if (students.length === 0) continue;

    const existing = await db.bill.findMany({
      where: {
        feeConfigId: fee.id,
        studentId: { in: students.map((s) => s.id) },
        academicYear: year,
        month,
      },
      select: { studentId: true },
    });
    const alreadyBilled = new Set(existing.map((b) => b.studentId));
    const toCreate = students.filter((s) => !alreadyBilled.has(s.id));

    if (toCreate.length > 0) {
      await db.bill.createMany({
        data: toCreate.map((s) => ({
          id: createId(),
          studentId: s.id,
          feeConfigId: fee.id,
          amount: fee.amount,
          lateFee: 0,
          dueDate,
          month,
          academicYear: year,
          status: "unpaid",
        })),
      });
    }

    results.push({ feeName: fee.name, created: toCreate.length, skipped: alreadyBilled.size });
    totalCreated += toCreate.length;
    totalSkipped += alreadyBilled.size;
  }

  logActivity({
    module: "fee",
    action: "auto_generated",
    entityType: "Bill",
    entityId: "auto",
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Auto-generated ${totalCreated} bills for ${month} ${year}`,
    metadata: { month, year, results },
  });

  return NextResponse.json({
    month,
    year,
    created: totalCreated,
    skipped: totalSkipped,
    details: results,
  });
}
