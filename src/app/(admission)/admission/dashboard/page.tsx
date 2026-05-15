"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, CreditCard, FileText, Receipt,
  GraduationCap, AlertCircle, ChevronRight, AlertTriangle, ExternalLink,
} from "lucide-react";

type Admission = {
  id: number;
  name_en: string;
  class_name: string;
  gender: string;
  dob: string;
  status: string;
  payment_status: string;
  application_fee: string;
  payment_tracking_id: string | null;
  enrollment_payment_status: string;
  enrollment_fee_required: boolean;
  enrollment_fee_amount: number | null;
  username: string;
  created_at: string;
};

function statusBadgeConfig(status: string, paymentStatus: string) {
  if (status === "Enrolled")
    return { label: "Enrolled",         cls: "bg-green-50 text-green-700 border-green-200" };
  if (status === "Approved")
    return { label: "Approved",         cls: "bg-teal-50 text-teal-700 border-teal-200" };
  if (status === "Rejected")
    return { label: "Not Selected",     cls: "bg-red-50 text-red-700 border-red-200" };
  if (status === "Awaiting Test")
    return { label: "Awaiting Test",    cls: "bg-purple-50 text-purple-700 border-purple-200" };
  if (status === "Under Review")
    return { label: "Under Review",     cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (paymentStatus === "Payment Submitted")
    return { label: "Payment Review",   cls: "bg-blue-50 text-blue-700 border-blue-200" };
  // Pending + Unpaid
  return     { label: "Payment Pending", cls: "bg-orange-50 text-orange-700 border-orange-200" };
}

export default function AdmissionDashboard() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/admissions/me")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load application");
        return r.json();
      })
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

  const { status, payment_status } = admission;
  const applicationFee    = Number(admission.application_fee) || 0;
  const isFree            = applicationFee === 0;
  const isPaid            = payment_status === "Paid";
  const sc                = statusBadgeConfig(status, payment_status);
  const needsEnrollmentFee =
    status === "Approved" &&
    admission.enrollment_fee_required &&
    admission.enrollment_payment_status === "Unpaid";
  const enrollmentSubmitted =
    status === "Approved" &&
    admission.enrollment_fee_required &&
    admission.enrollment_payment_status === "Payment Submitted";

  return (
    <div className="space-y-5 pt-2">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Welcome, {admission.name_en.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">{admission.username}</p>
        </div>
        <Badge variant="outline" className={sc.cls}>{sc.label}</Badge>
      </div>

      {/* Application status card */}
      {status === "Enrolled" ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <p className="font-semibold text-green-800">Congratulations — Enrolled!</p>
          </div>
          <p className="text-sm text-green-700 pl-7">
            Your admission is confirmed. You can now access your student account.
          </p>
          <a
            href="/student/dashboard"
            className="ml-7 inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 underline underline-offset-2"
          >
            <GraduationCap className="size-3.5" />
            Go to Student Panel
            <ExternalLink className="size-3 opacity-60" />
          </a>
        </div>
      ) : status === "Rejected" ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <p className="font-semibold text-red-800">Application Not Selected</p>
          </div>
          <p className="text-sm text-red-700 pl-7">
            Please contact the school office for more information.
          </p>
        </div>
      ) : status === "Under Review" ? (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-amber-600 shrink-0" />
            <p className="font-semibold text-amber-800">Application Under Review</p>
          </div>
          <p className="text-sm text-amber-700 pl-7">
            The school is reviewing your application. We will notify you about any updates.
          </p>
        </div>
      ) : status === "Pending" ? (
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-500 shrink-0" />
            <p className="font-semibold text-orange-800">Action Required — Complete Payment</p>
          </div>
          <p className="text-sm text-orange-700 pl-7">
            Your application is pending. Pay the application fee of{" "}
            <strong>৳{applicationFee}</strong> to be eligible for review.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-indigo-600 shrink-0" />
            <p className="font-semibold text-indigo-800">{status}</p>
          </div>
        </div>
      )}

      {/* Payment / fee section */}
      {isFree ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">No Application Fee Required</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your application has been submitted and is under review.
            </p>
          </div>
        </div>
      ) : isPaid ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Fee Paid — ৳{applicationFee}</p>
              <p className="text-xs text-green-700">Application fee verified by the school.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild className="shrink-0">
            <a href="/admission/application/receipt">View Receipt</a>
          </Button>
        </div>
      ) : payment_status === "Payment Submitted" ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
          <Clock className="size-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Payment Under Verification</p>
            <p className="text-xs text-blue-700 mt-0.5">
              We received your payment proof and are reviewing it. Receipt will be available once verified.
            </p>
          </div>
        </div>
      ) : payment_status === "Fake Payment Proof" ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Payment Could Not Be Verified</p>
              <p className="text-xs text-red-700">Please resubmit a valid payment proof.</p>
            </div>
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" asChild>
            <a href="/admission/application/payment">
              <CreditCard className="size-4" />
              Resubmit Payment Proof
            </a>
          </Button>
        </div>
      ) : (
        // Unpaid + Pending — needs to pay
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Payment Required</p>
              <p className="text-xs text-orange-700">
                Pay ৳{applicationFee} to make your application eligible for review.
              </p>
            </div>
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" asChild>
            <a href="/admission/application">
              <CreditCard className="size-4" />
              Pay Application Fee — ৳{applicationFee}
            </a>
          </Button>
        </div>
      )}

      {/* Enrollment fee section */}
      {needsEnrollmentFee && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Action Required — Pay Enrollment Fee</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your application is approved! Pay the enrollment fee
                {admission.enrollment_fee_amount ? ` of ৳${admission.enrollment_fee_amount}` : ""} to confirm your seat.
              </p>
            </div>
          </div>
          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2" asChild>
            <a href="/admission/application/enrollment-payment">
              <CreditCard className="size-4" />
              Pay Enrollment Fee{admission.enrollment_fee_amount ? ` — ৳${admission.enrollment_fee_amount}` : ""}
            </a>
          </Button>
        </div>
      )}
      {enrollmentSubmitted && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
          <Clock className="size-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Enrollment Fee — Under Verification</p>
            <p className="text-xs text-blue-700 mt-0.5">Your proof has been submitted and is being reviewed.</p>
          </div>
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
      <div className={`grid gap-3 ${isPaid ? "grid-cols-2" : "grid-cols-1"}`}>
        <a
          href="/admission/application"
          className="flex items-center justify-between rounded-xl border bg-background p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText className="size-4 text-indigo-600" />
            </div>
            <span className="text-sm font-medium">My Application</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </a>

        {isPaid && (
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
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Questions? Contact the school office with your application ID:{" "}
        <span className="font-mono font-medium">{admission.username}</span>
      </p>
    </div>
  );
}
