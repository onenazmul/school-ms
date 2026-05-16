"use client";
// app/(admin)/admin/finance/ledger/page.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, AlertCircle, CheckCircle2, Download } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LedgerEntry = {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  type: "bill" | "payment";
  description: string;
  debit: number;
  credit: number;
  date: string;
  status: "paid" | "unpaid" | "partial" | "overdue" | "waived";
};

type ClassItem = { id: number; name: string };

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid:    { label: "Paid",    className: "bg-green-50 text-green-700 border-green-200" },
  unpaid:  { label: "Unpaid",  className: "bg-slate-50 text-slate-600 border-slate-200" },
  partial: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700 border-red-200" },
  waived:  { label: "Waived",  className: "bg-violet-50 text-violet-700 border-violet-200" },
};

const TYPE_CONFIG = {
  bill:    { label: "Bill",    dot: "bg-slate-400" },
  payment: { label: "Payment", dot: "bg-green-500" },
};

export default function LedgerPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (classFilter !== "all") params.set("class", classFilter);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data, isLoading } = useQuery<{ entries: LedgerEntry[]; total_debit: number; total_credit: number }>({
    queryKey: ["ledger", search, classFilter, statusFilter],
    queryFn: () => fetch(`/api/v1/admin/finance/ledger?${params}`).then((r) => r.json()),
  });

  const { data: classesData } = useQuery<{ classes: ClassItem[] }>({
    queryKey: ["classes-list"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });

  const entries = data?.entries ?? [];
  const totalDebit = data?.total_debit ?? 0;
  const totalCredit = data?.total_credit ?? 0;
  const outstanding = totalDebit - totalCredit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Student Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All financial transactions
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <TrendingUp className="size-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Billed</p>
              {isLoading
                ? <Skeleton className="h-5 w-20 mt-1" />
                : <p className="font-semibold">৳{totalDebit.toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Collected</p>
              {isLoading
                ? <Skeleton className="h-5 w-20 mt-1" />
                : <p className="font-semibold text-green-700">৳{totalCredit.toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              {isLoading
                ? <Skeleton className="h-5 w-20 mt-1" />
                : <p className="font-semibold text-red-700">৳{Math.max(0, outstanding).toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {(classesData?.classes ?? []).map((c) => (
              <SelectItem key={c.id} value={c.name}>Class {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Debit</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Credit</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-14" /></td>
                  </tr>
                ))
              : entries.map((entry) => {
                  const status = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.unpaid;
                  const type = TYPE_CONFIG[entry.type];
                  return (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString("en-BD", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium">{entry.studentName}</p>
                        <p className="text-xs text-muted-foreground">Class {entry.class}</p>
                      </td>
                      <td className="py-3 px-4 max-w-50 truncate text-muted-foreground">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className={`size-1.5 rounded-full ${type.dot}`} />
                          {type.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-green-600">
                        {entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-xs ${status.className}`}>
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {!isLoading && entries.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No ledger entries match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
