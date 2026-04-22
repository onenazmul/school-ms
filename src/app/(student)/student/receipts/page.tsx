"use client";
// app/(student)/student/receipts/page.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Printer } from "lucide-react";

const MOCK_RECEIPTS = [
  { no:"RCP-001234", amount:5500, date:"2025-05-07", method:"Cash", bills:["Tuition Fee - May 2025"], issuedBy:"Admin" },
  { no:"RCP-001198", amount:5500, date:"2025-04-06", method:"bKash", bills:["Tuition Fee - Apr 2025"], issuedBy:"Admin" },
  { no:"RCP-001142", amount:6700, date:"2025-03-04", method:"Cash", bills:["Tuition Fee - Mar 2025","Exam Fee Q1 2025"], issuedBy:"Admin" },
  { no:"RCP-001089", amount:5500, date:"2025-02-07", method:"Cash", bills:["Tuition Fee - Feb 2025"], issuedBy:"Admin" },
  { no:"RCP-001034", amount:5500, date:"2025-01-08", method:"Bank Transfer", bills:["Tuition Fee - Jan 2025"], issuedBy:"Admin" },
];

const METHOD_COLOR: Record<string,string> = {
  Cash:"bg-green-50 text-green-700 border-green-200",
  bKash:"bg-pink-50 text-pink-700 border-pink-200",
  "Bank Transfer":"bg-blue-50 text-blue-700 border-blue-200",
  Cheque:"bg-slate-50 text-slate-600 border-slate-200",
};

export default function StudentReceiptsPage() {
  const totalPaid = MOCK_RECEIPTS.reduce((s,r)=>s+r.amount,0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Fee Receipts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {MOCK_RECEIPTS.length} receipts · ৳{totalPaid.toLocaleString()} paid total
        </p>
      </div>

      {/* Progress bar for current year */}
      <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-indigo-900">2025 Payment Progress</p>
            <p className="text-sm font-semibold text-indigo-700">{MOCK_RECEIPTS.filter(r=>r.date.startsWith("2025")).length}/12 months</p>
          </div>
          <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500" style={{width:`${(5/12*100).toFixed(0)}%`}} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-indigo-500">
            <span>Jan</span><span>Jun</span><span>Dec</span>
          </div>
        </CardContent>
      </Card>

      {/* Receipt list */}
      <div className="space-y-3">
        {MOCK_RECEIPTS.map(r => (
          <Card key={r.no} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Receipt className="size-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{r.no}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(r.date).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})}
                        {" · "}Issued by {r.issuedBy}
                      </p>
                    </div>
                    <p className="text-base font-semibold shrink-0">৳{r.amount.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1">
                      {r.bills.map(b => (
                        <span key={b} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${METHOD_COLOR[r.method] ?? ""}`}>{r.method}</Badge>
                      <Button variant="ghost" size="icon" className="size-7">
                        <Printer className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
