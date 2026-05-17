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

  const student = await db.student.findUnique({
    where: { id: user.studentId },
    select: { className: true },
  });

  const [bills, applicableFeeConfigs] = await Promise.all([
    db.bill.findMany({
      where: { studentId: user.studentId },
      include: {
        feeConfig: { select: { id: true, name: true, type: true } },
        submissionItems: {
          include: {
            submission: {
              select: { id: true, status: true, amountSent: true, method: true, receiptNumber: true, verifiedAt: true, adminNote: true, submittedAt: true },
            },
          },
        },
        // Legacy single-bill submissions
        paymentSubmissions: {
          orderBy: { submittedAt: "desc" },
          select: {
            id: true, status: true, amountSent: true, method: true,
            transactionId: true, submittedAt: true, adminNote: true,
            receiptNumber: true, verifiedAt: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    // Fee configs applicable to this student's class
    student
      ? db.feeConfig.findMany({
          where: { isActive: true },
          select: { id: true, name: true, type: true, amount: true, applicableClasses: true, dueDay: true, dueDate: true },
        })
      : Promise.resolve([]),
  ]);

  // Filter fee configs applicable to the student's class
  const myFeeConfigs = (applicableFeeConfigs as any[]).filter((fc) => {
    const classes: string[] = fc.applicableClasses ? JSON.parse(fc.applicableClasses as string) as string[] : [];
    return classes.includes(student?.className ?? "");
  });

  return NextResponse.json({
    bills: bills.map((b) => {
      // Merge submissions from both legacy (paymentSubmissions) and new (submissionItems → submission)
      const legacySubs = b.paymentSubmissions.map((s) => ({
        id: s.id,
        status: s.status,
        amount_sent: Number(s.amountSent),
        method: s.method,
        receipt_number: s.receiptNumber ?? null,
        verified_at: s.verifiedAt?.toISOString() ?? null,
      }));
      const newSubs = b.submissionItems.map((si) => ({
        id: si.submission.id,
        status: si.submission.status,
        amount_sent: Number(si.submission.amountSent),
        method: si.submission.method,
        receipt_number: si.submission.receiptNumber ?? null,
        verified_at: si.submission.verifiedAt?.toISOString() ?? null,
      }));

      // Deduplicate by submission id
      const seenIds = new Set<string>();
      const submissions = [...legacySubs, ...newSubs].filter((s) => {
        if (seenIds.has(s.id)) return false;
        seenIds.add(s.id);
        return true;
      });

      return {
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
        submissions,
      };
    }),
    // Available fee configs for advance payment
    fee_configs: myFeeConfigs.map((fc) => ({
      id: fc.id,
      name: fc.name,
      type: fc.type,
      amount: Number(fc.amount),
      due_day: fc.dueDay ?? null,
      due_date: fc.dueDate ? fc.dueDate.toISOString().split("T")[0] : null,
    })),
  });
}
