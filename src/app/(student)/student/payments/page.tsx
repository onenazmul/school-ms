"use client";
// app/(student)/student/payments/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BookOpen, CreditCard, Clock, CheckCircle2, AlertTriangle, CalendarClock, AlertCircle,
} from "lucide-react";

type Submission = {
  id: string;
  status: string;
  amount_sent: number;
  method: string;
  receipt_number: string | null;
};

type Bill = {
  id: string;
  fee_name: string;
  fee_type: string;
  amount: number;
  late_fee: number;
  total: number;
  due_date: string;
  month: string | null;
  academic_year: string;
  status: "unpaid" | "partial" | "paid" | "waived";
  submissions: Submission[];
};

function effectiveStatus(bill: Bill): "paid" | "pending" | "unpaid" | "overdue" {
  if (bill.status === "paid" || bill.status === "waived") return "paid";
  const hasPendingSub = bill.submissions.some(
    (s) => s.status === "pending" || s.status === "under_review",
  );
  if (hasPendingSub) return "pending";
  const isOverdue = new Date(bill.due_date) < new Date();
  return isOverdue ? "overdue" : "unpaid";
}

function statusBadge(status: ReturnType<typeof effectiveStatus>) {
  switch (status) {
    case "paid":    return { label: "Paid ✓",              cls: "bg-green-50 text-green-700 border-green-200" };
    case "pending": return { label: "Pending Verification", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "overdue": return { label: "Overdue",              cls: "bg-red-50 text-red-700 border-red-200" };
    default:        return { label: "Unpaid",               cls: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

function BillCard({ bill }: { bill: Bill }) {
  const status = effectiveStatus(bill);
  const badge = statusBadge(status);

  return (
    <div className="rounded-xl border bg-background p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <BookOpen className="size-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {bill.fee_name}{bill.month ? ` — ${bill.month}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Academic Year: {bill.academic_year}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0", badge.cls)}>
          {badge.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Fee Amount{bill.late_fee > 0 ? " (incl. late fee)" : ""}
        </span>
        <span className="font-semibold text-lg">৳{bill.total.toLocaleString()}</span>
      </div>

      <div className={cn(
        "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
        status === "overdue"
          ? "bg-red-50 border border-red-200 text-red-700"
          : "bg-amber-50 border border-amber-200 text-amber-700",
      )}>
        <CalendarClock className="size-3.5 shrink-0" />
        {status === "overdue" ? "Overdue since" : "Due by"}&nbsp;
        {new Date(bill.due_date).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })}
      </div>

      <div className="flex gap-2">
        {(status === "unpaid" || status === "overdue") && (
          <Button
            size="sm"
            className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            asChild
          >
            <a href={`/student/payments/exam-fee?billId=${bill.id}`}>
              <CreditCard className="size-3.5" />Pay Now
            </a>
          </Button>
        )}
        {status === "pending" && (
          <Button size="sm" variant="outline" className="flex-1 gap-2" asChild>
            <a href={`/student/payments/exam-fee?billId=${bill.id}`}>
              <Clock className="size-3.5" />View Submission
            </a>
          </Button>
        )}
        {status === "paid" && (
          <div className="flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="size-4" />
            {bill.submissions.find((s) => s.status === "verified")?.receipt_number
              ? `Receipt: ${bill.submissions.find((s) => s.status === "verified")!.receipt_number}`
              : "Paid"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentPaymentsPage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;

  const [bills, setBills] = useState<Bill[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/student/me/bills")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load fees");
        return r.json();
      })
      .then((data) => setBills(data.bills ?? []))
      .catch((err) => toast.error(err.message ?? "Could not load fees"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="size-5 text-indigo-600" />
          My Fees
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pay fees and submit payment proofs for verification
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">No fees assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  );
}
