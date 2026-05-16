"use client";
// app/(admin)/admin/finance/receipts/history/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Download } from "lucide-react";

type Receipt = {
  id: string;
  receipt_number: string;
  student_name: string;
  class: string;
  section: string | null;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
  bills: string[];
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", bank_transfer: "Bank Transfer", online: "Online", cheque: "Cheque",
};

export default function ReceiptHistoryPage() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (method !== "all") params.set("method", method);

  const { data, isLoading } = useQuery<{ receipts: Receipt[] }>({
    queryKey: ["receipts-history", search, method],
    queryFn: () => fetch(`/api/v1/admin/finance/receipts?${params}`).then((r) => r.json()),
  });

  const receipts = data?.receipts ?? [];
  const total = receipts.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/finance/receipts" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />New Receipt
        </Link>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="size-4" />Export
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold">Receipt History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? "Loading…" : `${receipts.length} receipts · ৳${total.toLocaleString()} total`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search receipt or student…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {Object.entries(METHOD_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-x-auto bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Receipt No.</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bills</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3 px-4 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              : receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium">{r.receipt_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{r.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Class {r.class}{r.section ? ` · ${r.section}` : ""}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {r.bills.map((b) => (
                          <span key={b} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{b}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{METHOD_LABELS[r.method] ?? r.method}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">৳{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && receipts.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No receipts found.</div>
        )}
      </div>
    </div>
  );
}
