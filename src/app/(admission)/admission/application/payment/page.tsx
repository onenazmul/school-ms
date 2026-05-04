"use client";

import { useEffect, useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { PaymentPage, type PaymentFormValues } from "@/components/payment/PaymentPage";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type AdmissionSummary = {
  id: number;
  name_en: string;
  application_fee: string;
  payment_tracking_id: string | null;
  username: string;
};

export default function AdmissionPaymentPage() {
  const { session, loading } = useStudentSession();
  const [admission, setAdmission] = useState<AdmissionSummary | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || loading) return;
    api
      .get<{ admission: AdmissionSummary }>(EP.ADMISSION(session.id), session.laravelToken)
      .then((r) => setAdmission(r.admission))
      .catch((err) => toast.error(err.message ?? "Could not load application"))
      .finally(() => setFetching(false));
  }, [session, loading]);

  if (loading || fetching) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!admission) return null;

  const totalFee = Number(admission.application_fee) || 100;

  async function handleSubmitPayment(values: PaymentFormValues) {
    if (!session) return;
    await api.post(
      EP.ADMISSION_PAY,
      {
        admission_id:   admission!.id,
        payment_type:   values.method,
        transaction_id: values.transactionId ?? values.depositSlipNo ?? "",
        account_no:     values.phoneNumber   ?? values.accountHolderName ?? "",
        paid_amount:    values.amountSent,
      },
      session.laravelToken,
    );
  }

  return (
    <PaymentPage
      ctx={{
        paymentContext:   "admission",
        entityId:        String(admission.id),
        entityLabel:     admission.username,
        payerName:       admission.name_en,
        totalFee,
        amountPaid:      0,
        feeDescription:  "Application Fee",
        backHref:        "/admission/application",
        existingSubmissions: [],
        onSubmitPayment: handleSubmitPayment,
      }}
    />
  );
}
