"use client";
// app/(admission)/admission/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, CreditCard, FileText, Receipt,
  GraduationCap, AlertCircle, ChevronRight,
} from "lucide-react";

type Admission = {
  id: number;
  name: string;
  class_name: string;
  gender: string;
  dob: string;
  status: string;
  application_fee: string;
  payment_tracking_id: string | null;
  username: string;
  created_at: string;
};

const APPLICATION_FEE = 100;

function isPaid(a: Admission) {
  return a.payment_tracking_id !== null &&
    a.payment_tracking_id !== "4" &&
    a.payment_tracking_id !== "";
}

function statusConfig(status: string) {
  if (status === "Approved")
    return { label: "Approved",     cls: "bg-green-50 text-green-700 border-green-200" };
  if (status === "Rejected")
    return { label: "Rejected",     cls: "bg-red-50 text-red-700 border-red-200" };
  return   { label: "Under Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
}

export default function AdmissionDashboard() {
  const { session, loading: sessionLoading } = useStudentSession();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    api
      .get<{ admission: Admission }>(EP.ADMISSION(session.id), session.laravelToken)
      .then((r) => setAdmission(r.admission))
      .catch((err) => toast.error(err.message ?? "Could not load application"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center space-y-3 mt-4">
        <AlertCircle className="size-7 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Could not load your application.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const paid  = isPaid(admission);
  const sc    = statusConfig(admission.status);

  return (
    <div className="space-y-5 pt-2">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Welcome, {admission.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">{admission.username}</p>
        </div>
        <Badge variant="outline" className={sc.cls}>{sc.label}</Badge>
      </div>

      {/* Application status card */}
      {admission.status === "Approved" ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <p className="font-semibold text-green-800">Application Approved!</p>
          </div>
          <p className="text-sm text-green-700 pl-7">
            Congratulations! Contact the school office for your enrollment details.
          </p>
        </div>
      ) : admission.status === "Rejected" ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <p className="font-semibold text-red-800">Application Not Approved</p>
          </div>
          <p className="text-sm text-red-700 pl-7">
            Please contact the school office for more information.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-indigo-600 shrink-0" />
            <p className="font-semibold text-indigo-800">Application Under Review</p>
          </div>
          <p className="text-sm text-indigo-700 pl-7">
            The school will review your application and update the status.
          </p>
        </div>
      )}

      {/* Payment status */}
      {paid ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Fee Paid</p>
              <p className="text-xs text-green-700">Application fee of ৳{APPLICATION_FEE} received.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild className="shrink-0">
            <a href="/admission/application/receipt">View Receipt</a>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Payment Pending</p>
              <p className="text-xs text-amber-700">Pay the ৳{APPLICATION_FEE} application fee to complete your submission.</p>
            </div>
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            asChild
          >
            <a href="/admission/application">
              <CreditCard className="size-4" />
              Pay Application Fee — ৳{APPLICATION_FEE}
            </a>
          </Button>
        </div>
      )}

      {/* Application summary */}
      <div className="rounded-xl border bg-background p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="size-4 text-indigo-600" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Application Summary
          </p>
        </div>
        {[
          ["Applied Class", admission.class_name],
          ["Gender",        admission.gender],
          ["Date of Birth", admission.dob],
          ["Submitted",     new Date(admission.created_at).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/admission/application"
          className="flex items-center justify-between rounded-xl border bg-background p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText className="size-4 text-indigo-600" />
            </div>
            <span className="text-sm font-medium">Application</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a
          href="/admission/application/receipt"
          className="flex items-center justify-between rounded-xl border bg-background p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Receipt className="size-4 text-green-600" />
            </div>
            <span className="text-sm font-medium">Receipt</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Questions? Contact the school office with your application ID:{" "}
        <span className="font-mono font-medium">{admission.username}</span>
      </p>
    </div>
  );
}
