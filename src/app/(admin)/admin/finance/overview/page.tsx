"use client";
// app/(admin)/admin/finance/overview/page.tsx

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertCircle, CheckCircle2, Clock, TrendingUp, MessageSquare,
  Search, RefreshCw, ExternalLink, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stats {
  total_outstanding: number;
  total_collected: number;
  collected_this_month: number;
  overdue_count: number;
  pending_verification_count: number;
}

interface FeeBreakdown {
  fee_id: string;
  fee_name: string;
  fee_type: string;
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
  amount_outstanding: number;
  amount_collected: number;
}

interface BillRow {
  id: string;
  student_id: string;
  student_name: string;
  class: string;
  section: string | null;
  roll: string | null;
  fee_config_id: string;
  fee_name: string;
  fee_type: string;
  month: string | null;
  academic_year: string;
  amount: number;
  late_fee: number;
  total: number;
  due_date: string;
  status: string;
  db_status: string;
  phone: string | null;
}

interface FeeConfig { id: string; name: string; type: string }

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; rowCls: string }> = {
  paid:    { label: "Paid",    cls: "bg-green-50 text-green-700 border-green-200",  rowCls: "" },
  waived:  { label: "Waived",  cls: "bg-slate-50 text-slate-500 border-slate-200", rowCls: "" },
  partial: { label: "Partial", cls: "bg-blue-50 text-blue-700 border-blue-200",    rowCls: "" },
  unpaid:  { label: "Unpaid",  cls: "bg-slate-50 text-slate-600 border-slate-200", rowCls: "" },
  overdue: { label: "Overdue", cls: "bg-red-50 text-red-700 border-red-200",       rowCls: "bg-red-50/30" },
};

const TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", one_time: "One-time",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "৳" + n.toLocaleString();
}

function pct(num: number, denom: number) {
  if (!denom) return "—";
  return Math.round((num / denom) * 100) + "%";
}

// ── SMS Dialog ─────────────────────────────────────────────────────────────────

