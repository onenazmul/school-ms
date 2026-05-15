"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, CreditCard, Pencil, Printer,
  GraduationCap, AlertCircle, RefreshCw, MapPin, Users, BookOpen,
  CalendarDays, BarChart3, AlertTriangle, XCircle, CheckCheck,
} from "lucide-react";

type Marks = {
  written_marks: number | null;
  viva_marks: number | null;
  total_marks: number | null;
};

type Admission = {
  id: number;
  name_en: string;
  name_bn: string | null;
  name_ar: string | null;
  dob: string;
  birth_certificate_no: string | null;
  gender: string;
  height: string | null;
  weight: string | null;
  age: string | null;
  nationality: string | null;
  blood_group: string | null;
  identify_sign: string | null;

  present_village: string | null;
  present_post: string | null;
  present_upazilla: string | null;
  present_post_code: string | null;
  present_zilla: string | null;

  permanent_village: string | null;
  permanent_post: string | null;
  permanent_upazilla: string | null;
  permanent_zilla: string | null;
  permanent_post_code: string | null;

  father_name_en: string | null;
  father_name_bn: string | null;
  father_occupation: string | null;
  father_mobile_no: string | null;

  mother_name_en: string | null;
  mother_name_bn: string | null;
  mother_mobile_no: string | null;

  guardian_name: string | null;
  guardian_student_relation: string | null;
  guardian_mobile_no: string | null;
  guardian_occupation: string | null;

  class_name: string;
  session_name: string | null;
  division: string | null;
  previous_institute_name: string | null;

  status: string;
  payment_status: string;
  application_fee: string;
  payment_tracking_id: string | null;
  username: string;
  created_at: string;

  test_day: string | null;
  test_type: string | null;
  result_day: string | null;
  result_visible: boolean;
  marks: Marks | null;
};

// Info is editable only when both statuses are in initial state
function isInfoEditable(a: Admission) {
  return a.payment_status === "Unpaid" && a.status === "Pending";
}

function isPaymentPending(a: Admission) {
  return a.payment_status === "Unpaid";
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBanner({ admission }: { admission: Admission }) {
  const { status, payment_status } = admission;

  if (status === "Enrolled") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
        <CheckCheck className="size-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Congratulations — Admitted!</p>
          <p className="text-xs text-green-700 mt-0.5">Your admission has been approved. Welcome to the school.</p>
        </div>
      </div>
    );
  }

  if (status === "Rejected") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
        <XCircle className="size-5 text-red-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">Application Not Selected</p>
          <p className="text-xs text-red-700 mt-0.5">Unfortunately, your application was not selected this cycle.</p>
        </div>
      </div>
    );
  }

  if (status === "Approved") {
    return (
      <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 flex items-center gap-3">
        <CheckCircle2 className="size-5 text-teal-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-teal-800">Application Approved</p>
          <p className="text-xs text-teal-700 mt-0.5">Your application has been approved. Further instructions will be communicated soon.</p>
        </div>
      </div>
    );
  }

  if (status === "Awaiting Test") {
    return (
      <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 flex items-center gap-3">
        <CalendarDays className="size-5 text-purple-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-purple-800">Payment Verified — Awaiting Admission Test</p>
          <p className="text-xs text-purple-700 mt-0.5">
            {admission.test_day
              ? `Your test is scheduled for ${fmtDateTime(admission.test_day)}${admission.test_type ? ` (${admission.test_type})` : ""}.`
              : "Test date will be announced soon. Please check back."}
          </p>
        </div>
      </div>
    );
  }

  if (payment_status === "Fake Payment Proof" || payment_status === "Unpaid" && status === "Under Review") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
        <AlertTriangle className="size-5 text-red-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">Payment Could Not Be Verified</p>
          <p className="text-xs text-red-700 mt-0.5">Please resubmit a valid payment proof below.</p>
        </div>
      </div>
    );
  }

  if (payment_status === "Payment Submitted") {
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
        <Clock className="size-5 text-blue-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Payment Under Review</p>
          <p className="text-xs text-blue-700 mt-0.5">We received your payment proof and are reviewing it.</p>
        </div>
      </div>
    );
  }

  if (payment_status === "Paid" && status === "Under Review") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
        <CheckCircle2 className="size-5 text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Payment Verified — Application Under Review</p>
          <p className="text-xs text-amber-700 mt-0.5">
            {admission.result_day
              ? `Results will be announced on ${fmtDateTime(admission.result_day)}.`
              : "We will notify you once a decision is made."}
          </p>
        </div>
      </div>
    );
  }

  // Default: Pending / Unpaid
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
      <Clock className="size-5 text-amber-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Payment Required</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Pay ৳{Number(admission.application_fee) || 100} to complete your application.
          <span className="block mt-0.5 font-semibold">Double-check your information before paying — you cannot edit after submitting payment.</span>
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right ml-4">{value || "—"}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="size-4 text-indigo-600" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
    </div>
  );
}

