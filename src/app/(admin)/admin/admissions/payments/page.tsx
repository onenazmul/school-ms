"use client";
// app/(admin)/admin/admissions/payments/page.tsx
// Admin payment review page — lists all payment submissions across all contexts.
// Includes Review Dialog for verify/reject actions.

import { Suspense, useState, useMemo } from "react";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBDT, fmtDate, fmtDateTime } from "@/lib/utils/format";
import {
  getAllSubmissions, getSubmissionsByApplicationId,
  type PaymentSubmission, type PaymentStatus,
} from "@/lib/mock-data/payments";

// ── UI ────────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  Search, Filter, CheckSquare, X, Download, Eye, RefreshCw,
  AlertTriangle, BarChart3, ClipboardList, Loader2,
  CheckCircle2, Clock, XCircle, FileText,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function methodLabel(m: string) {
  if (m === "bkash")        return "bKash";
  if (m === "rocket")       return "Rocket";
  if (m === "bank_transfer") return "Bank Transfer";
  return m;
}

function methodBadge(m: string) {
  if (m === "bkash")        return "bg-pink-50 text-pink-700 border-pink-200";
  if (m === "rocket")       return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function statusBadge(s: PaymentStatus) {
  switch (s) {
    case "verified":     return { cls: "bg-green-50 text-green-700 border-green-200",  label: "Verified",    Icon: CheckCircle2 };
    case "rejected":     return { cls: "bg-red-50 text-red-700 border-red-200",        label: "Rejected",    Icon: XCircle };
    case "under_review": return { cls: "bg-amber-50 text-amber-700 border-amber-200",  label: "Under Review",Icon: Clock };
    default:             return { cls: "bg-slate-50 text-slate-600 border-slate-200",  label: "Pending",     Icon: Clock };
  }
}

function exportCSV(subs: PaymentSubmission[]) {
  const headers = ["ID", "Context", "Application/Student ID", "Method", "Transaction ID", "Phone", "Amount", "Date", "Status", "Submitted At"];
  const rows = subs.map((s) => [
    s.id, s.paymentContext, s.applicationId ?? s.studentId ?? "",
    methodLabel(s.method), s.transactionId, s.phoneNumber, s.amountSent,
    s.paymentDate, s.status, fmtDateTime(s.submittedAt),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentReviewDialog
// ─────────────────────────────────────────────────────────────────────────────

function PaymentReviewDialog({
  submission,
  open,
  onClose,
  onSaved,
}: {
  submission: PaymentSubmission | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [verdict, setVerdict]   = useState<"verified" | "rejected" | "">("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving]     = useState(false);

  if (!submission) return null;
  const { cls: sbCls, label: sbLabel } = statusBadge(submission.status);

  async function handleSave() {
    if (!verdict) { toast.error("Please select a verdict."); return; }
    if (verdict === "rejected" && !adminNote.trim()) {
      toast.error("Admin note is required when returning for correction.");
      return;
    }
    setSaving(true);
    try {
      // TODO: PATCH /api/payment-submissions/:id  { status: verdict, adminNote }
      // Then: if verified → PATCH application payment status
      await new Promise((r) => setTimeout(r, 800));
      toast.success(
        verdict === "verified"
          ? "Payment marked as Verified. Application payment status updated."
          : "Submission returned for correction.",
      );
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Payment Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Read-only summary */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5">
            {[
              ["Status",          <Badge key="s" variant="outline" className={cn("text-xs", sbCls)}>{sbLabel}</Badge>],
              ["Method",          <Badge key="m" variant="outline" className={cn("text-xs", methodBadge(submission.method))}>{methodLabel(submission.method)}</Badge>],
              ["Transaction ID",  <span key="t" className="font-mono text-xs font-medium">{submission.transactionId}</span>],
              ["Phone Used",      <span key="p" className="text-xs font-medium">{submission.phoneNumber}</span>],
              ["Amount Sent",     <span key="a" className="text-xs font-semibold text-green-700">{formatBDT(submission.amountSent)}</span>],
              ["Payment Date",    <span key="d" className="text-xs font-medium">{fmtDate(submission.paymentDate)}</span>],
              ["Submitted At",    <span key="sa" className="text-xs text-muted-foreground">{fmtDateTime(submission.submittedAt)}</span>],
              ...(submission.notes ? [["Notes", <span key="n" className="text-xs text-muted-foreground">{submission.notes}</span>]] as [string, React.ReactNode][] : []),
            ].map(([label, node]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                {node}
              </div>
            ))}
          </div>

          <Separator />

          {/* Verdict */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Admin Verdict</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "verified", label: "Mark as Verified", cls: "border-green-300 text-green-700 bg-green-50" },
                { value: "rejected", label: "Return for Correction", cls: "border-red-300 text-red-700 bg-red-50" },
              ].map(({ value, label, cls }) => (
                <button
                  key={value}
                  onClick={() => setVerdict(value as any)}
                  className={cn(
                    "rounded-xl border-2 p-3 text-sm font-medium transition-all text-left",
                    verdict === value ? cls : "border-border bg-background text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {verdict === "rejected" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Admin Note *</Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain what the applicant needs to correct…"
                className="resize-none min-h-20"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!verdict || saving}
            className={cn(
              "gap-2",
              verdict === "verified" ? "bg-green-600 hover:bg-green-700 text-white" :
              verdict === "rejected" ? "bg-red-600 hover:bg-red-700 text-white" : "",
            )}
          >
            {saving ? <><Loader2 className="size-4 animate-spin" />Saving…</> : "Save Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          {Array.from({ length: 9 }).map((__, j) => (
            <td key={j} className="py-3 px-4"><Skeleton className="h-3.5 w-full max-w-24" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports Tab (basic stats, no external chart library needed)
// ─────────────────────────────────────────────────────────────────────────────

function ReportsTab({ submissions }: { submissions: PaymentSubmission[] }) {
  const verified = submissions.filter((s) => s.status === "verified");
  const pending  = submissions.filter((s) => s.status === "pending" || s.status === "under_review");
  const rejected = submissions.filter((s) => s.status === "rejected");

  const totalCollected = verified.reduce((sum, s) => sum + s.amountSent, 0);
  const pendingAmount  = pending.reduce((sum, s) => sum + s.amountSent, 0);

  const now = new Date();
  const thisMonthVerified = verified.filter((s) => {
    const d = new Date(s.verifiedAt ?? s.submittedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonthVerified.reduce((sum, s) => sum + s.amountSent, 0);

  const byMethod = (["bkash", "rocket", "bank_transfer"] as const).map((m) => {
    const subs = submissions.filter((s) => s.method === m);
    const ver  = subs.filter((s) => s.status === "verified");
    return {
      method: methodLabel(m),
      total: subs.length,
      verified: ver.length,
      collected: ver.reduce((sum, s) => sum + s.amountSent, 0),
    };
  });

  const maxCollected = Math.max(...byMethod.map((b) => b.collected), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Collected",     value: formatBDT(totalCollected), color: "text-green-700", bg: "bg-green-50" },
          { label: "Pending Verification",value: `${pending.length} · ${formatBDT(pendingAmount)}`, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "This Month",          value: formatBDT(thisMonthAmount), color: "text-indigo-700", bg: "bg-indigo-50" },
          { label: "Rejected / Returned", value: String(rejected.length), color: "text-red-700", bg: "bg-red-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border p-4 space-y-1.5", bg)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-lg font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Method breakdown */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <p className="text-sm font-semibold">Breakdown by Payment Method</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Method</th>
              <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Submissions</th>
              <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Verified</th>
              <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Total Collected</th>
              <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground w-40">Bar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {byMethod.map((row) => (
              <tr key={row.method}>
                <td className="py-3 px-4 font-medium">{row.method}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{row.total}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{row.verified}</td>
                <td className="py-3 px-4 text-right font-semibold text-green-700">{formatBDT(row.collected)}</td>
                <td className="py-3 px-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(row.collected / maxCollected) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            <tr className="border-t bg-muted/20 font-semibold">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right">{submissions.length}</td>
              <td className="py-3 px-4 text-right">{verified.length}</td>
              <td className="py-3 px-4 text-right text-green-700">{formatBDT(totalCollected)}</td>
              <td className="py-3 px-4" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Export */}
      <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(verified)}>
        <Download className="size-3.5" />Export Verified Payments (CSV)
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main content
// ─────────────────────────────────────────────────────────────────────────────

function PaymentSubmissionsContent() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [methodFilter, setMethod]   = useState("");
  const [contextFilter, setContext] = useState("");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [reviewSub, setReviewSub]   = useState<PaymentSubmission | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // TODO: replace with TanStack Query against GET /api/admin/payment-submissions
  const allSubs = useMemo(() => getAllSubmissions(), [refreshKey]);

  const filtered = useMemo(() => {
    let list = allSubs;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s) =>
        s.transactionId.toLowerCase().includes(q) ||
        (s.applicationId ?? "").toLowerCase().includes(q) ||
        (s.studentId ?? "").toLowerCase().includes(q) ||
        s.phoneNumber.includes(q)
      );
    }
    if (statusFilter)  list = list.filter((s) => s.status === statusFilter);
    if (methodFilter)  list = list.filter((s) => s.method === methodFilter);
    if (contextFilter) list = list.filter((s) => s.paymentContext === contextFilter);
    return list;
  }, [allSubs, search, statusFilter, methodFilter, contextFilter]);

  const pendingCount = allSubs.filter((s) => s.status === "pending").length;

  const allSelected  = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((s) => s.id)));
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function handleBulkVerify() {
    setSaving(true);
    try {
      // TODO: PATCH each selected submission via /api/payment-submissions/:id
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(`${selected.size} submission${selected.size !== 1 ? "s" : ""} verified`);
      setSelected(new Set());
      setBulkDialog(false);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Bulk verify failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="size-5 text-indigo-600" />
            Payment Submissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {allSubs.length} submissions
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600">· {pendingCount} pending review</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(filtered)}>
          <Download className="size-3.5" />Export CSV
        </Button>
      </div>

      {/* Tabs: Submissions | Reports */}
      <Tabs defaultValue="submissions">
        <TabsList className="h-9">
          <TabsTrigger value="submissions" className="gap-1.5 text-sm">
            <ClipboardList className="size-3.5" />Submissions
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 text-sm">
            <BarChart3 className="size-3.5" />Reports
          </TabsTrigger>
        </TabsList>

        {/* ── Submissions Tab ───────────────────────────────────────────── */}
        <TabsContent value="submissions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="Search by Trx ID, app ID, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter || "all"} onValueChange={(v) => setMethod(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="rocket">Rocket</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contextFilter || "all"} onValueChange={(v) => setContext(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue placeholder="Fee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fee Types</SelectItem>
                <SelectItem value="admission">Admission Fee</SelectItem>
                <SelectItem value="exam_fee">Exam Fee</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter || methodFilter || contextFilter) && (
              <Button variant="ghost" size="sm" className="gap-1.5 h-9 text-muted-foreground"
                onClick={() => { setSearch(""); setStatus(""); setMethod(""); setContext(""); }}>
                <X className="size-3.5" />Clear
              </Button>
            )}
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-sm">
              <span className="font-semibold text-indigo-700">{selected.size} selected</span>
              <Separator orientation="vertical" className="h-4" />
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 text-green-700"
                onClick={() => setBulkDialog(true)}>
                <CheckSquare className="size-3.5" />Bulk Verify
              </Button>
              <Button size="icon" variant="ghost" className="size-7 ml-auto"
                onClick={() => setSelected(new Set())}>
                <X className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border overflow-x-auto bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-3 px-4 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  {["App / Student ID", "Fee Type", "Method", "Transaction ID", "Phone", "Amount", "Date", "Status", ""].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-sm text-muted-foreground">
                      {allSubs.length === 0 ? "No payment submissions yet." : "No results match your filters."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const { cls, label, Icon } = statusBadge(s.status);
                    return (
                      <tr key={s.id} className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        selected.has(s.id) && "bg-indigo-50/60",
                      )}>
                        <td className="py-3 px-4">
                          <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {s.applicationId ?? s.studentId ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {s.paymentContext === "admission" ? "Admission" : "Exam Fee"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn("text-xs", methodBadge(s.method))}>
                            {methodLabel(s.method)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{s.transactionId}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{s.phoneNumber}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-green-700">{formatBDT(s.amountSent)}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{fmtDate(s.paymentDate)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn("text-xs gap-1", cls)}>
                            <Icon className="size-2.5" />{label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => { setReviewSub(s); setReviewOpen(true); }}
                          >
                            <Eye className="size-3" />Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {allSubs.length === 0 ? "No payment submissions yet." : "No results match your filters."}
              </div>
            ) : (
              filtered.map((s) => {
                const { cls, label } = statusBadge(s.status);
                return (
                  <div key={s.id} className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono text-muted-foreground">{s.applicationId ?? s.studentId}</p>
                        <p className="text-sm font-medium font-mono mt-0.5">{s.transactionId}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs shrink-0", cls)}>{label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className={cn(methodBadge(s.method))}>{methodLabel(s.method)}</Badge>
                      <span className="text-muted-foreground">{s.phoneNumber}</span>
                      <span className="font-semibold text-green-700">{formatBDT(s.amountSent)}</span>
                      <span className="text-muted-foreground">{fmtDate(s.paymentDate)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 h-8 text-xs"
                      onClick={() => { setReviewSub(s); setReviewOpen(true); }}
                    >
                      <Eye className="size-3.5" />Review
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ── Reports Tab ────────────────────────────────────────────────── */}
        <TabsContent value="reports">
          <ReportsTab submissions={allSubs} />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <PaymentReviewDialog
        submission={reviewSub}
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setReviewSub(null); }}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      {/* Bulk Verify AlertDialog */}
      <AlertDialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Verify Submissions</AlertDialogTitle>
            <AlertDialogDescription>
              Mark {selected.size} submission{selected.size !== 1 ? "s" : ""} as Verified?
              This will update each applicant's payment status and allow receipt download.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
              onClick={handleBulkVerify}
            >
              {saving ? "Verifying…" : `Verify ${selected.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PaymentSubmissionsPage() {
  return <PaymentSubmissionsContent />;
}
