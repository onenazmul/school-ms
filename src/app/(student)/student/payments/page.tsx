"use client";
// app/(student)/student/payments/page.tsx

import { useEffect, useState, useMemo } from "react";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BookOpen, CreditCard, Clock, CheckCircle2, AlertCircle,
  CalendarClock, ChevronDown, ChevronRight, Plus, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type Submission = {
  id: string;
  status: string;
  amount_sent: number;
  method: string;
  receipt_number: string | null;
  verified_at: string | null;
};

type Bill = {
  id: string;
  fee_name: string;
  fee_type: string;
  fee_config_id: string;
  amount: number;
  late_fee: number;
  total: number;
  due_date: string;
  month: string | null;
  academic_year: string;
  status: "unpaid" | "partial" | "paid" | "waived";
  submissions: Submission[];
};

type FeeConfig = {
  id: string;
  name: string;
  type: string;
  amount: number;
  due_day: number | null;
  due_date: string | null;
};

// Key for advance selection: `${feeConfigId}|${month}|${year}`
type AdvanceKey = string;

// ── Helpers ────────────────────────────────────────────────────────────────────

function effectiveStatus(bill: Bill): "paid" | "pending" | "unpaid" | "overdue" {
  if (bill.status === "paid" || bill.status === "waived") return "paid";
  const hasPending = bill.submissions.some(
    (s) => s.status === "pending" || s.status === "under_review",
  );
  if (hasPending) return "pending";
  return new Date(bill.due_date) < new Date() ? "overdue" : "unpaid";
}

