import { NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity-log";

const paymentSchema = z.object({
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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { admissionId: true },
  });
  if (!user?.admissionId)
    return NextResponse.json({ message: "No admission found for this user" }, { status: 404 });

  const admission = await db.admission.findUnique({ where: { id: user.admissionId } });
  if (!admission)
    return NextResponse.json({ message: "Admission not found" }, { status: 404 });

  // Only allowed once application is Approved
  if (admission.status !== "Approved")
    return NextResponse.json(
      { message: "Enrollment fee can only be paid after your application is approved." },
      { status: 409 },
    );

  // Already paid — no need to resubmit
  if (admission.enrollmentPaymentStatus === "Paid")
    return NextResponse.json(
      { message: "Enrollment fee has already been verified." },
      { status: 409 },
    );

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ message: `${first.path.join(".")}: ${first.message}` }, { status: 422 });
  }
  const d = parsed.data;

  const txnId =
    d.method === "bank_transfer" ? (d.depositSlipNo ?? "") : (d.transactionId ?? "");

  const submission = await db.paymentSubmission.create({
    data: {
      id: createId(),
      admissionId: user.admissionId,
      paymentContext: "enrollment",
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

  await db.admission.update({
    where: { id: user.admissionId },
    data: {
      enrollmentPaymentStatus: "Payment Submitted",
      enrollmentPaymentTrackingId: submission.id,
    },
  });

  logActivity({
    module: "payment",
    action: "enrollment_payment_submitted",
    entityType: "PaymentSubmission",
    entityId: submission.id,
    entityLabel: String(user.admissionId),
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: "applicant",
    description: `Enrollment fee proof submitted via ${d.method} — ৳${d.amountSent}`,
    metadata: { method: d.method, amount: d.amountSent },
  });

  return NextResponse.json({ submission });
}
