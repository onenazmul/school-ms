import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any).role !== "student")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { studentId: true },
  });
  if (!user?.studentId) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  const bills = await db.bill.findMany({
    where: { studentId: user.studentId },
    include: {
      feeConfig: { select: { id: true, name: true, type: true } },
      paymentSubmissions: {
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          status: true,
          amountSent: true,
          method: true,
          transactionId: true,
          submittedAt: true,
          adminNote: true,
          receiptNumber: true,
          verifiedAt: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    bills: bills.map((b) => ({
      id: b.id,
      fee_name: b.feeConfig.name,
      fee_type: b.feeConfig.type,
      fee_config_id: b.feeConfig.id,
      amount: Number(b.amount),
      late_fee: Number(b.lateFee),
      total: Number(b.amount) + Number(b.lateFee),
      due_date: b.dueDate.toISOString().split("T")[0],
      month: b.month ?? null,
      academic_year: b.academicYear,
      status: b.status,
      created_at: b.createdAt.toISOString(),
      submissions: b.paymentSubmissions.map((s) => ({
        id: s.id,
        status: s.status,
        amount_sent: Number(s.amountSent),
        method: s.method,
        transaction_id: s.transactionId,
        submitted_at: s.submittedAt.toISOString(),
        admin_note: s.adminNote ?? null,
        receipt_number: s.receiptNumber ?? null,
        verified_at: s.verifiedAt?.toISOString() ?? null,
      })),
    })),
  });
}
