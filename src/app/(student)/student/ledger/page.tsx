"use client";
// app/(student)/student/ledger/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";

type Bill = {
  id: string;
  fee_name: string;
  month: string | null;
  amount: number;
  late_fee: number;
  total: number;
  due_date: string;
  academic_year: string;
  status: string;
  created_at: string;
};

type Receipt = {
  id: string;
  source: "fee_receipt" | "admission_payment" | "enrollment_payment";
  receipt_number: string | null;
  payment_method: string;
  amount: number;
  payment_date: string;
  items: { name: string; amount: number }[];
};

type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  type: "bill" | "payment";
  debit: number;
  credit: number;
  status: string;
};

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-green-50 text-green-700 border-green-200",
  unpaid:  "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-orange-50 text-orange-700 border-orange-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  waived:  "bg-slate-50 text-slate-600 border-slate-200",
};

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque", online: "Online",
  };
  return map[method] ?? method;
}

export default function StudentLedgerPage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;

  const [bills, setBills] = useState<Bill[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [fetching, setFetching] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    Promise.all([
      fetch("/api/v1/student/me/bills").then((r) => r.json()),
      fetch("/api/v1/student/me/receipts").then((r) => r.json()),
    ])
      .then(([billsData, receiptsData]) => {
        setBills(billsData.bills ?? []);
        setReceipts(receiptsData.receipts ?? []);
      })
      .catch((err) => toast.error(err.message ?? "Could not load ledger"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  const years = Array.from(
    new Set([
      ...bills.map((b) => b.created_at.slice(0, 4)),
      ...receipts.map((r) => r.payment_date.slice(0, 4)),
    ]),
  ).sort((a, b) => Number(b) - Number(a));
  if (!years.includes(year) && years.length > 0) {
    // default to most recent year on first load
  }

  const entries: LedgerEntry[] = [
    ...bills
      .filter((b) => b.created_at.startsWith(year))
      .map((b): LedgerEntry => {
        const isOverdue = b.status !== "paid" && b.status !== "waived" && new Date(b.due_date) < new Date();
        return {
          id: `bill-${b.id}`,
          date: b.created_at.split("T")[0],
          description: b.fee_name + (b.month ? ` — ${b.month}` : ""),
          type: "bill",
          debit: b.total,
          credit: 0,
          status: isOverdue ? "overdue" : b.status,
        };
      }),
    ...receipts
      .filter((r) => r.payment_date.startsWith(year))
      .map((r): LedgerEntry => {
        let description: string;
        if (r.source === "admission_payment") {
          description = `Admission fee paid — ${methodLabel(r.payment_method)}${r.receipt_number ? ` (${r.receipt_number})` : ""}`;
        } else if (r.source === "enrollment_payment") {
          description = `Enrollment fee paid — ${methodLabel(r.payment_method)}${r.receipt_number ? ` (${r.receipt_number})` : ""}`;
        } else {
          description = `Payment received — ${methodLabel(r.payment_method)}${r.receipt_number ? ` (${r.receipt_number})` : ""}`;
        }
        return {
          id: `receipt-${r.id}`,
          date: r.payment_date,
          description,
          type: "payment",
          debit: 0,
          credit: r.amount,
          status: "paid",
        };
      }),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const totalBilled  = entries.filter((e) => e.type === "bill").reduce((s, e) => s + e.debit, 0);
  const totalPaid    = entries.filter((e) => e.type === "payment").reduce((s, e) => s + e.credit, 0);
  const outstanding  = Math.max(0, totalBilled - totalPaid);

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full financial history</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(years.length > 0 ? years : [year]).map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <TrendingUp className="size-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Billed</p>
                <p className="font-semibold text-sm">৳{totalBilled.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="font-semibold text-sm text-green-700">৳{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={outstanding > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className={`size-8 rounded-lg flex items-center justify-center ${outstanding > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                <DollarSign className={`size-4 ${outstanding > 0 ? "text-red-600" : "text-slate-400"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className={`font-semibold text-sm ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                  ৳{outstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline entries */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No entries for {year}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`size-3 rounded-full mt-4 shrink-0 ${
                  entry.type === "payment"
                    ? "bg-green-500"
                    : entry.status === "overdue"
                    ? "bg-red-400"
                    : entry.status === "unpaid"
                    ? "bg-amber-400"
                    : "bg-slate-300"
                }`} />
                {i < entries.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>

              <div className={`flex-1 mb-2 rounded-xl border p-3.5 ${entry.type === "payment" ? "bg-green-50/30 border-green-100" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.date).toLocaleDateString("en-BD", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {entry.debit > 0 && (
                      <p className="text-sm font-semibold">৳{entry.debit.toLocaleString()}</p>
                    )}
                    {entry.credit > 0 && (
                      <p className="text-sm font-semibold text-green-600">+৳{entry.credit.toLocaleString()}</p>
                    )}
                    <Badge variant="outline" className={`text-xs mt-1 ${STATUS_STYLE[entry.status] ?? ""}`}>
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
