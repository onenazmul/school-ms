"use client";
// app/(student)/student/receipts/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Receipt, GraduationCap, AlertCircle, Download, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ReceiptEntry = {
  id: string;
  download_url: string | null;
  source: "fee_receipt" | "admission_payment" | "enrollment_payment" | "fee_submission";
  status: string;
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
  if (source === "fee_submission")     return "Fee Payment";
  return null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="size-3" />Verified
      </span>
    );
  }
  if (status === "pending" || status === "under_review") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <Clock className="size-3" />Under Review
      </span>
    );
  }
  return null;
}

function ReceiptCard({ entry }: { entry: ReceiptEntry }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!entry.download_url) return;
    setDownloading(true);
    try {
      const res = await fetch(entry.download_url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${entry.receipt_number ?? entry.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download receipt");
    } finally {
      setDownloading(false);
    }
  }

  const label = sourceLabel(entry.source);
  const isAdmission = entry.source === "admission_payment" || entry.source === "enrollment_payment";
  const isPending = entry.status === "pending" || entry.status === "under_review";

  return (
    <Card className={cn("hover:shadow-sm transition-shadow", isPending && "border-amber-200")}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isAdmission ? "bg-indigo-50" : isPending ? "bg-amber-50" : "bg-green-50"}`}>
            {isAdmission
              ? <GraduationCap className="size-5 text-indigo-600" />
              : isPending
                ? <Clock className="size-5 text-amber-600" />
                : <Receipt className="size-5 text-green-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">
                  {entry.receipt_number ?? label ?? "Receipt"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(entry.payment_date).toLocaleDateString("en-BD", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                  {entry.issued_by ? ` · By ${entry.issued_by}` : ""}
                </p>
              </div>
              <p className="text-base font-semibold shrink-0">৳{entry.amount.toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <div className="flex flex-wrap gap-1 items-center">
                {entry.items.map((item, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {item.name}
                  </span>
                ))}
                <StatusBadge status={entry.status} />
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${METHOD_COLOR[entry.payment_method] ?? ""}`}
                >
                  {methodLabel(entry.payment_method)}
                </Badge>
                {entry.download_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 px-2"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    <Download className="size-3" />
                    {downloading ? "…" : "PDF"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

  const verifiedEntries = entries.filter((e) => e.status === "verified");
  const pendingEntries  = entries.filter((e) => e.status === "pending" || e.status === "under_review");
  const totalPaid = verifiedEntries.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Fee Receipts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {verifiedEntries.length} verified · ৳{totalPaid.toLocaleString()} paid
          {pendingEntries.length > 0 && ` · ${pendingEntries.length} under review`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No receipts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Under Review
              </p>
              {pendingEntries.map((r) => <ReceiptCard key={r.id} entry={r} />)}
            </div>
          )}
          {verifiedEntries.length > 0 && (
            <div className="space-y-2">
              {pendingEntries.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                  Verified
                </p>
              )}
              {verifiedEntries.map((r) => <ReceiptCard key={r.id} entry={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