function SmsDialog({
  open,
  onClose,
  selectedBills,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  selectedBills: BillRow[];
  onSent: () => void;
}) {
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, { name: string; phone: string | null; total: number; feeNames: string[] }>();
    for (const b of selectedBills) {
      if (!map.has(b.student_id)) map.set(b.student_id, { name: b.student_name, phone: b.phone, total: 0, feeNames: [] });
      const s = map.get(b.student_id)!;
      s.total += b.total;
      s.feeNames.push(b.fee_name);
    }
    return Array.from(map.values());
  }, [selectedBills]);

  const withPhone = uniqueStudents.filter((s) => s.phone).length;
  const withoutPhone = uniqueStudents.length - withPhone;

  const defaultTemplate = `Dear Parent, {student_name}'s {fee_names} fee of BDT {amount} is due by {due_date}. Please pay promptly. -{school_name}`;
  const [template, setTemplate] = useState(defaultTemplate);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/finance/bills/sms-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billIds: selectedBills.map((b) => b.id),
          messageTemplate: template,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to send");
      toast.success(`SMS sent: ${data.sent} delivered, ${data.failed} failed${data.skipped ? `, ${data.skipped} skipped (no phone)` : ""}`);
      onSent();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "SMS send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-4 text-indigo-600" />
            Send SMS Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border p-3">
              <p className="text-xl font-semibold text-indigo-600">{uniqueStudents.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Students</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xl font-semibold text-green-600">{withPhone}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Will receive</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xl font-semibold text-amber-600">{withoutPhone}</p>
              <p className="text-xs text-muted-foreground mt-0.5">No phone</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Message Template</label>
            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Variables: <code className="bg-muted px-1 rounded">{"{student_name}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{fee_names}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{amount}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{due_date}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{school_name}"}</code>
            </p>
          </div>

          {withoutPhone > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {withoutPhone} student{withoutPhone > 1 ? "s" : ""} have no phone number in their admission records and will be skipped.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleSend}
            disabled={loading || withPhone === 0}
          >
            {loading
              ? <><Loader2 className="size-4 animate-spin" />Sending…</>
              : <><MessageSquare className="size-4" />Send to {withPhone} student{withPhone !== 1 ? "s" : ""}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FinanceOverviewPage() {
  const [filters, setFilters] = useState({
    status: "all",
    className: "all",
    feeConfigId: "all",
    month: "all",
    year: String(new Date().getFullYear()),
    search: "",
  });
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smsOpen, setSmsOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  // Stats
  const { data: overviewData, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    stats: Stats;
    breakdown: FeeBreakdown[];
  }>({
    queryKey: ["finance-overview"],
    queryFn: () => fetch("/api/v1/admin/finance/overview").then((r) => r.json()),
  });

  // Fee configs for filter dropdown
  const { data: feeConfigsData } = useQuery<{ fees: FeeConfig[] }>({
    queryKey: ["fee-configs"],
    queryFn: () => fetch("/api/v1/admin/fee-configs").then((r) => r.json()),
  });
  const feeConfigs = feeConfigsData?.fees ?? [];

  // Classes for filter dropdown
  const { data: classesData } = useQuery<{ classes: { id: number; name: string; isActive: boolean }[] }>({
    queryKey: ["school-classes"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const activeClasses = (classesData?.classes ?? []).filter((c) => c.isActive).map((c) => c.name);

  // Build query string
  const queryStr = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== "all").map(([k, v]) => [k, v]))
  ).toString();

  // Bills
  const { data: billsData, isLoading: billsLoading, refetch: refetchBills } = useQuery<{ bills: BillRow[] }>({
    queryKey: ["finance-bills", filters],
    queryFn: () => fetch(`/api/v1/admin/finance/bills${queryStr ? "?" + queryStr : ""}`).then((r) => r.json()),
  });

  const allBills = billsData?.bills ?? [];

  // Client-side name search
  const bills = useMemo(() => {
    if (!search.trim()) return allBills;
    const q = search.toLowerCase();
    return allBills.filter((b) => b.student_name.toLowerCase().includes(q));
  }, [allBills, search]);

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedIds(new Set());
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const unpaidBills = bills.filter((b) => b.status !== "paid" && b.status !== "waived");
    if (selectedIds.size === unpaidBills.length && unpaidBills.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaidBills.map((b) => b.id)));
    }
  }

  const unpaidBills = bills.filter((b) => b.status !== "paid" && b.status !== "waived");
  const selectedBills = allBills.filter((b) => selectedIds.has(b.id));
  const allUnpaidSelected = unpaidBills.length > 0 && selectedIds.size === unpaidBills.length;

  const stats = overviewData?.stats;
  const breakdown = overviewData?.breakdown ?? [];

  function refetchAll() {
    refetchStats();
    refetchBills();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Fee Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track outstanding dues, collection stats, and send reminders
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={refetchAll}>
          <RefreshCw className="size-3.5" />Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <Card className="lg:col-span-1">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {fmt(stats?.total_outstanding ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">unpaid + partial</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {fmt(stats?.collected_this_month ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">collected</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">All Time</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {fmt(stats?.total_collected ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">collected</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardContent className="pt-4 pb-4 flex items-start gap-2">
                <AlertCircle className="size-4 text-red-500 mt-3.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats?.overdue_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">bills</p>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardContent className="pt-4 pb-4 flex items-start gap-2">
                <Clock className="size-4 text-amber-500 mt-3.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.pending_verification_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <a href="/admin/admissions/payments" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                      Review <ExternalLink className="size-2.5" />
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Fee Breakdown */}
      {breakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setBreakdownOpen((o) => !o)}
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-indigo-600" />
                Collection by Fee Type
              </CardTitle>
              {breakdownOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
          </CardHeader>
          {breakdownOpen && (
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground text-xs">Fee</th>
                      <th className="text-left py-2 font-medium text-muted-foreground text-xs">Type</th>
                      <th className="text-center py-2 font-medium text-muted-foreground text-xs">Total</th>
                      <th className="text-center py-2 font-medium text-muted-foreground text-xs">Paid</th>
                      <th className="text-center py-2 font-medium text-muted-foreground text-xs">Unpaid</th>
                      <th className="text-center py-2 font-medium text-muted-foreground text-xs">Overdue</th>
                      <th className="text-right py-2 font-medium text-muted-foreground text-xs">Outstanding</th>
                      <th className="text-right py-2 font-medium text-muted-foreground text-xs">Collected</th>
                      <th className="text-right py-2 font-medium text-muted-foreground text-xs">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row) => (
                      <tr key={row.fee_id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 font-medium">{row.fee_name}</td>
                        <td className="py-2">
                          <Badge variant="secondary" className="text-xs">{TYPE_LABELS[row.fee_type] ?? row.fee_type}</Badge>
                        </td>
                        <td className="py-2 text-center text-muted-foreground">{row.total}</td>
                        <td className="py-2 text-center">
                          <span className="text-green-700 font-medium">{row.paid}</span>
                        </td>
                        <td className="py-2 text-center text-slate-600">{row.unpaid}</td>
                        <td className="py-2 text-center">
                          {row.overdue > 0
                            ? <span className="text-red-600 font-medium">{row.overdue}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2 text-right text-amber-700 font-medium">
                          {row.amount_outstanding > 0 ? fmt(row.amount_outstanding) : "—"}
                        </td>
                        <td className="py-2 text-right text-green-700">{fmt(row.amount_collected)}</td>
                        <td className="py-2 text-right">
                          <span className={cn(
                            "font-medium",
                            Number(pct(row.paid, row.total).replace("%", "")) >= 80
                              ? "text-green-700"
                              : Number(pct(row.paid, row.total).replace("%", "")) >= 50
                              ? "text-amber-700"
                              : "text-red-700",
                          )}>
                            {pct(row.paid, row.total)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Bills Table */}
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search student…"
              className="pl-8 h-8 w-44 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.className} onValueChange={(v) => setFilter("className", v)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {activeClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.feeConfigId} onValueChange={(v) => setFilter("feeConfigId", v)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Fee Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fees</SelectItem>
              {feeConfigs.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.month} onValueChange={(v) => setFilter("month", v)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.year} onValueChange={(v) => setFilter("year", v)}>
            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.status !== "all" || filters.className !== "all" || filters.feeConfigId !== "all" || filters.month !== "all" || filters.year !== String(new Date().getFullYear()) || search) && (
            <Button
              variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                setFilters({ status: "all", className: "all", feeConfigId: "all", month: "all", year: String(new Date().getFullYear()), search: "" });
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          )}

          <div className="ml-auto text-xs text-muted-foreground">
            {bills.length} bill{bills.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="w-9 px-3 py-2.5">
                    <Checkbox
                      checked={allUnpaidSelected}
                      onCheckedChange={toggleAll}
                      className="size-3.5"
                    />
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Student</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Class</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Fee</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Period</th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">Amount</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Due Date</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
                  <th className="w-8 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {billsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={10} className="px-3 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No bills match the current filters.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => {
                    const sc = STATUS_CONFIG[bill.status] ?? STATUS_CONFIG.unpaid;
                    const isSelectable = bill.status !== "paid" && bill.status !== "waived";
                    const selected = selectedIds.has(bill.id);
                    const dueDate = new Date(bill.due_date);
                    const isOverdue = bill.status === "overdue";

                    return (
                      <tr
                        key={bill.id}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/20 transition-colors",
                          sc.rowCls,
                          selected ? "bg-indigo-50/50" : "",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          {isSelectable && (
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleRow(bill.id)}
                              className="size-3.5"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-xs leading-tight">{bill.student_name}</p>
                          {bill.roll && <p className="text-xs text-muted-foreground">Roll {bill.roll}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {bill.class}{bill.section ? ` (${bill.section})` : ""}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium">{bill.fee_name}</p>
                          <p className="text-xs text-muted-foreground">{TYPE_LABELS[bill.fee_type] ?? bill.fee_type}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {bill.month ? `${bill.month} ${bill.academic_year}` : bill.academic_year}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap">
                          {fmt(bill.total)}
                          {bill.late_fee > 0 && (
                            <p className="text-amber-600 font-normal text-xs">+{fmt(bill.late_fee)} late</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                          <span className={cn(isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                            {dueDate.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={cn("text-xs", sc.cls)}>
                            {sc.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {bill.phone ?? <span className="text-red-400 text-xs">No phone</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <a
                            href={`/admin/students/${bill.student_id}`}
                            className="text-muted-foreground hover:text-indigo-600 transition-colors"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl shadow-black/20">
          <p className="text-sm font-medium">
            {selectedIds.size} bill{selectedIds.size !== 1 ? "s" : ""} selected
            <span className="text-slate-400 ml-1.5 font-normal">
              — {fmt(selectedBills.reduce((s, b) => s + b.total, 0))} outstanding
            </span>
          </p>
          <Separator orientation="vertical" className="h-4 bg-slate-600" />
          <Button
            size="sm"
            className="bg-indigo-500 hover:bg-indigo-400 text-white gap-1.5 h-8 text-xs"
            onClick={() => setSmsOpen(true)}
          >
            <MessageSquare className="size-3.5" />
            Send SMS Reminder
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white h-8 text-xs px-2"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* SMS Dialog */}
      <SmsDialog
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        selectedBills={selectedBills}
        onSent={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
