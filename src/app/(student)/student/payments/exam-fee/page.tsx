"use client";
// app/(student)/student/payments/exam-fee/page.tsx

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { PaymentPage, type PaymentFormValues } from "@/components/payment/PaymentPage";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Submission = {
  id: string;
  status: string;
  amount_sent: number;
  method: string;
  transaction_id: string;
  submitted_at: string;
  admin_note: string | null;
  receipt_number: string | null;
  verified_at: string | null;
};

type Bill = {
  id: string;
  fee_name: string;
  amount: number;
  late_fee: number;
  total: number;
  due_date: string;
  month: string | null;
  academic_year: string;
  status: string;
  submissions: Submission[];
};

function toPaymentSubmission(s: Submission) {
  return {
    id: s.id,
    paymentContext: "exam_fee" as const,
    method: s.method as "bkash" | "rocket" | "bank_transfer",
    transactionId: s.transaction_id,
    phoneNumber: "",
    amountSent: s.amount_sent,
    paymentDate: s.submitted_at.split("T")[0],
    status: s.status as "pending" | "under_review" | "verified" | "rejected",
    adminNote: s.admin_note ?? undefined,
    receiptNumber: s.receipt_number ?? undefined,
    verifiedAt: s.verified_at ?? undefined,
    submittedAt: s.submitted_at,
  };
}

function ExamFeePaymentContent() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const billId = searchParams.get("billId") ?? "";

  const [bill, setBill] = useState<Bill | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/student/me/bills")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load fees");
        return r.json();
      })
      .then((data) => {
        const bills: Bill[] = data.bills ?? [];
        const found = billId ? bills.find((b) => b.id === billId) : bills[0];
        if (found) setBill(found);
      })
      .catch((err) => toast.error(err.message ?? "Could not load fees"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading, billId]);

  if (sessionLoading || fetching) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center text-sm text-muted-foreground">
        Fee not found.
      </div>
    );
  }

  const verifiedAmount = bill.submissions
    .filter((s) => s.status === "verified")
    .reduce((sum, s) => sum + s.amount_sent, 0);

  async function handleSubmitPayment(values: PaymentFormValues) {
    const r = await fetch("/api/v1/student/me/payment-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, billId: bill!.id }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).message ?? "Payment submission failed.");
    }
    router.push("/student/payments");
  }

  return (
    <PaymentPage
      ctx={{
        paymentContext: "exam_fee",
        entityId: bill.id,
        entityLabel: bill.id,
        payerName: session?.name ?? "Student",
        totalFee: bill.total,
        amountPaid: verifiedAmount,
        dueDate: bill.due_date,
        feeDescription: bill.fee_name + (bill.month ? ` — ${bill.month}` : ""),
        backHref: "/student/payments",
        existingSubmissions: bill.submissions.map(toPaymentSubmission),
        onSubmitPayment: handleSubmitPayment,
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
