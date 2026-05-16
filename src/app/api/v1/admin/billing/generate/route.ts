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

  let body: {
    feeConfigId?: string;
    classes?: string[];
    month?: string;
    year?: number;
    dueDate?: string;
    overrideAmount?: number;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { feeConfigId, classes, month, year, dueDate, overrideAmount } = body;

  if (!feeConfigId || !classes?.length || !year || !dueDate)
    return NextResponse.json({ message: "feeConfigId, classes, year, dueDate are required" }, { status: 422 });

  if (month && !MONTHS.includes(month))
    return NextResponse.json({ message: "Invalid month" }, { status: 422 });

  const parsedDue = new Date(dueDate);
  if (isNaN(parsedDue.getTime()))
    return NextResponse.json({ message: "Invalid dueDate" }, { status: 422 });

  const feeConfig = await db.feeConfig.findUnique({ where: { id: feeConfigId } });
  if (!feeConfig) return NextResponse.json({ message: "Fee config not found" }, { status: 404 });

  const amount = overrideAmount != null ? overrideAmount : Number(feeConfig.amount);

  // Find all active students in the given classes
  const students = await db.student.findMany({
    where: { className: { in: classes }, status: "Active" },
    select: { id: true, className: true },
  });

  if (students.length === 0)
    return NextResponse.json({ created: 0, skipped: 0, message: "No active students found in selected classes" });

  // Check which bills already exist to avoid duplicates
  const academicYear = String(year);
  const existingBills = await db.bill.findMany({
    where: {
      feeConfigId,
      studentId: { in: students.map((s) => s.id) },
      academicYear,
      ...(month ? { month } : {}),
    },
    select: { studentId: true },
  });
  const alreadyBilled = new Set(existingBills.map((b) => b.studentId));

  const toCreate = students.filter((s) => !alreadyBilled.has(s.id));

  if (toCreate.length > 0) {
    await db.bill.createMany({
      data: toCreate.map((s) => ({
        id: createId(),
        studentId: s.id,
        feeConfigId,
        amount,
        lateFee: 0,
        dueDate: parsedDue,
        month: month ?? null,
        academicYear,
        status: "unpaid",
      })),
    });
  }

  logActivity({
    module: "fee",
    action: "bulk_generated",
    entityType: "Bill",
    entityId: feeConfigId,
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Admin generated ${toCreate.length} bills for ${feeConfig.name}${month ? ` (${month} ${year})` : ` (${year})`} across classes: ${classes.join(", ")}`,
    metadata: { feeConfigId, classes, month, year, dueDate, created: toCreate.length, skipped: alreadyBilled.size },
  });

  return NextResponse.json({
    created: toCreate.length,
    skipped: alreadyBilled.size,
    total_students: students.length,
    message: `${toCreate.length} bills created, ${alreadyBilled.size} skipped (already existed)`,
  });
}
