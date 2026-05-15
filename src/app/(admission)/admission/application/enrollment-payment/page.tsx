"use client";
// app/(admission)/admission/application/enrollment-payment/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { PaymentPage, type PaymentFormValues } from "@/components/payment/PaymentPage";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type EnrollmentInfo = {
  id: number;
  name_en: string;
  username: string;
  enrollment_payment_status: string;
  enrollment_fee_required: boolean;
  enrollment_fee_amount: number | null;
  status: string;
};

export default function EnrollmentPaymentPage() {
  const { data: __sd, isPending: loading } = useSession();
  const session = __sd?.user as any;
  const router = useRouter();

  const [info, setInfo] = useState<EnrollmentInfo | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || loading) return;
    fetch("/api/v1/admissions/me")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load application");
        return r.json();
      })
      .then((r) => {
        const a = r.admission;
        setInfo({
          id: a.id,
          name_en: a.name_en,
          username: a.username,
          enrollment_payment_status: a.enrollment_payment_status ?? "Unpaid",
          enrollment_fee_required: a.enrollment_fee_required ?? false,
          enrollment_fee_amount: a.enrollment_fee_amount ?? null,
          status: a.status,
        });
      })
      .catch((err) => toast.error(err.message ?? "Could not load application"))
      .finally(() => setFetching(false));
  }, [session, loading]);

  // Redirect away if not in the right state
  useEffect(() => {
    if (!info) return;
    if (info.status !== "Approved") {
      router.replace("/admission/application");
    }
    if (!info.enrollment_fee_required) {
      router.replace("/admission/application");
    }
    if (info.enrollment_payment_status === "Paid") {
      router.replace("/admission/application");
    }
  }, [info, router]);

  if (loading || fetching) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!info) return null;

  const totalFee = info.enrollment_fee_amount ?? 0;

  async function handleSubmitPayment(values: PaymentFormValues) {
    const r = await fetch("/api/v1/admissions/me/enrollment-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).message ?? "Payment submission failed.");
    }
    // Redirect back to application page so the updated status is shown
    router.push("/admission/application");
  }

  return (
    <PaymentPage
      ctx={{
        paymentContext:      "enrollment",
        entityId:            String(info.id),
        entityLabel:         info.username,
        payerName:           info.name_en,
        totalFee,
        amountPaid:          0,
        feeDescription:      "Enrollment Fee",
        backHref:            "/admission/application",
        existingSubmissions: [],
        onSubmitPayment:     handleSubmitPayment,
      }}
    />
  );
}
