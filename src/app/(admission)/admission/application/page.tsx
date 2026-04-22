"use client";
// app/(admission)/admission/application/page.tsx

import { useEffect, useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, CreditCard, Pencil, Printer,
  GraduationCap, AlertCircle, RefreshCw,
} from "lucide-react";

type Admission = {
  id: number;
  name: string;
  class_name: string;
  gender: string;
  dob: string;
  stay_type: string;
  father_name: string;
  mother_name: string;
  guardian_name: string;
  guardian_occupation: string | null;
  guardian_phone: string;
  guardian_email: string | null;
  upozilla: string;
  union_pourosova: string;
  ward: string;
  village_moholla: string;
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

function statusColor(s: string) {
  if (s === "Approved") return "bg-green-50 text-green-700 border-green-200";
  if (s === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function statusLabel(s: string) {
  if (s === "Approved") return "Approved";
  if (s === "Rejected") return "Rejected";
  return "Under Review";
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right ml-4">{value || "—"}</span>
    </div>
  );
}

export default function ApplicationPage() {
  const { session, loading: sessionLoading } = useStudentSession();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [fetching, setFetching]   = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    setFetching(true);
    api
      .get<{ admission: Admission }>(EP.ADMISSION(session.id), session.laravelToken)
      .then((r) => setAdmission(r.admission))
      .catch((err) => toast.error(err.message ?? "Could not load application"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  async function handlePayNow() {
    if (!session || !admission) return;
    setPayLoading(true);
    try {
      const res = await api.post<{ payment_url?: string; message?: string }>(
        EP.ADMISSION_PAYMENT(admission.id),
        { amount: APPLICATION_FEE, admission_id: admission.id },
        session.laravelToken
      );
      if (res.payment_url) {
        window.location.href = res.payment_url;
      } else {
        toast.info(res.message ?? "Online payment coming soon. Please pay at the school office.");
      }
    } catch {
      toast.info("Online payment coming soon. Please pay at the school office.");
    } finally {
      setPayLoading(false);
    }
  }

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center space-y-3 mt-4">
        <AlertCircle className="size-7 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Could not load application data.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="size-3.5 mr-2" />Retry
        </Button>
      </div>
    );
  }

  const paid = isPaid(admission);

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Application</h1>
        <Badge variant="outline" className={statusColor(admission.status)}>
          {statusLabel(admission.status)}
        </Badge>
      </div>

      {/* Payment banner */}
      {paid ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Application Fee Paid</p>
            <p className="text-xs text-green-700 mt-0.5">
              Your application is complete.{" "}
              <a href="/admission/application/receipt" className="underline font-medium">View receipt →</a>
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <Clock className="size-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Payment Pending</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Pay ৳{APPLICATION_FEE} to complete your application.
            </p>
          </div>
        </div>
      )}

      {/* Student details */}
      <div className="rounded-xl border bg-background p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="size-4 text-indigo-600" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student Details</p>
        </div>
        <InfoRow label="Name"           value={admission.name} />
        <InfoRow label="Applied Class"  value={admission.class_name} />
        <InfoRow label="Gender"         value={admission.gender} />
        <InfoRow label="Date of Birth"  value={admission.dob} />
        <InfoRow label="Stay Type"      value={admission.stay_type} />
        <InfoRow label="Application ID" value={admission.username} />
      </div>

      {/* Address */}
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Address</p>
        <InfoRow label="Village/Moholla"  value={admission.village_moholla} />
        <InfoRow label="Ward"             value={admission.ward} />
        <InfoRow label="Union/Pouroshova" value={admission.union_pourosova} />
        <InfoRow label="Upozilla"         value={admission.upozilla} />
      </div>

      {/* Guardian */}
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Guardian / Family</p>
        <InfoRow label="Father"       value={admission.father_name} />
        <InfoRow label="Mother"       value={admission.mother_name} />
        <InfoRow label="Guardian"     value={admission.guardian_name} />
        <InfoRow label="Phone"        value={admission.guardian_phone} />
        <InfoRow label="Email"        value={admission.guardian_email} />
        <InfoRow label="Occupation"   value={admission.guardian_occupation} />
      </div>

      {/* Actions */}
      <div className="space-y-2.5 print:hidden">
        {!paid && (
          <>
            <Button
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold"
              onClick={handlePayNow}
              disabled={payLoading}
            >
              {payLoading ? (
                <><span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</>
              ) : (
                <><CreditCard className="size-5" />Pay Application Fee — ৳{APPLICATION_FEE}</>
              )}
            </Button>
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href="/admission/application/edit">
                <Pencil className="size-4" />Edit Application
              </a>
            </Button>
          </>
        )}
        {paid && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/admission/application/receipt">View / Print Receipt</a>
          </Button>
        )}
        <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => window.print()}>
          <Printer className="size-4" />Print Application
        </Button>
      </div>
    </div>
  );
}
