"use client";
// app/(student)/student/payments/page.tsx
// Student exam fee list — shows all exam fees with status and pay/receipt buttons.

import { useStudentSession } from "@/lib/auth/student-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatBDT, fmtDate } from "@/lib/utils/format";
import { getExamFeesByStudentId } from "@/lib/mock-data/payments";
import { fetchAndDownload } from "@/lib/documents/download-helpers";
import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen, CreditCard, Download, Loader2, Clock, CheckCircle2,
  AlertTriangle, CalendarClock,
} from "lucide-react";
import type { ExamFee } from "@/lib/mock-data/payments";

function statusBadge(status: ExamFee["status"]) {
  switch (status) {
    case "verified": return { label: "Verified ✓",          cls: "bg-green-50 text-green-700 border-green-200" };
    case "pending":  return { label: "Pending Verification", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "overdue":  return { label: "Overdue",              cls: "bg-red-50 text-red-700 border-red-200" };
    default:         return { label: "Unpaid",               cls: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

function ExamFeeCard({ fee, studentId }: { fee: ExamFee; studentId: string }) {
  const [downloading, setDownloading] = useState(false);
  const badge = statusBadge(fee.status);
  const verifiedSub = fee.submissions.find((s) => s.status === "verified");

  async function handleDownload() {
    if (!verifiedSub) return;
    setDownloading(true);
    try {
      await fetchAndDownload(
        `/api/documents/payment-receipt/${verifiedSub.id}`,
        `Receipt_${fee.id}_${new Date().getFullYear()}.pdf`,
      );
      toast.success("Receipt downloaded.");
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <BookOpen className="size-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">{fee.examName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Academic Year: {fee.academicYear}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0", badge.cls)}>
          {badge.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Fee Amount</span>
        <span className="font-semibold text-lg">{formatBDT(fee.feeAmount)}</span>
      </div>

      {fee.dueDate && (
        <div className={cn(
          "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
          fee.status === "overdue"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-amber-50 border border-amber-200 text-amber-700",
        )}>
          <CalendarClock className="size-3.5 shrink-0" />
          {fee.status === "overdue" ? "Overdue since" : "Due by"}&nbsp;
          {fmtDate(fee.dueDate)}
        </div>
      )}

      <div className="flex gap-2">
        {(fee.status === "unpaid" || fee.status === "overdue") && (
          <Button
            size="sm"
            className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            asChild
          >
            <a href={`/student/payments/exam-fee?examId=${fee.id}`}>
              <CreditCard className="size-3.5" />Pay Now
            </a>
          </Button>
        )}
        {fee.status === "pending" && (
          <Button size="sm" variant="outline" className="flex-1 gap-2" asChild>
            <a href={`/student/payments/exam-fee?examId=${fee.id}`}>
              <Clock className="size-3.5" />View Submission
            </a>
          </Button>
        )}
        {fee.status === "verified" && verifiedSub && (
          <Button
            size="sm"
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? <><Loader2 className="size-3.5 animate-spin" />Downloading…</>
              : <><Download className="size-3.5" />Download Receipt</>}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function StudentPaymentsPage() {
  const { session, loading } = useStudentSession();

  if (loading) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  // TODO: replace with real API call GET /api/students/:id/exam-fees
  const studentId = String(session?.id ?? "1");
  const fees = getExamFeesByStudentId(studentId);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="size-5 text-indigo-600" />
          Exam Fees
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pay exam fees and download receipts
        </p>
      </div>

      {fees.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center space-y-2">
          <CheckCircle2 className="size-8 text-green-500 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">No exam fees found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => (
            <ExamFeeCard key={fee.id} fee={fee} studentId={studentId} />
          ))}
        </div>
      )}
    </div>
  );
}