export default function ApplicationPage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;
  const router = useRouter();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    setFetching(true);
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
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
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

  const editable       = isInfoEditable(admission);
  const needsPay       = isPaymentPending(admission);
  const applicationFee = Number(admission.application_fee) || 0;
  const isVerifiedPaid = admission.payment_status === "Paid";

  const presentAddress = [
    admission.present_village, admission.present_post,
    admission.present_upazilla, admission.present_zilla, admission.present_post_code,
  ].filter(Boolean).join(", ");

  const permanentAddress = [
    admission.permanent_village, admission.permanent_post,
    admission.permanent_upazilla, admission.permanent_zilla, admission.permanent_post_code,
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Application</h1>
        <div className="flex gap-1.5">
          <Badge variant="outline" className="text-xs">
            {admission.status}
          </Badge>
          {admission.payment_status !== "Unpaid" && (
            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
              {admission.payment_status}
            </Badge>
          )}
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner admission={admission} />

      {/* Marks / Result card */}
      {admission.marks && admission.result_visible && (
        <div className="rounded-xl border bg-background p-4">
          <SectionHeader icon={BarChart3} title="Admission Test Result" />
          <div className="grid grid-cols-3 gap-4 text-center">
            {admission.marks.written_marks != null && (
              <div>
                <p className="text-xs text-muted-foreground">Written</p>
                <p className="text-lg font-bold">{admission.marks.written_marks}</p>
              </div>
            )}
            {admission.marks.viva_marks != null && (
              <div>
                <p className="text-xs text-muted-foreground">Viva</p>
                <p className="text-lg font-bold">{admission.marks.viva_marks}</p>
              </div>
            )}
            {admission.marks.total_marks != null && (
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-indigo-700">{admission.marks.total_marks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test day card (shown if test is set and not yet resulted) */}
      {admission.test_day && !["Enrolled", "Rejected", "Approved"].includes(admission.status) && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <SectionHeader icon={CalendarDays} title="Admission Test Information" />
          <p className="text-sm font-medium">{fmtDateTime(admission.test_day)}</p>
          {admission.test_type && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Type: {admission.test_type === "both" ? "Written + Viva" : admission.test_type.charAt(0).toUpperCase() + admission.test_type.slice(1)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Please arrive 15 minutes early with your admit card.</p>
        </div>
      )}

      {/* Student details */}
      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={GraduationCap} title="Student Details" />
        <InfoRow label="Name (English)"       value={admission.name_en} />
        <InfoRow label="Name (Bengali)"        value={admission.name_bn} />
        <InfoRow label="Name (Arabic)"         value={admission.name_ar} />
        <InfoRow label="Date of Birth"         value={admission.dob} />
        <InfoRow label="Birth Certificate No"  value={admission.birth_certificate_no} />
        <InfoRow label="Gender"                value={admission.gender} />
        <InfoRow label="Age"                   value={admission.age} />
        <InfoRow label="Nationality"           value={admission.nationality} />
        <InfoRow label="Blood Group"           value={admission.blood_group} />
        <InfoRow label="Height"                value={admission.height} />
        <InfoRow label="Weight"                value={admission.weight} />
        <InfoRow label="Identify Sign"         value={admission.identify_sign} />
        <InfoRow label="Application ID"        value={admission.username} />
      </div>

      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={BookOpen} title="Academic Details" />
        <InfoRow label="Applied Class"         value={admission.class_name} />
        <InfoRow label="Session"               value={admission.session_name} />
        <InfoRow label="Division"              value={admission.division} />
        <InfoRow label="Previous Institute"    value={admission.previous_institute_name} />
      </div>

      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={MapPin} title="Address" />
        <InfoRow label="Present Address"   value={presentAddress || "—"} />
        <InfoRow label="Permanent Address" value={permanentAddress || "—"} />
      </div>

      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={Users} title="Guardian / Family" />
        <InfoRow label="Father (English)"    value={admission.father_name_en} />
        <InfoRow label="Father (Bengali)"    value={admission.father_name_bn} />
        <InfoRow label="Father Mobile"       value={admission.father_mobile_no} />
        <InfoRow label="Father Occupation"   value={admission.father_occupation} />
        <InfoRow label="Mother (English)"    value={admission.mother_name_en} />
        <InfoRow label="Mother (Bengali)"    value={admission.mother_name_bn} />
        <InfoRow label="Mother Mobile"       value={admission.mother_mobile_no} />
        <InfoRow label="Guardian Name"       value={admission.guardian_name} />
        <InfoRow label="Relation"            value={admission.guardian_student_relation} />
        <InfoRow label="Guardian Mobile"     value={admission.guardian_mobile_no} />
        <InfoRow label="Guardian Occupation" value={admission.guardian_occupation} />
      </div>

      {/* Actions */}
      <div className="space-y-2.5 print:hidden">
        {needsPay && applicationFee > 0 && (
          <>
            <Button
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold"
              onClick={() => router.push("/admission/application/payment")}
            >
              <CreditCard className="size-5" />
              Pay Application Fee — ৳{applicationFee}
            </Button>
            {editable && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href="/admission/application/edit">
                  <Pencil className="size-4" />Edit Application
                </a>
              </Button>
            )}
          </>
        )}
        {isVerifiedPaid && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/admission/application/receipt">View / Print Receipt</a>
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full gap-2 text-muted-foreground"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />Print Application
        </Button>
      </div>
    </div>
  );
}
