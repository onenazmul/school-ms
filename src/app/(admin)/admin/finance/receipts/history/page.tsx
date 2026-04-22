"use client";
// app/(admin)/admin/finance/receipts/history/page.tsx

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Printer, Download } from "lucide-react";

const MOCK_RECEIPTS = [
  { no:"RCP-001240", student:"Rahim Uddin",    class:"9A",  amount:5500,  date:"2025-05-07", method:"cash",          bills:["Tuition - May 2025"] },
  { no:"RCP-001239", student:"Fatema Begum",   class:"6B",  amount:6700,  date:"2025-05-06", method:"bank_transfer", bills:["Tuition - May 2025","Exam Fee Q2"] },
  { no:"RCP-001238", student:"Nasrin Akter",   class:"8A",  amount:5500,  date:"2025-05-05", method:"cash",          bills:["Tuition - May 2025"] },
  { no:"RCP-001237", student:"Karim Hossain",  class:"10C", amount:3000,  date:"2025-05-04", method:"online",        bills:["Tuition - May 2025 (Partial)"] },
  { no:"RCP-001236", student:"Ruma Khatun",    class:"5A",  amount:4500,  date:"2025-05-03", method:"cash",          bills:["Tuition - May 2025"] },
  { no:"RCP-001235", student:"Jamal Sheikh",   class:"7B",  amount:5500,  date:"2025-05-02", method:"cheque",        bills:["Tuition - May 2025"] },
  { no:"RCP-001234", student:"Rahim Uddin",    class:"9A",  amount:5500,  date:"2025-04-06", method:"cash",          bills:["Tuition - Apr 2025"] },
  { no:"RCP-001198", student:"Fatema Begum",   class:"6B",  amount:5500,  date:"2025-04-05", method:"bank_transfer", bills:["Tuition - Apr 2025"] },
];

const METHOD_LABELS: Record<string,string> = {
  cash:"Cash", bank_transfer:"Bank Transfer", online:"Online", cheque:"Cheque",
};

export default function ReceiptHistoryPage() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");

  const filtered = MOCK_RECEIPTS.filter(r => {
    const ms = !search || r.student.toLowerCase().includes(search.toLowerCase()) || r.no.toLowerCase().includes(search.toLowerCase());
    const mm = method === "all" || r.method === method;
    return ms && mm;
  });

  const total = filtered.reduce((s,r) => s + r.amount, 0);

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
          {filtered.length} receipts · ৳{total.toLocaleString()} total
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search receipt or student…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {Object.entries(METHOD_LABELS).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}
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
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(r => (
              <tr key={r.no} className="hover:bg-muted/30 transition-colors group">
                <td className="py-3 px-4 font-mono text-xs font-medium">{r.no}</td>
                <td className="py-3 px-4">
                  <p className="font-medium">{r.student}</p>
                  <p className="text-xs text-muted-foreground">Class {r.class}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {r.bills.map(b=>(
                      <span key={b} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{b}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(r.date).toLocaleDateString("en-BD",{day:"2-digit",month:"short",year:"numeric"})}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className="text-xs">{METHOD_LABELS[r.method]}</Badge>
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium">৳{r.amount.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Printer className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No receipts found.</div>
        )}
      </div>
    </div>
  );
}
