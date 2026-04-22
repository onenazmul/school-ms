"use client";
// app/(student)/student/ledger/page.tsx

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, TrendingUp, DollarSign, Download } from "lucide-react";

const YEARS = ["2025","2024","2023"];

const ALL_ENTRIES = [
  { id:"1",  description:"Tuition Fee - May 2025",   type:"bill",    debit:5500, credit:0,    balance:0,    date:"2025-05-01", status:"paid" },
  { id:"2",  description:"Payment received - Cash",  type:"payment", debit:0,    credit:5500, balance:0,    date:"2025-05-07", status:"paid" },
  { id:"3",  description:"Tuition Fee - Apr 2025",   type:"bill",    debit:5500, credit:0,    balance:0,    date:"2025-04-01", status:"paid" },
  { id:"4",  description:"Payment received - bKash", type:"payment", debit:0,    credit:5500, balance:0,    date:"2025-04-06", status:"paid" },
  { id:"5",  description:"Exam Fee - Q1 2025",       type:"bill",    debit:1200, credit:0,    balance:0,    date:"2025-03-01", status:"paid" },
  { id:"6",  description:"Payment received - Cash",  type:"payment", debit:0,    credit:1200, balance:0,    date:"2025-03-05", status:"paid" },
  { id:"7",  description:"Tuition Fee - Mar 2025",   type:"bill",    debit:5500, credit:0,    balance:0,    date:"2025-03-01", status:"paid" },
  { id:"8",  description:"Payment received - Cash",  type:"payment", debit:0,    credit:5500, balance:0,    date:"2025-03-03", status:"paid" },
  { id:"9",  description:"Tuition Fee - Feb 2025",   type:"bill",    debit:5500, credit:0,    balance:0,    date:"2025-02-01", status:"paid" },
  { id:"10", description:"Payment received - Cash",  type:"payment", debit:0,    credit:5500, balance:0,    date:"2025-02-07", status:"paid" },
  { id:"11", description:"Tuition Fee - Jun 2025",   type:"bill",    debit:5500, credit:0,    balance:5500, date:"2025-06-01", status:"unpaid" },
];

const STATUS_STYLE: Record<string,string> = {
  paid:"bg-green-50 text-green-700 border-green-200",
  unpaid:"bg-amber-50 text-amber-700 border-amber-200",
  partial:"bg-orange-50 text-orange-700 border-orange-200",
  overdue:"bg-red-50 text-red-700 border-red-200",
};

export default function StudentLedgerPage() {
  const [year, setYear] = useState("2025");

  const entries = ALL_ENTRIES.filter(e => e.date.startsWith(year));
  const totalBilled = entries.filter(e=>e.type==="bill").reduce((s,e)=>s+e.debit,0);
  const totalPaid   = entries.filter(e=>e.type==="payment").reduce((s,e)=>s+e.credit,0);
  const outstanding = entries.filter(e=>e.balance>0).reduce((s,e)=>s+e.balance,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full financial history</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <Download className="size-3.5" />Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <TrendingUp className="size-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Billed</p>
                <p className="font-semibold text-sm">৳{totalBilled.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="font-semibold text-sm text-green-700">৳{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={outstanding > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className={`size-8 rounded-lg flex items-center justify-center ${outstanding > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                <DollarSign className={`size-4 ${outstanding > 0 ? "text-red-600" : "text-slate-400"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className={`font-semibold text-sm ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                  ৳{outstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline entries */}
      <div className="space-y-2">
        {entries.map((entry,i) => (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className={`size-3 rounded-full mt-4 shrink-0 ${entry.type==="payment" ? "bg-green-500" : entry.balance > 0 ? "bg-amber-400" : "bg-slate-300"}`} />
              {i < entries.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>

            {/* Card */}
            <div className={`flex-1 mb-2 rounded-xl border p-3.5 ${entry.type==="payment" ? "bg-green-50/30 border-green-100" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(entry.date).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {entry.debit > 0 && <p className="text-sm font-semibold">৳{entry.debit.toLocaleString()}</p>}
                  {entry.credit > 0 && <p className="text-sm font-semibold text-green-600">+৳{entry.credit.toLocaleString()}</p>}
                  <Badge variant="outline" className={`text-xs mt-1 ${STATUS_STYLE[entry.status]}`}>
                    {entry.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No entries for {year}
        </div>
      )}
    </div>
  );
}
