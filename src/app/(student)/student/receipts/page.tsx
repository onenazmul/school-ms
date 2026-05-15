"use client";
// app/(student)/student/receipts/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Receipt, GraduationCap, AlertCircle } from "lucide-react";

type ReceiptEntry = {
  id: string;
  source: "fee_receipt" | "admission_payment" | "enrollment_payment";
  receipt_number: string | null;
  payment_method: string;
  amount: number;
  payment_date: string;
  issued_by: string | null;
  items: { name: string; amount: number }[];
};

const METHOD_COLOR: Record<string, string> = {
  cash:          "bg-green-50 text-green-700 border-green-200",
  bank_transfer: "bg-blue-50 text-blue-700 border-blue-200",
  cheque:        "bg-slate-50 text-slate-600 border-slate-200",
  online:        "bg-indigo-50 text-indigo-700 border-indigo-200",
  bkash:         "bg-pink-50 text-pink-700 border-pink-200",
  rocket:        "bg-purple-50 text-purple-700 border-purple-200",
};

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque",
    online: "Online", bkash: "bKash", rocket: "Rocket",
  };
  return map[method] ?? method;
}

function sourceLabel(source: ReceiptEntry["source"]) {
  if (source === "admission_payment")  return "Admission Fee";
  if (source === "enrollment_payment") return "Enrollment Fee";
  return null; // fee_receipt uses receipt_number as label
}

export default function StudentReceiptsPage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;

  const [entries, setEntries] = useState<ReceiptEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/student/me/receipts")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load receipts");
        return r.json();
      })
      .then((data) => setEntries(data.receipts ?? []))
      .catch((err) => toast.error(err.message ?? "Could not load receipts"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear().toString();
  const totalPaid = entries.reduce((s, r) => s + r.amount, 0);
  const thisYearCount = entries.filter((r) => r.payment_date.startsWith(currentYear)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Fee Receipts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {entries.length} receipt{entries.length !== 1 ? "s" : ""} · ৳{totalPaid.toLocaleString()} paid total
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No receipts yet.</p>
        </div>
      ) : (
        <>
          {/* Progress bar for current year */}
          <Card className="bg-linear-to-r from-indigo-50 to-violet-50 border-indigo-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-indigo-900">{currentYear} Payment Progress</p>
                <p className="text-sm font-semibold text-indigo-700">
                  {thisYearCount} payment{thisYearCount !== 1 ? "s" : ""} this year
                </p>
              </div>
              <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, (thisYearCount / 12) * 100).toFixed(0)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-indigo-500">
                <span>Jan</span><span>Jun</span><span>Dec</span>
              </div>
            </CardContent>
          </Card>

          {/* Receipt list */}
          <div className="space-y-3">
            {entries.map((r) => {
              const label = sourceLabel(r.source);
              const isAdmission = r.source !== "fee_receipt";
              return (
                <Card key={r.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isAdmission ? "bg-indigo-50" : "bg-green-50"}`}>
                        {isAdmission
                          ? <GraduationCap className="size-5 text-indigo-600" />
                          : <Receipt className="size-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {r.receipt_number ?? label ?? "Receipt"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(r.payment_date).toLocaleDateString("en-BD", {
                                day: "2-digit", month: "long", year: "numeric",
                              })}
                              {r.issued_by ? ` · Issued by ${r.issued_by}` : ""}
                            </p>
                          </div>
                          <p className="text-base font-semibold shrink-0">৳{r.amount.toLocaleString()}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                          <div className="flex flex-wrap gap-1">
                            {r.items.map((item, i) => (
                              <span
                                key={i}
                                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${METHOD_COLOR[r.payment_method] ?? ""}`}
                          >
                            {methodLabel(r.payment_method)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
