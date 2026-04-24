// app/api/documents/payment-receipt/[submissionId]/route.ts
// Returns a PDF payment receipt for a verified payment submission.
// Reuses renderComponentToBuffer from lib/documents/generate-pdf.ts.

import { renderComponentToBuffer } from "@/lib/documents/generate-pdf";
import {
  PaymentReceiptPDF, type ReceiptData,
} from "@/components/documents/pdf/PaymentReceiptPDF";
import {
  getSubmissionById, getSubmissionsByApplicationId,
} from "@/lib/mock-data/payments";
import { getStudentById } from "@/lib/mock-data/documents";
import { MOCK_PAYMENT_SUBMISSIONS } from "@/lib/mock-data/payments";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;

  // TODO: Replace mock lookups with real API calls using the session token
  const submission = getSubmissionById(submissionId);
  if (!submission) {
    return new Response(JSON.stringify({ error: "Submission not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (submission.status !== "verified") {
    return new Response(JSON.stringify({ error: "Receipt only available for verified submissions" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build receipt data
  let data: ReceiptData;
  const receiptDate = new Date().toISOString().slice(0, 10);

  if (submission.paymentContext === "admission") {
    const appId = submission.applicationId ?? "";
    const allForApp = getSubmissionsByApplicationId(appId).filter((s) => s.status === "verified");
    const amountPaid = allForApp.reduce((sum, s) => sum + s.amountSent, 0);
    const totalFee = 500; // TODO: fetch from application record

    data = {
      receiptNumber: submission.receiptNumber ?? `RCP-${new Date().getFullYear()}-${appId}`,
      receiptDate,
      payerName: "Applicant",     // TODO: fetch name from admission record
      paymentContext: "admission",
      applicationId: appId,
      classApplied: "",           // TODO: fetch from admission record
      academicYear: "2025-26",    // TODO: fetch from admission record
      feeType: "Admission Fee",
      totalFee,
      amountPaid,
      balanceDue: Math.max(0, totalFee - amountPaid),
      submissions: allForApp,
      verifiedBy: submission.verifiedBy,
      verifiedAt: submission.verifiedAt,
    };
  } else {
    // exam_fee context
    const studentId = submission.studentId ?? "";
    const student = studentId ? getStudentById(Number(studentId)) : null;
    const allForExam = MOCK_PAYMENT_SUBMISSIONS.filter(
      (s) => s.examFeeId === submission.examFeeId && s.status === "verified",
    );
    const amountPaid = allForExam.reduce((sum, s) => sum + s.amountSent, 0);
    const totalFee = 2500; // TODO: fetch from exam fee record

    data = {
      receiptNumber: submission.receiptNumber ?? `RCP-${new Date().getFullYear()}-S${studentId}`,
      receiptDate,
      payerName: student?.name ?? "Student",
      paymentContext: "exam_fee",
      studentId,
      studentClass: student?.class_name,
      rollNumber: student?.roll_number,
      examName: "Annual Examination 2025–26", // TODO: fetch from exam fee record
      academicYear: "2025-26",
      feeType: "Exam Fee — Annual Examination 2025–26",
      totalFee,
      amountPaid,
      balanceDue: Math.max(0, totalFee - amountPaid),
      submissions: allForExam,
      verifiedBy: submission.verifiedBy,
      verifiedAt: submission.verifiedAt,
    };
  }

  const buffer = await renderComponentToBuffer(PaymentReceiptPDF, { data });
  const filename = `Receipt_${(data.applicationId ?? data.studentId ?? submissionId).replace(/[^a-z0-9-]/gi, "_")}_${new Date().getFullYear()}.pdf`;

  return new Response(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
