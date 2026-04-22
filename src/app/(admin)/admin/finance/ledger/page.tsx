"use client";
// app/(admin)/admin/finance/ledger/page.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  section: string;
  type: "bill" | "payment" | "adjustment";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  date: string;
  status: "paid" | "unpaid" | "partial" | "overdue";
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_LEDGER: LedgerEntry[] = [
  { id:"1", studentId:"S001", studentName:"Rahim Uddin", class:"9", section:"A", type:"bill", description:"Tuition Fee - May 2025", debit:5500, credit:0, balance:5500, date:"2025-05-01", status:"paid" },
  { id:"2", studentId:"S001", studentName:"Rahim Uddin", class:"9", section:"A", type:"payment", description:"Payment received - Cash", debit:0, credit:5500, balance:0, date:"2025-05-07", status:"paid" },
  { id:"3", studentId:"S002", studentName:"Fatema Begum", class:"6", section:"B", type:"bill", description:"Tuition Fee - May 2025", debit:5500, credit:0, balance:5500, date:"2025-05-01", status:"overdue" },
  { id:"4", studentId:"S003", studentName:"Karim Hossain", class:"10", section:"C", type:"bill", description:"Tuition Fee - May 2025", debit:5500, credit:0, balance:5500, date:"2025-05-01", status:"partial" },
  { id:"5", studentId:"S003", studentName:"Karim Hossain", class:"10", section:"C", type:"payment", description:"Partial payment - bKash", debit:0, credit:3000, balance:2500, date:"2025-05-10", status:"partial" },
  { id:"6", studentId:"S004", studentName:"Nasrin Akter", class:"8", section:"A", type:"bill", description:"Tuition Fee - May 2025", debit:5500, credit:0, balance:5500, date:"2025-05-01", status:"paid" },
  { id:"7", studentId:"S004", studentName:"Nasrin Akter", class:"8", section:"A", type:"payment", description:"Payment received - Bank Transfer", debit:0, credit:5500, balance:0, date:"2025-05-05", status:"paid" },
  { id:"8", studentId:"S005", studentName:"Jamal Sheikh", class:"7", section:"B", type:"bill", description:"Exam Fee - Q2 2025", debit:1200, credit:0, balance:1200, date:"2025-04-01", status:"unpaid" },
];

const STATUS_CONFIG = {
  paid:    { label: "Paid",    className: "bg-green-50 text-green-700 border-green-200" },
  unpaid:  { label: "Unpaid",  className: "bg-slate-50 text-slate-600 border-slate-200" },
  partial: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700 border-red-200" },
};

const TYPE_CONFIG = {
  bill:       { label: "Bill",       dot: "bg-slate-400" },
  payment:    { label: "Payment",    dot: "bg-green-500" },
  adjustment: { label: "Adjustment", dot: "bg-indigo-500" },
};

export default function LedgerPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_LEDGER.filter((e) => {
    const matchSearch =
      !search ||
      e.studentName.toLowerCase().includes(search.toLowerCase()) ||
      e.studentId.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || e.class === classFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const totalDebit  = filtered.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);
  const outstanding = filtered.filter((e) => e.balance > 0).reduce((s, e) => s + e.balance, 0);

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
              <p className="font-semibold">৳{totalDebit.toLocaleString()}</p>
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
              <p className="font-semibold text-green-700">৳{totalCredit.toLocaleString()}</p>
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
              <p className="font-semibold text-red-700">৳{outstanding.toLocaleString()}</p>
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
            {["1","2","3","4","5","6","7","8","9","10"].map((c) => (
              <SelectItem key={c} value={c}>Class {c}</SelectItem>
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
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Balance</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((entry) => {
              const status = STATUS_CONFIG[entry.status];
              const type = TYPE_CONFIG[entry.type];
              return (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString("en-BD", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-medium">{entry.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      Class {entry.class}{entry.section} · {entry.studentId}
                    </p>
                  </td>
                  <td className="py-3 px-4 max-w-[200px] truncate text-muted-foreground">
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
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {entry.balance > 0 ? (
                      <span className="text-red-600">৳{entry.balance.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-600">৳0</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={`text-xs ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No ledger entries match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
