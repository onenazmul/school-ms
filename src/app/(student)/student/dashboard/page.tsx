"use client";
// app/(student)/student/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle2, AlertCircle, Clock, Receipt, FileText,
} from "lucide-react";

type Summary = {
  due_balance: number;
  paid_this_year: number;
  next_due: { id: string; description: string; amount: number; due_date: string } | null;
};

type RecentReceipt = {
  id: string;
  source: "fee_receipt" | "admission_payment" | "enrollment_payment";
  receipt_number: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
};

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque", online: "Online",
    bkash: "bKash", rocket: "Rocket",
  };
  return map[method] ?? method;
}

export default function StudentDashboard() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/student/me")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load dashboard");
        return r.json();
      })
      .then((data) => {
        setSummary(data.summary);
        setRecentReceipts(data.recent_receipts ?? []);
      })
      .catch((err) => toast.error(err.message ?? "Could not load dashboard"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const dueBalance = summary?.due_balance ?? 0;
  const paidThisYear = summary?.paid_this_year ?? 0;
  const nextDue = summary?.next_due ?? null;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Welcome back, {session?.name ?? "Student"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            @{session?.username}
          </p>
        </div>
        <Badge
          variant="outline"
          className={dueBalance === 0
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"}
        >
          {dueBalance === 0 ? "All Clear" : `৳${dueBalance.toLocaleString()} Due`}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Paid This Year</p>
                <p className="text-xl font-semibold mt-0.5">
                  ৳{paidThisYear.toLocaleString()}
                </p>
              </div>
              <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Due</p>
                <p className="text-xl font-semibold mt-0.5">
                  ৳{dueBalance.toLocaleString()}
                </p>
              </div>
              <div className={`size-10 rounded-xl flex items-center justify-center ${dueBalance > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                <AlertCircle className={`size-5 ${dueBalance > 0 ? "text-red-600" : "text-slate-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next due */}
      {nextDue && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900">{nextDue.description}</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Due:{" "}
                  {new Date(nextDue.due_date).toLocaleDateString("en-BD", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <p className="text-lg font-semibold text-indigo-800 shrink-0">
                ৳{nextDue.amount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent receipts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Receipts</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
              <a href="/student/receipts">View all</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {recentReceipts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No receipts yet.</p>
          ) : (
            recentReceipts.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-green-50 flex items-center justify-center">
                    <Receipt className="size-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {r.receipt_number ??
                        (r.source === "enrollment_payment"
                          ? "Enrollment Fee"
                          : "Admission Fee")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.payment_date).toLocaleDateString("en-BD", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}{methodLabel(r.payment_method)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium">৳{r.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <a href="/student/ledger"><DollarSign className="size-4" />View Ledger</a>
        </Button>
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <a href="/student/receipts"><FileText className="size-4" />All Receipts</a>
        </Button>
      </div>
    </div>
  );
}
