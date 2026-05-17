// app/api/documents/payment-receipt/[submissionId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import {
  PaymentReceiptPDF, type ReceiptData,
} from "@/components/documents/pdf/PaymentReceiptPDF";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });

  const { submissionId } = await params;

  const [submission, schoolSetting] = await Promise.all([
    db.paymentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        admission: { select: { nameEn: true, className: true, sessionName: true } },
        student: {
          select: {
            className: true,
            rollNumber: true,
            user: { select: { username: true } },
            admission: { select: { nameEn: true } },
          },
        },
      },
    }),
    db.schoolSetting.findUnique({ where: { id: 1 } }),
  ]);

  if (!submission) {
    return new Response(JSON.stringify({ error: "Submission not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Allow receipt for any submitted status (pending, under_review, verified)
  const printableStatuses = ["pending", "under_review", "verified"];
  if (!printableStatuses.includes(submission.status)) {
    return new Response(JSON.stringify({ error: "Receipt not available for this submission status" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const schoolInfo = {
    name: schoolSetting?.name ?? "School Name",
    address: [schoolSetting?.address, schoolSetting?.city].filter(Boolean).join(", ") || "—",
    phone: schoolSetting?.phone ?? "—",
    email: schoolSetting?.email ?? "—",
  };

  const receiptDate = new Date().toISOString().slice(0, 10);
  const amountPaid = Number(submission.amountSent);

  const subItem = {
    id: submission.id,
    status: submission.status,
    method: submission.method,
    transactionId: submission.transactionId,
    phoneNumber: submission.phoneNumber ?? null,
    amountSent: amountPaid,
    paymentDate: submission.paymentDate.toISOString().slice(0, 10),
  };

  let data: ReceiptData;

  if (submission.paymentContext === "admission") {
    data = {
      receiptNumber: submission.receiptNumber ?? `PRV-${new Date().getFullYear()}-${submission.admissionId}`,
      receiptDate,
      payerName: submission.admission?.nameEn ?? "Applicant",
      paymentContext: "admission",
      applicationId: submission.admissionId ? String(submission.admissionId) : undefined,
      classApplied: submission.admission?.className ?? undefined,
      academicYear: submission.admission?.sessionName ?? new Date().getFullYear().toString(),
      feeType: "Admission Fee",
      totalFee: amountPaid,
      amountPaid,
      balanceDue: 0,
      submissions: [subItem],
      status: submission.status,
      verifiedBy: submission.verifiedBy ?? undefined,
      verifiedAt: submission.verifiedAt?.toISOString() ?? undefined,
      schoolInfo,
    };
  } else {
    const username = submission.student?.user?.username ?? undefined;
    data = {
      receiptNumber: submission.receiptNumber ?? `PRV-${new Date().getFullYear()}-${submission.studentId}`,
      receiptDate,
      payerName: submission.student?.admission?.nameEn ?? "Student",
      paymentContext: submission.paymentContext as "exam_fee" | "enrollment",
      studentId: username ?? submission.studentId ?? undefined,
      studentClass: submission.student?.className ?? undefined,
      rollNumber: submission.student?.rollNumber ?? undefined,
      academicYear: new Date().getFullYear().toString(),
      feeType: submission.paymentContext === "enrollment" ? "Enrollment Fee" : "Exam Fee",
      totalFee: amountPaid,
      amountPaid,
      balanceDue: 0,
      submissions: [subItem],
      status: submission.status,
      verifiedBy: submission.verifiedBy ?? undefined,
      verifiedAt: submission.verifiedAt?.toISOString() ?? undefined,
      schoolInfo,
    };
  }

  const buffer = await renderToBuffer(createElement(PaymentReceiptPDF, { data }) as any);
  const label = (data.applicationId ?? data.studentId ?? submissionId).replace(/[^a-z0-9-]/gi, "_");
  const filename = `Receipt_${label}_${new Date().getFullYear()}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
