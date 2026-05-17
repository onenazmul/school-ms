import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity-log";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

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

  const submissions = await db.paymentSubmission.findMany({
    where: { studentId: user.studentId, paymentContext: { in: ["fee", "exam_fee"] } },
    orderBy: { submittedAt: "desc" },
    include: {
      submissionItems: {
        include: { bill: { include: { feeConfig: { select: { name: true } } } } },
      },
      // Legacy: single-bill submissions
      bill: { include: { feeConfig: { select: { name: true } } } },
    },
  });

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      amount_sent: Number(s.amountSent),
      method: s.method,
      transaction_id: s.transactionId,
      submitted_at: s.submittedAt.toISOString(),
      admin_note: s.adminNote ?? null,
      receipt_number: s.receiptNumber ?? null,
      verified_at: s.verifiedAt?.toISOString() ?? null,
      bills: s.submissionItems.length > 0
        ? s.submissionItems.map((item) => ({
            bill_id: item.billId,
            fee_name: item.bill.feeConfig.name,
            amount: Number(item.amount),
          }))
        : s.bill
          ? [{ bill_id: s.bill.id, fee_name: s.bill.feeConfig.name, amount: Number(s.amountSent) }]
          : [],
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any).role !== "student")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { studentId: true },
  });
  if (!user?.studentId) return NextResponse.json({ message: "Student not found" }, { status: 404 });
  const studentId = user.studentId;

  let body: {
    billIds?: string[];
    advanceItems?: { feeConfigId: string; month: string; year: string }[];
    method?: string;
    transactionId?: string;
    phoneNumber?: string;
    amountSent?: number;
    paymentDate?: string;
    notes?: string;
    screenshotUrl?: string;
    accountHolderName?: string;
    branch?: string;
    depositSlipNo?: string;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const {
    billIds = [],
    advanceItems = [],
    method,
    transactionId,
    phoneNumber,
    amountSent,
    paymentDate,
    notes,
    screenshotUrl,
    accountHolderName,
    branch,
    depositSlipNo,
  } = body;

  if (!method || !amountSent || !paymentDate)
    return NextResponse.json({ message: "method, amountSent, paymentDate are required" }, { status: 422 });
  if (!transactionId && method !== "bank_transfer")
    return NextResponse.json({ message: "transactionId is required" }, { status: 422 });
  if (billIds.length === 0 && advanceItems.length === 0)
    return NextResponse.json({ message: "Select at least one bill or advance month to pay" }, { status: 422 });

  const parsedDate = new Date(paymentDate);
  if (isNaN(parsedDate.getTime()))
    return NextResponse.json({ message: "Invalid paymentDate" }, { status: 422 });

  let resolvedBillIds: string[] = [...billIds];

  // ── Validate existing bills ────────────────────────────────────────────────
  if (billIds.length > 0) {
    const bills = await db.bill.findMany({
      where: { id: { in: billIds }, studentId },
      include: {
        submissionItems: {
          include: { submission: { select: { status: true } } },
        },
        paymentSubmissions: {
          where: { status: { in: ["pending", "under_review"] } },
          select: { id: true },
        },
      },
    });

    if (bills.length !== billIds.length)
      return NextResponse.json({ message: "One or more bills not found" }, { status: 422 });

    for (const bill of bills) {
      if (bill.status === "paid" || bill.status === "waived")
        return NextResponse.json({ message: `Bill is already ${bill.status}` }, { status: 409 });

      const hasPending =
        bill.submissionItems.some((si) =>
          si.submission.status === "pending" || si.submission.status === "under_review"
        ) || bill.paymentSubmissions.length > 0;

      if (hasPending)
        return NextResponse.json({ message: "A pending submission already exists for one of the selected bills" }, { status: 409 });
    }
  }

  // ── Auto-create advance bills ──────────────────────────────────────────────
  if (advanceItems.length > 0) {
    const student = await db.student.findUnique({ where: { id: studentId }, select: { className: true } });
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    for (const item of advanceItems) {
      if (!item.feeConfigId || !item.month || !item.year)
        return NextResponse.json({ message: "Each advanceItem needs feeConfigId, month, year" }, { status: 422 });
      if (!MONTHS.includes(item.month))
        return NextResponse.json({ message: `Invalid month: ${item.month}` }, { status: 422 });

      const feeConfig = await db.feeConfig.findUnique({ where: { id: item.feeConfigId } });
      if (!feeConfig?.isActive)
        return NextResponse.json({ message: `Fee config not found or inactive` }, { status: 422 });

      const applicableClasses = feeConfig.applicableClasses
        ? JSON.parse(feeConfig.applicableClasses as string) as string[]
        : [];
      if (!applicableClasses.includes(student.className))
        return NextResponse.json({ message: `Fee "${feeConfig.name}" does not apply to your class` }, { status: 422 });

      const existing = await db.bill.findFirst({
        where: { studentId, feeConfigId: item.feeConfigId, month: item.month, academicYear: item.year },
      });

      if (existing) {
        if (existing.status === "paid" || existing.status === "waived")
          return NextResponse.json({ message: `Bill for ${item.month} ${item.year} is already ${existing.status}` }, { status: 409 });
        resolvedBillIds.push(existing.id);
      } else {
        const monthIndex = MONTHS.indexOf(item.month);
        const dueDay = feeConfig.dueDay ?? 15;
        const dueDate = new Date(`${item.year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`);

        const newBill = await db.bill.create({
          data: {
            id: createId(),
            studentId,
            feeConfigId: item.feeConfigId,
            amount: feeConfig.amount,
            lateFee: 0,
            dueDate,
            month: item.month,
            academicYear: item.year,
            status: "unpaid",
          },
        });
        resolvedBillIds.push(newBill.id);
      }
    }
    resolvedBillIds = [...new Set(resolvedBillIds)];
  }

  // ── Get bill amounts ───────────────────────────────────────────────────────
  const allBills = await db.bill.findMany({
    where: { id: { in: resolvedBillIds } },
    select: { id: true, amount: true, lateFee: true },
  });

  const effectiveTxnId = method === "bank_transfer" ? (depositSlipNo ?? transactionId ?? "") : (transactionId ?? "");

  // ── Create submission + items ──────────────────────────────────────────────
  const submissionId = createId();

  await db.paymentSubmission.create({
    data: {
      id: submissionId,
      studentId,
      paymentContext: "fee",
      method: method!,
      transactionId: effectiveTxnId,
      phoneNumber: phoneNumber ?? null,
      amountSent,
      paymentDate: parsedDate,
      notes: notes ?? null,
      screenshotUrl: screenshotUrl ?? null,
      accountHolderName: accountHolderName ?? null,
      branch: branch ?? null,
      depositSlipNo: depositSlipNo ?? null,
      status: "pending",
      submissionItems: {
        create: allBills.map((b) => ({
          id: createId(),
          billId: b.id,
          amount: Number(b.amount) + Number(b.lateFee),
        })),
      },
    },
  });

  logActivity({
    module: "payment",
    action: "payment_submitted",
    entityType: "PaymentSubmission",
    entityId: submissionId,
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: "student",
    description: `Payment proof submitted via ${method} for ${resolvedBillIds.length} bill(s) — ৳${amountSent}`,
    metadata: { method, amountSent, billIds: resolvedBillIds },
  });

  return NextResponse.json({ id: submissionId, message: "Payment submitted for verification" }, { status: 201 });
}
