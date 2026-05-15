import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { sendSms } from "@/lib/sms";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: { verdict?: string; admin_note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  // verdict: "verified" | "fake" | "return"
  const { verdict, admin_note } = body;
  if (!verdict || !["verified", "fake", "return"].includes(verdict))
    return NextResponse.json({ message: "Invalid verdict" }, { status: 422 });
  if (verdict !== "verified" && !admin_note?.trim())
    return NextResponse.json({ message: "admin_note required" }, { status: 422 });

  const sub = await db.paymentSubmission.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Generate receipt number for verified payments
  let receiptNumber: string | null = null;
  if (verdict === "verified") {
    const year = new Date().getFullYear();
    const verifiedCount = await db.paymentSubmission.count({
      where: {
        status: "verified",
        verifiedAt: { gte: new Date(`${year}-01-01`) },
      },
    });
    receiptNumber = `RCP-${year}-${String(verifiedCount + 1).padStart(5, "0")}`;
  }

  const subUpdate: Record<string, unknown> = {
    status: verdict === "verified" ? "verified" : "rejected",
    adminNote: admin_note ?? null,
  };
  if (verdict === "verified") {
    subUpdate.verifiedAt = new Date();
    subUpdate.verifiedBy = (session.user as any)?.name ?? null;
    subUpdate.receiptNumber = receiptNumber;
  }

  const admissionUpdate: Record<string, unknown> = {};
  if (sub.admissionId) {
    if (sub.paymentContext === "enrollment") {
      // Enrollment fee verification — only touches enrollmentPaymentStatus
      if (verdict === "verified") {
        admissionUpdate.enrollmentPaymentStatus = "Paid";
      } else {
        // fake or return: reset so applicant can resubmit
        admissionUpdate.enrollmentPaymentStatus = "Unpaid";
        admissionUpdate.enrollmentPaymentTrackingId = null;
      }
    } else {
      // Application fee verification (original flow)
      if (verdict === "verified") {
        admissionUpdate.paymentStatus = "Paid";
        const admission = await db.admission.findUnique({
          where: { id: sub.admissionId },
          select: { className: true },
        });
        if (admission) {
          const activeConfig = await db.admissionConfig.findFirst({
            where: { isActive: true },
            include: { classConfigs: { where: { className: admission.className } } },
          });
          const hasTestDay =
            activeConfig?.classConfigs[0]?.testDay ?? activeConfig?.globalTestDay;
          admissionUpdate.status = hasTestDay ? "Awaiting Test" : "Under Review";
          if (activeConfig) admissionUpdate.admissionConfigId = activeConfig.id;
        }
      }

      if (verdict === "fake") {
        admissionUpdate.paymentStatus = "Unpaid";
        admissionUpdate.paymentTrackingId = null;
      }

      if (verdict === "return") {
        admissionUpdate.paymentStatus = "Unpaid";
        admissionUpdate.paymentTrackingId = null;
        admissionUpdate.status = "Pending";
      }
    }
  }

  await db.$transaction([
    db.paymentSubmission.update({ where: { id }, data: subUpdate }),
    ...(sub.admissionId && Object.keys(admissionUpdate).length > 0
      ? [db.admission.update({ where: { id: sub.admissionId }, data: admissionUpdate })]
      : []),
    // Auto-mark the linked bill as paid when exam_fee payment is verified
    ...(sub.billId && sub.paymentContext === "exam_fee" && verdict === "verified"
      ? [db.bill.update({ where: { id: sub.billId }, data: { status: "paid" } })]
      : []),
  ]);

  const actionMap = { verified: "payment_verified", fake: "payment_rejected", return: "payment_returned" };
  logActivity({
    module: "payment",
    action: actionMap[verdict as keyof typeof actionMap],
    entityType: "PaymentSubmission",
    entityId: id,
    entityLabel: sub.admissionId ? String(sub.admissionId) : undefined,
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: verdict === "verified"
      ? `Payment verified by ${(session.user as any)?.name ?? "admin"}`
      : verdict === "fake"
      ? `Payment rejected (fake/unverifiable) — Note: ${admin_note}`
      : `Payment returned for correction — Note: ${admin_note}`,
    metadata: { verdict, admin_note },
  });

  // Send payment status SMS (fire-and-forget)
  if (sub.admissionId) {
    const adm = await db.admission.findUnique({
      where: { id: sub.admissionId },
      select: { nameEn: true, guardianMobileNo: true, fatherMobileNo: true, motherMobileNo: true },
    });
    const phone = adm?.guardianMobileNo ?? adm?.fatherMobileNo ?? adm?.motherMobileNo;
    if (phone && adm) {
      const isEnrollment = sub.paymentContext === "enrollment";
      const msg =
        verdict === "verified"
          ? isEnrollment
            ? `Dear Guardian, enrollment fee for ${adm.nameEn} has been verified. Please await final enrollment confirmation.`
            : `Dear Guardian, payment for ${adm.nameEn} has been verified. Your application is now under review.`
          : verdict === "fake"
          ? `Dear Guardian, the payment proof submitted for ${adm.nameEn} could not be verified. Please resubmit a valid payment proof. Note: ${admin_note}`
          : `Dear Guardian, your payment for ${adm.nameEn} has been returned for correction. Please log in and resubmit. Note: ${admin_note}`;
      sendSms({
        admissionId: sub.admissionId,
        phone,
        type: "payment_status",
        message: msg,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ message: "Submission updated", verdict });
}
