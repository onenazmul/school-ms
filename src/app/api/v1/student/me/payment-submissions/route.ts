import { NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity-log";

const submitSchema = z.object({
  billId: z.string().min(1, "billId is required"),
  method: z.enum(["bkash", "rocket", "bank_transfer"]),
  transactionId: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  accountHolderName: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  depositSlipNo: z.string().optional().nullable(),
  amountSent: z.coerce.number().positive(),
  paymentDate: z.string().min(1),
  notes: z.string().optional().nullable(),
});

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
    where: { studentId: user.studentId, paymentContext: "exam_fee" },
    include: { bill: { include: { feeConfig: { select: { name: true } } } } },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      bill_id: s.billId ?? null,
      bill_name: s.bill?.feeConfig.name ?? null,
      method: s.method,
      transaction_id: s.transactionId,
      phone_number: s.phoneNumber ?? null,
      amount_sent: Number(s.amountSent),
      payment_date: s.paymentDate.toISOString().split("T")[0],
      notes: s.notes ?? null,
      status: s.status,
      admin_note: s.adminNote ?? null,
      receipt_number: s.receiptNumber ?? null,
      verified_at: s.verifiedAt?.toISOString() ?? null,
      submitted_at: s.submittedAt.toISOString(),
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { message: `${first.path.join(".")}: ${first.message}` },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Verify the bill belongs to this student
  const bill = await db.bill.findFirst({
    where: { id: d.billId, studentId: user.studentId },
  });
  if (!bill) return NextResponse.json({ message: "Bill not found" }, { status: 404 });
  if (bill.status === "paid" || bill.status === "waived") {
    return NextResponse.json({ message: "This bill is already settled" }, { status: 409 });
  }

  // Check for an existing pending submission for this bill
  const existingPending = await db.paymentSubmission.findFirst({
    where: {
      billId: d.billId,
      studentId: user.studentId,
      status: { in: ["pending", "under_review"] },
    },
  });
  if (existingPending) {
    return NextResponse.json(
      { message: "A payment submission is already under review for this bill" },
      { status: 409 },
    );
  }

  const txnId =
    d.method === "bank_transfer" ? (d.depositSlipNo ?? "") : (d.transactionId ?? "");

  const submission = await db.paymentSubmission.create({
    data: {
      id: createId(),
      studentId: user.studentId,
      billId: d.billId,
      paymentContext: "exam_fee",
      method: d.method,
      transactionId: txnId,
      phoneNumber: d.phoneNumber ?? null,
      amountSent: d.amountSent,
      paymentDate: new Date(d.paymentDate),
      notes: d.notes ?? null,
      accountHolderName: d.accountHolderName ?? null,
      branch: d.branch ?? null,
      depositSlipNo: d.depositSlipNo ?? null,
      status: "pending",
    },
  });

  logActivity({
    module: "payment",
    action: "payment_submitted",
    entityType: "PaymentSubmission",
    entityId: submission.id,
    entityLabel: d.billId,
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: "student",
    description: `Exam fee payment proof submitted via ${d.method} — ৳${d.amountSent}`,
    metadata: { method: d.method, amount: d.amountSent, billId: d.billId },
  });

  return NextResponse.json({ submission: { id: submission.id } }, { status: 201 });
}
