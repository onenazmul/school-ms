"use client";
// app/(student)/student/payments/exam-fee/page.tsx
// Exam fee payment page — renders shared PaymentPage with exam_fee context.

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "@/lib/auth/client";
import { PaymentPage } from "@/components/payment/PaymentPage";
import { getExamFeesByStudentId, getSubmissionsByExamFeeId } from "@/lib/mock-data/payments";
import { Skeleton } from "@/components/ui/skeleton";

function ExamFeePaymentContent() {
  const { data: __sd, isPending: loading } = useSession(); const session = __sd?.user as any;
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId") ?? "";

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  // TODO: replace with GET /api/students/:id/exam-fees/:examFeeId
  const studentId = String(session?.id ?? "1");
  const fees = getExamFeesByStudentId(studentId);
  const fee = fees.find((f) => f.id === examId) ?? fees[0];

  if (!fee) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center text-sm text-muted-foreground">
        Exam fee not found.
      </div>
    );
  }

  const existingSubmissions = getSubmissionsByExamFeeId(fee.id);
  const verifiedAmount = existingSubmissions
    .filter((s) => s.status === "verified")
    .reduce((sum, s) => sum + s.amountSent, 0);

  return (
    <PaymentPage
      ctx={{
        paymentContext: "exam_fee",
        entityId: fee.id,
        entityLabel: fee.id,
        payerName: session?.name ?? "Student",
        totalFee: fee.feeAmount,
        amountPaid: verifiedAmount,
        dueDate: fee.dueDate,
        feeDescription: `Exam Fee — ${fee.examName}`,
        backHref: "/student/payments",
        existingSubmissions,
      }}
    />
  );
}

export default function ExamFeePaymentPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    }>
      <ExamFeePaymentContent />
    </Suspense>
  );
}