function statusBadge(status: ReturnType<typeof effectiveStatus>) {
  switch (status) {
    case "paid":    return { label: "Paid", cls: "bg-green-50 text-green-700 border-green-200" };
    case "pending": return { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "overdue": return { label: "Overdue", cls: "bg-red-50 text-red-700 border-red-200" };
    default:        return { label: "Unpaid", cls: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

function advanceKey(feeConfigId: string, month: string, year: number): AdvanceKey {
  return `${feeConfigId}|${month}|${year}`;
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineCountdown({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  let label: string;
  let cls: string;
  if (days < 0) {
    label = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
    cls = "bg-red-100 text-red-700";
  } else if (days === 0) {
    label = "Due today!";
    cls = "bg-red-100 text-red-700";
  } else if (days <= 3) {
    label = `${days} day${days === 1 ? "" : "s"} left`;
    cls = "bg-orange-100 text-orange-700";
  } else if (days <= 14) {
    label = `${days} days remaining`;
    cls = "bg-amber-50 text-amber-700";
  } else {
    return null;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1", cls)}>
      <Clock className="size-3" />{label}
    </span>
  );
}

// ── Payment form ───────────────────────────────────────────────────────────────

type PaymentFormProps = {
  bills: Bill[];
  selectedBillIds: string[];
  advanceItems: { feeConfigId: string; month: string; year: string; feeName: string; amount: number }[];
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
};

function PaymentForm({ bills, selectedBillIds, advanceItems, totalAmount, onClose, onSuccess }: PaymentFormProps) {
  const [method, setMethod] = useState<"bkash" | "rocket" | "bank_transfer">("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [branch, setBranch] = useState("");
  const [depositSlip, setDepositSlip] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedBills = bills.filter((b) => selectedBillIds.includes(b.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentDate) return toast.error("Select a payment date");
    if (method !== "bank_transfer" && !transactionId.trim())
      return toast.error("Enter the transaction ID");

    setLoading(true);
    try {
      const res = await fetch("/api/v1/student/me/payment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billIds: selectedBillIds,
          advanceItems: advanceItems.map(({ feeConfigId, month, year }) => ({ feeConfigId, month, year })),
          method,
          transactionId: method !== "bank_transfer" ? transactionId : undefined,
          phoneNumber: phoneNumber || undefined,
          accountHolderName: accountHolder || undefined,
          branch: branch || undefined,
          depositSlipNo: depositSlip || undefined,
          amountSent: totalAmount,
          paymentDate,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Submission failed");
      toast.success("Payment submitted for verification!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-muted/50 p-3 space-y-1.5">
        {selectedBills.map((b) => (
          <div key={b.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{b.fee_name}{b.month ? ` — ${b.month}` : ""}</span>
            <span className="font-medium">৳{b.total.toLocaleString()}</span>
          </div>
        ))}
        {advanceItems.map((a) => (
          <div key={`${a.feeConfigId}|${a.month}|${a.year}`} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{a.feeName} — {a.month} {a.year} <Badge variant="outline" className="text-xs ml-1 py-0">advance</Badge></span>
            <span className="font-medium">৳{a.amount.toLocaleString()}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>৳{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Method */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          {(["bkash", "rocket", "bank_transfer"] as const).map((m) => (
            <button
              key={m} type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                method === m ? "bg-indigo-600 text-white border-indigo-600" : "border-border hover:border-indigo-300",
              )}
            >
              {m === "bkash" ? "bKash" : m === "rocket" ? "Rocket" : "Bank Transfer"}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile money fields */}
      {(method === "bkash" || method === "rocket") && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Transaction ID *</label>
            <Input
              placeholder={`${method === "bkash" ? "bKash" : "Rocket"} Transaction ID`}
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sender Number</label>
            <Input
              placeholder="e.g. 01700000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Bank fields */}
      {method === "bank_transfer" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Account Holder Name</label>
            <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Branch</label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deposit Slip No.</label>
              <Input value={depositSlip} onChange={(e) => setDepositSlip(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Payment Date *</label>
        <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Input placeholder="Any additional information…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
          {loading ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting…</> : `Submit ৳${totalAmount.toLocaleString()}`}
        </Button>
      </div>
    </form>
  );
}

// ── Advance month picker ───────────────────────────────────────────────────────

function AdvancePicker({
  feeConfig,
  existingBills,
  selectedKeys,
  onToggle,
}: {
  feeConfig: FeeConfig;
  existingBills: Bill[];
  selectedKeys: Set<AdvanceKey>;
  onToggle: (key: AdvanceKey, meta: { feeConfigId: string; month: string; year: string; feeName: string; amount: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const options: { month: string; year: number; key: AdvanceKey; existingBill?: Bill }[] = [];
  for (let yi = 0; yi <= 1; yi++) {
    const y = currentYear + yi;
    for (const m of MONTHS) {
      const existing = existingBills.find(
        (b) => b.fee_config_id === feeConfig.id && b.month === m && b.academic_year === String(y),
      );
      // Only show future/current months not yet paid
      const monthIndex = MONTHS.indexOf(m);
      const now = new Date();
      const isCurrentOrFuture =
        y > now.getFullYear() ||
        (y === now.getFullYear() && monthIndex >= now.getMonth());
      if (!isCurrentOrFuture) continue;
      if (existing && (existing.status === "paid" || existing.status === "waived")) continue;
      options.push({ month: m, year: y, key: advanceKey(feeConfig.id, m, y), existingBill: existing });
    }
  }

  if (options.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Plus className="size-3" />
        Pay in advance
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 pl-4">
          {options.map((opt) => {
            const checked = selectedKeys.has(opt.key);
            return (
              <label
                key={opt.key}
                className={cn(
                  "flex items-center gap-2 text-xs rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors",
                  checked ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "hover:border-indigo-200",
                  opt.existingBill ? "border-amber-200 bg-amber-50/50" : "",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() =>
                    onToggle(opt.key, {
                      feeConfigId: feeConfig.id,
                      month: opt.month,
                      year: String(opt.year),
                      feeName: feeConfig.name,
                      amount: feeConfig.amount,
                    })
                  }
                  className="size-3.5"
                />
                <span>{opt.month} {opt.year}</span>
                {opt.existingBill && <Badge variant="outline" className="text-xs py-0 ml-auto">due</Badge>}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function StudentPaymentsPage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;

  const [bills, setBills] = useState<Bill[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [fetching, setFetching] = useState(true);

  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [advanceKeys, setAdvanceKeys] = useState<Set<AdvanceKey>>(new Set());
  const [advanceMeta, setAdvanceMeta] = useState<Map<AdvanceKey, { feeConfigId: string; month: string; year: string; feeName: string; amount: number }>>(new Map());
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/student/me/bills")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load fees");
        return r.json();
      })
      .then((data) => {
        setBills(data.bills ?? []);
        setFeeConfigs(data.fee_configs ?? []);
      })
      .catch((err) => toast.error(err.message ?? "Could not load fees"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  // Group bills by fee config
  const grouped = useMemo(() => {
    const map = new Map<string, { config: FeeConfig | null; bills: Bill[] }>();
    for (const bill of bills) {
      const key = bill.fee_config_id;
      if (!map.has(key)) {
        const config = feeConfigs.find((f) => f.id === key) ?? null;
        map.set(key, { config, bills: [] });
      }
      map.get(key)!.bills.push(bill);
    }
    // Also add fee configs that have no bills yet (for advance-only)
    for (const fc of feeConfigs) {
      if (!map.has(fc.id)) map.set(fc.id, { config: fc, bills: [] });
    }
    return map;
  }, [bills, feeConfigs]);

  function toggleBill(billId: string) {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      next.has(billId) ? next.delete(billId) : next.add(billId);
      return next;
    });
  }

  function toggleAdvance(
    key: AdvanceKey,
    meta: { feeConfigId: string; month: string; year: string; feeName: string; amount: number },
  ) {
    setAdvanceKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setAdvanceMeta((prev) => {
      const next = new Map(prev);
      if (advanceKeys.has(key)) next.delete(key);
      else next.set(key, meta);
      return next;
    });
  }

  const selectedBills = bills.filter((b) => selectedBillIds.has(b.id));
  const selectedAdvanceItems = Array.from(advanceMeta.values()).filter((_, i) =>
    advanceKeys.has(Array.from(advanceMeta.keys())[i])
  );
  const totalAmount =
    selectedBills.reduce((s, b) => s + b.total, 0) +
    selectedAdvanceItems.reduce((s, a) => s + a.amount, 0);
  const canPay = selectedBillIds.size + advanceKeys.size > 0;

  function handlePaySuccess() {
    setPayOpen(false);
    setSelectedBillIds(new Set());
    setAdvanceKeys(new Set());
    setAdvanceMeta(new Map());
    setFetching(true);
    fetch("/api/v1/student/me/bills")
      .then((r) => r.json())
      .then((data) => { setBills(data.bills ?? []); setFeeConfigs(data.fee_configs ?? []); })
      .finally(() => setFetching(false));
  }

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="size-5 text-indigo-600" />My Fees
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select bills to pay, or pay ahead in advance
          </p>
        </div>
        {canPay && (
          <Button
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setPayOpen(true)}
          >
            <CreditCard className="size-4" />
            Pay ৳{totalAmount.toLocaleString()}
            <Badge variant="secondary" className="ml-1 text-xs bg-white/20 text-white border-0">
              {selectedBillIds.size + advanceKeys.size} selected
            </Badge>
          </Button>
        )}
      </div>

      {grouped.size === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No fees assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([feeConfigId, { config, bills: groupBills }]) => {
            const unpaidBills = groupBills.filter((b) => {
              const s = effectiveStatus(b);
              return s !== "paid";
            });
            const paidBills = groupBills.filter((b) => effectiveStatus(b) === "paid");

            return (
              <Card key={feeConfigId} className="overflow-hidden">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <BookOpen className="size-3.5 text-indigo-600" />
                      </div>
                      {config?.name ?? "Fee"}
                    </CardTitle>
                    {config && (
                      <Badge variant="outline" className="text-xs capitalize">{config.type}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {/* Unpaid/pending/overdue bills */}
                  {unpaidBills.map((bill) => {
                    const status = effectiveStatus(bill);
                    const badge = statusBadge(status);
                    const isSelectable = status === "unpaid" || status === "overdue";
                    const checked = selectedBillIds.has(bill.id);

                    return (
                      <div
                        key={bill.id}
                        className={cn(
                          "rounded-xl border p-3.5 transition-colors",
                          isSelectable && checked ? "border-indigo-300 bg-indigo-50/40" : "",
                          isSelectable ? "cursor-pointer" : "",
                        )}
                        onClick={() => isSelectable && toggleBill(bill.id)}
                      >
                        <div className="flex items-start gap-3">
                          {isSelectable && (
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleBill(bill.id)}
                              className="mt-0.5 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          {status === "pending" && (
                            <div className="size-4 mt-0.5 flex items-center justify-center shrink-0">
                              <Clock className="size-4 text-amber-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {bill.fee_name}{bill.month ? ` — ${bill.month}` : ""}
                                  {bill.late_fee > 0 && (
                                    <span className="text-xs text-amber-600 ml-1.5">+৳{bill.late_fee.toLocaleString()} late</span>
                                  )}
                                </p>
                                <div className={cn(
                                  "flex items-center gap-1.5 text-xs mt-1",
                                  status === "overdue" ? "text-red-600" : "text-muted-foreground",
                                )}>
                                  <CalendarClock className="size-3" />
                                  {status === "overdue" ? "Overdue since" : "Due"}&nbsp;
                                  {new Date(bill.due_date).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })}
                                </div>
                            {isSelectable && <DeadlineCountdown dateStr={bill.due_date} />}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-semibold">৳{bill.total.toLocaleString()}</p>
                                <Badge variant="outline" className={cn("text-xs mt-1", badge.cls)}>{badge.label}</Badge>
                              </div>
                            </div>
                            {status === "pending" && (
                              <p className="text-xs text-amber-600 mt-1.5">
                                Payment proof submitted. Awaiting admin verification.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Paid bills (collapsed) */}
                  {paidBills.length > 0 && (
                    <div className="space-y-1">
                      {paidBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between rounded-lg bg-green-50/50 border border-green-100 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                              {bill.fee_name}{bill.month ? ` — ${bill.month}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">৳{bill.total.toLocaleString()}</span>
                            {bill.submissions.find((s) => s.status === "verified")?.receipt_number && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 font-mono">
                                {bill.submissions.find((s) => s.status === "verified")!.receipt_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Advance payment option (only for monthly fees) */}
                  {config?.type === "monthly" && (
                    <AdvancePicker
                      feeConfig={config}
                      existingBills={groupBills}
                      selectedKeys={advanceKeys}
                      onToggle={toggleAdvance}
                    />
                  )}

                  {unpaidBills.length === 0 && paidBills.length === 0 && (
                    <div className="py-2 text-center space-y-1">
                      <p className="text-xs text-muted-foreground">No bills assigned yet for this fee.</p>
                      {config?.type === "one_time" && config.due_date && (
                        <div className="flex items-center justify-center gap-1.5">
                          <DeadlineCountdown dateStr={config.due_date} />
                          <span className="text-xs text-muted-foreground">
                            — due {new Date(config.due_date).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Payment Proof</DialogTitle>
          </DialogHeader>
          <PaymentForm
            bills={bills}
            selectedBillIds={Array.from(selectedBillIds)}
            advanceItems={Array.from(advanceMeta.entries())
              .filter(([k]) => advanceKeys.has(k))
              .map(([, v]) => v)}
            totalAmount={totalAmount}
            onClose={() => setPayOpen(false)}
            onSuccess={handlePaySuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
