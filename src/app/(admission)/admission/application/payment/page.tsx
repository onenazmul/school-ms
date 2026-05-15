"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
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
  const { data: __sd, isPending: loading } = useSession(); const session = __sd?.user as any;
  const [admission, setAdmission] = useState<AdmissionSummary | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || loading) return;
    fetch("/api/v1/admissions/me")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load application");
        return r.json() as Promise<{ admission: AdmissionSummary }>;
      })
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

  const totalFee = Number(admission.application_fee) || 0;

  async function handleSubmitPayment(values: PaymentFormValues) {
    if (!session) return;
    const r = await fetch("/api/v1/admissions/me/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message ?? "Payment submission failed.");
    }
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
