import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";
import { logActivity } from "@/lib/activity-log";

// POST /api/v1/admin/bills — create a single bill for one student
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: {
    studentId?: string;
    feeConfigId?: string;
    month?: string;
    year?: string;
    dueDate?: string;
    overrideAmount?: number;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const { studentId, feeConfigId, month, year, dueDate, overrideAmount } = body;
  if (!studentId || !feeConfigId || !year || !dueDate)
    return NextResponse.json({ message: "studentId, feeConfigId, year, dueDate are required" }, { status: 422 });
  if (month && !MONTHS.includes(month))
    return NextResponse.json({ message: "Invalid month" }, { status: 422 });

  const parsedDue = new Date(dueDate);
  if (isNaN(parsedDue.getTime()))
    return NextResponse.json({ message: "Invalid dueDate" }, { status: 422 });

  const [student, feeConfig] = await Promise.all([
    db.student.findUnique({ where: { id: studentId }, select: { id: true } }),
    db.feeConfig.findUnique({ where: { id: feeConfigId } }),
  ]);
  if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });
  if (!feeConfig) return NextResponse.json({ message: "Fee config not found" }, { status: 404 });

  const amount = overrideAmount != null ? overrideAmount : Number(feeConfig.amount);

  const bill = await db.bill.create({
    data: {
      id: createId(),
      studentId,
      feeConfigId,
      amount,
      lateFee: 0,
      dueDate: parsedDue,
      month: month ?? null,
      academicYear: year,
      status: "unpaid",
    },
    include: { feeConfig: { select: { name: true, type: true } } },
  });

  logActivity({
    module: "fee",
    action: "bill_created",
    entityType: "Bill",
    entityId: bill.id,
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Admin created bill "${feeConfig.name}" for student ${studentId}`,
    metadata: { studentId, feeConfigId, month, year, amount },
  });

  return NextResponse.json({
    bill: {
      id: bill.id,
      fee_name: bill.feeConfig.name,
      fee_type: bill.feeConfig.type,
      amount: Number(bill.amount),
      late_fee: Number(bill.lateFee),
      total: Number(bill.amount) + Number(bill.lateFee),
      due_date: bill.dueDate.toISOString().split("T")[0],
      month: bill.month,
      academic_year: bill.academicYear,
      status: bill.status,
    },
  }, { status: 201 });
}
