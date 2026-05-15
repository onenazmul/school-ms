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
  if (!user?.admissionId) {
    return NextResponse.json({ message: "No admission found for this user" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { message: `${first.path.join(".")}: ${first.message}` },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Build a single transaction identifier — either online txn ID or deposit slip
  const txnId =
    d.method === "bank_transfer"
      ? (d.depositSlipNo ?? "")
      : (d.transactionId ?? "");

  const submission = await db.paymentSubmission.create({
    data: {
      id: createId(),
      admissionId: user.admissionId,
      paymentContext: "admission",
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

  // Mark admission: payment submitted, application moves to Under Review
  await db.admission.update({
    where: { id: user.admissionId },
    data: {
      paymentTrackingId: submission.id,
      paymentStatus: "Payment Submitted",
      status: "Under Review",
    },
  });

  logActivity({
    module: "payment",
    action: "payment_submitted",
    entityType: "PaymentSubmission",
    entityId: submission.id,
    entityLabel: `${user.admissionId}`,
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: "applicant",
    description: `Payment proof submitted via ${d.method} — ৳${d.amountSent}`,
    metadata: { method: d.method, amount: d.amountSent },
  });

  return NextResponse.json({ submission });
}
