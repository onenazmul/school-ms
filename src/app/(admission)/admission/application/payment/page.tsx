"use client";
// app/(admission)/admission/application/payment/page.tsx
// Admission fee payment page — renders the shared PaymentPage with admission context.

import { useEffect, useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { PaymentPage } from "@/components/payment/PaymentPage";
import { getSubmissionsByApplicationId } from "@/lib/mock-data/payments";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdmissionPaymentPage() {
  const { session, loading } = useStudentSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready || loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const applicationId = session?.username ?? "";
  // TODO: fetch real application fee + payment status from GET /api/applications/:id
  const existingSubmissions = getSubmissionsByApplicationId(applicationId);
  const verifiedAmount = existingSubmissions
    .filter((s) => s.status === "verified")
    .reduce((sum, s) => sum + s.amountSent, 0);

  return (
    <PaymentPage
      ctx={{
        paymentContext: "admission",
        entityId: applicationId,
        entityLabel: applicationId || "Application",
        payerName: session?.name ?? "Applicant",
        totalFee: 500,       // TODO: from application.application_fee
        amountPaid: verifiedAmount,
        dueDate: undefined,  // TODO: from school config
        feeDescription: "Application Fee",
        backHref: "/admission/application",
        existingSubmissions,
      }}
    />
  );
}
