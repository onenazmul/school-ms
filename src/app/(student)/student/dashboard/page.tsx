"use client";
// app/(student)/student/dashboard/page.tsx

import { useStudentSession } from "@/lib/auth/student-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, CheckCircle2, AlertCircle, Clock, Receipt, FileText,
} from "lucide-react";

const MOCK_STUDENT = {
  name: "Rahim Uddin",
  class: "9A",
  rollNo: "09A-12",
  admissionNo: "BFS-2024-0127",
  dueBalance: 0,
  paidThisYear: 49500,
  nextDue: { description: "Tuition Fee - June 2025", amount: 5500, dueDate: "2025-06-10" },
  recentReceipts: [
    { no: "RCP-001234", amount: 5500, date: "2025-05-07", method: "Cash" },
    { no: "RCP-001198", amount: 5500, date: "2025-04-06", method: "bKash" },
    { no: "RCP-001142", amount: 6700, date: "2025-03-04", method: "Cash" },
  ],
};

export default function StudentDashboard() {
  const { session } = useStudentSession();
  const student = MOCK_STUDENT;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {/* Welcome back, {session?.name?.split(" ")[0] ?? "Student"} */}
            Welcome back, {session?.name ?? "Student"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {/* Class {student.class} · Roll {student.rollNo} · {student.admissionNo} */}
            @{session?.username} 
          </p>
        </div>
        <Badge
          variant="outline"
          className={`${student.dueBalance === 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          {student.dueBalance === 0 ? "All Clear" : `৳${student.dueBalance.toLocaleString()} Due`}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Paid This Year</p>
                <p className="text-xl font-semibold mt-0.5">
                  ৳{student.paidThisYear.toLocaleString()}
                </p>
              </div>
              <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Due</p>
                <p className="text-xl font-semibold mt-0.5">
                  ৳{student.dueBalance.toLocaleString()}
                </p>
              </div>
              <div className={`size-10 rounded-xl flex items-center justify-center ${student.dueBalance > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                <AlertCircle className={`size-5 ${student.dueBalance > 0 ? "text-red-600" : "text-slate-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next due */}
      {student.nextDue && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900">{student.nextDue.description}</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Due: {new Date(student.nextDue.dueDate).toLocaleDateString("en-BD", { day: "numeric", month: "long" })}
                </p>
              </div>
              <p className="text-lg font-semibold text-indigo-800 shrink-0">
                ৳{student.nextDue.amount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent receipts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Receipts</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
              <a href="/student/receipts">View all</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {student.recentReceipts.map((r) => (
            <div
              key={r.no}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-green-50 flex items-center justify-center">
                  <Receipt className="size-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{r.no}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
                    {" · "}{r.method}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium">৳{r.amount.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <a href="/student/ledger"><DollarSign className="size-4" />View Ledger</a>
        </Button>
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <a href="/student/receipts"><FileText className="size-4" />All Receipts</a>
        </Button>
      </div>
    </div>
  );
}
