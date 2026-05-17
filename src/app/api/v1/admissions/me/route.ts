import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { serializeAdmission } from "@/lib/serializers/admission";
import { mapAdmissionInput } from "@/lib/mappers/admission";
import { admissionEditSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activity-log";

async function getCurrentAdmissionId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { admissionId: true, username: true },
  });
  return user;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const user = await getCurrentAdmissionId(session.user.id);
    if (!user?.admissionId) {
      return NextResponse.json({ message: "No admission found for this user" }, { status: 404 });
    }

    // Try to fetch with config + mark includes; fall back to base query if Prisma client
    // doesn't yet know about the new relations (e.g. server not restarted after schema push)
    let admission: Awaited<ReturnType<typeof db.admission.findUnique>> & {
      admissionConfig?: any;
      mark?: any;
    } | null = null;

    try {
      admission = await db.admission.findUnique({
        where: { id: user.admissionId },
        include: {
          admissionConfig: { include: { classConfigs: true } },
          mark: true,
          paymentSubmissions: {
            where: { status: { in: ["verified", "pending", "under_review"] } },
            orderBy: { submittedAt: "desc" },
          },
        },
      });
    } catch {
      admission = await db.admission.findUnique({ where: { id: user.admissionId } });
    }

    if (!admission) return NextResponse.json({ message: "Admission not found" }, { status: 404 });

    const allSubmissions = (admission as any).paymentSubmissions ?? [];
    // Prefer verified, then under_review, then pending
    const rankStatus = (s: string) => s === "verified" ? 0 : s === "under_review" ? 1 : 2;
    const admissionSubs = allSubmissions
      .filter((ps: any) => ps.paymentContext === "admission")
      .sort((a: any, b: any) => rankStatus(a.status) - rankStatus(b.status));
    const enrollmentSubs = allSubmissions
      .filter((ps: any) => ps.paymentContext === "enrollment")
      .sort((a: any, b: any) => rankStatus(a.status) - rankStatus(b.status));
    const verifiedPayment = admissionSubs[0] ?? null;
    const verifiedEnrollmentPayment = enrollmentSubs[0] ?? null;
    const cfg = (admission as any).admissionConfig ?? null;
    const classOverride = cfg?.classConfigs?.find((c: any) => c.className === admission!.className) ?? null;
    const mark = (admission as any).mark ?? null;

    const testDay   = classOverride?.testDay   ?? cfg?.globalTestDay   ?? null;
    const testType  = classOverride?.testType  ?? cfg?.globalTestType  ?? null;
    const resultDay = classOverride?.resultDay ?? cfg?.resultDay       ?? null;
    const resultVisibility = cfg?.resultVisibility ?? "real_time";

    const now = new Date();
    const resultVisible =
      resultVisibility === "real_time" ||
      (resultDay != null && now >= new Date(resultDay));

    const finalStatuses = ["Enrolled", "Rejected", "Approved"];
    const showMarks = resultVisible && finalStatuses.includes(admission.status) && mark != null;

    return NextResponse.json({
      admission: {
        ...serializeAdmission(admission),
        username: user.username,
        test_day:       testDay   ? (testDay instanceof Date ? testDay.toISOString()   : testDay)   : null,
        test_type:      testType  ?? null,
        result_day:     resultDay ? (resultDay instanceof Date ? resultDay.toISOString() : resultDay) : null,
        result_visible: resultVisible,
        enrollment_fee_required: cfg?.enrollmentFeeRequired ?? false,
        enrollment_fee_amount: (() => {
          if (!cfg) return null;
          const effectiveAmount =
            cfg.enrollmentFeeMode === "per_class"
              ? (classOverride?.enrollmentFeeAmount ?? cfg.enrollmentFeeAmount)
              : cfg.enrollmentFeeAmount;
          return effectiveAmount != null ? Number(effectiveAmount) : null;
        })(),
        marks: showMarks && mark
          ? {
              written_marks: mark.writtenMarks,
              viva_marks:    mark.vivaMarks,
              total_marks:   mark.totalMarks,
            }
          : null,
        payment_submission: verifiedPayment
          ? {
              id:                   verifiedPayment.id,
              status:               verifiedPayment.status,
              method:               verifiedPayment.method,
              transaction_id:       verifiedPayment.transactionId,
              phone_number:         verifiedPayment.phoneNumber ?? null,
              amount_sent:          Number(verifiedPayment.amountSent),
              payment_date:         verifiedPayment.paymentDate instanceof Date
                                      ? verifiedPayment.paymentDate.toISOString()
                                      : verifiedPayment.paymentDate,
              account_holder_name:  verifiedPayment.accountHolderName ?? null,
              branch:               verifiedPayment.branch ?? null,
              deposit_slip_no:      verifiedPayment.depositSlipNo ?? null,
              verified_at:          verifiedPayment.verifiedAt instanceof Date
                                      ? verifiedPayment.verifiedAt.toISOString()
                                      : verifiedPayment.verifiedAt ?? null,
              verified_by:          verifiedPayment.verifiedBy ?? null,
              receipt_number:       verifiedPayment.receiptNumber ?? null,
            }
          : null,
        enrollment_payment_submission: verifiedEnrollmentPayment
          ? {
              id:                   verifiedEnrollmentPayment.id,
              status:               verifiedEnrollmentPayment.status,
              method:               verifiedEnrollmentPayment.method,
              transaction_id:       verifiedEnrollmentPayment.transactionId,
              phone_number:         verifiedEnrollmentPayment.phoneNumber ?? null,
              amount_sent:          Number(verifiedEnrollmentPayment.amountSent),
              payment_date:         verifiedEnrollmentPayment.paymentDate instanceof Date
                                      ? verifiedEnrollmentPayment.paymentDate.toISOString()
                                      : verifiedEnrollmentPayment.paymentDate,
              account_holder_name:  verifiedEnrollmentPayment.accountHolderName ?? null,
              branch:               verifiedEnrollmentPayment.branch ?? null,
              deposit_slip_no:      verifiedEnrollmentPayment.depositSlipNo ?? null,
              verified_at:          verifiedEnrollmentPayment.verifiedAt instanceof Date
                                      ? verifiedEnrollmentPayment.verifiedAt.toISOString()
                                      : verifiedEnrollmentPayment.verifiedAt ?? null,
              verified_by:          verifiedEnrollmentPayment.verifiedBy ?? null,
              receipt_number:       verifiedEnrollmentPayment.receiptNumber ?? null,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("GET /api/v1/admissions/me:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const user = await getCurrentAdmissionId(session.user.id);
    if (!user?.admissionId) {
      return NextResponse.json({ message: "No admission found for this user" }, { status: 404 });
    }

    const current = await db.admission.findUnique({ where: { id: user.admissionId } });
    if (!current) return NextResponse.json({ message: "Admission not found" }, { status: 404 });

    // Locked once payment is submitted — only Unpaid+Pending allows editing
    if (current.paymentStatus !== "Unpaid" || current.status !== "Pending") {
      return NextResponse.json(
        { message: "Application is locked. Contact the school to request changes." },
        { status: 409 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = admissionEditSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { message: `${first.path.join(".")}: ${first.message}` },
        { status: 422 },
      );
    }

    const data = mapAdmissionInput(parsed.data);
    const updated = await db.admission.update({ where: { id: user.admissionId }, data });

    logActivity({
      module: "admission",
      action: "application_edited",
      entityType: "Admission",
      entityId: String(user.admissionId),
      entityLabel: user.username ?? undefined,
      actorId: session.user.id,
      actorName: session.user.name,
      actorRole: "applicant",
      description: `Applicant ${session.user.name} edited their application`,
    });

    return NextResponse.json({
      admission: { ...serializeAdmission(updated), username: user.username },
    });
  } catch (err) {
    console.error("PUT /api/v1/admissions/me:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
