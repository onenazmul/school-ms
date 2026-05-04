"use client";

import { useEffect, useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Printer, ChevronLeft, CheckCircle2, GraduationCap, AlertCircle,
} from "lucide-react";

const SCHOOL_NAME    = "Markazul Hifz International Cadet Madrasah";
const SCHOOL_ADDRESS = "Sirajganj, Rajshahi, Bangladesh";
const SCHOOL_PHONE   = "01XXXXXXXXX";
const SCHOOL_EMAIL   = "info@school.edu.bd";

type Admission = {
  id: number;
  name_en: string;
  name_bn: string | null;
  dob: string;
  gender: string;
  class_name: string;
  session_name: string | null;
  division: string | null;

  present_village: string | null;
  present_upazilla: string | null;
  present_zilla: string | null;

  guardian_name: string | null;
  guardian_mobile_no: string | null;

  application_fee: string;
  payment_tracking_id: string | null;
  username: string;
  created_at: string;
  updated_at: string;
};

function isPaid(a: Admission) {
  return (
    a.payment_tracking_id !== null &&
    a.payment_tracking_id !== "4" &&
    a.payment_tracking_id !== ""
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 text-sm text-muted-foreground pr-4 align-top">{label}</td>
      <td className="py-2 text-sm font-medium text-right">{value || "—"}</td>
    </tr>
  );
}

export default function ReceiptPage() {
  const { session, loading: sessionLoading } = useStudentSession();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    api
      .get<{ admission: Admission }>(EP.ADMISSION(session.id), session.laravelToken)
      .then((r) => setAdmission(r.admission))
      .catch((err) => toast.error(err.message ?? "Could not load receipt"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!admission || !isPaid(admission)) {
    return (
      <div className="space-y-4 pt-2">
        <h1 className="text-xl font-semibold print:hidden">Payment Receipt</h1>
        <div className="rounded-xl border bg-background p-8 text-center space-y-4">
          <AlertCircle className="size-8 text-amber-500 mx-auto" />
          <div>
            <h2 className="font-semibold">No Receipt Yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A receipt will appear here after the application fee has been verified.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/admission/application/payment">Check Payment Status</a>
          </Button>
          <Button asChild variant="ghost">
            <a href="/admission/application">← Back to Application</a>
          </Button>
        </div>
      </div>
    );
  }

  const address = [
    admission.present_village,
    admission.present_upazilla,
    admission.present_zilla,
  ].filter(Boolean).join(", ");

  const applicationFee = Number(admission.application_fee) || 100;

  return (
    <div className="space-y-4 pt-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <a
          href="/admission/application"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" /> Back
        </a>
        <Button onClick={() => window.print()} size="sm" variant="outline" className="gap-2">
          <Printer className="size-4" />Print Receipt
        </Button>
      </div>

      {/* Receipt */}
      <div className="rounded-2xl border bg-background shadow-sm overflow-hidden print:rounded-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-5 text-center">
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="size-5 text-white" />
          </div>
          <h1 className="font-bold text-lg">{SCHOOL_NAME}</h1>
          <p className="text-indigo-200 text-xs mt-0.5">{SCHOOL_ADDRESS}</p>
          <p className="text-indigo-200 text-xs">{SCHOOL_PHONE} · {SCHOOL_EMAIL}</p>
        </div>

        {/* Title strip */}
        <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Application Fee Receipt</span>
          </div>
          <span className="text-xs text-green-700 font-mono">
            Ref: {admission.payment_tracking_id}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Applicant info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Applicant Information
            </p>
            <table className="w-full">
              <tbody>
                <Row label="Application ID"  value={admission.username} />
                <Row label="Student Name"    value={admission.name_en} />
                {admission.name_bn && <Row label="নাম (বাংলা)" value={admission.name_bn} />}
                <Row label="Applied Class"   value={[admission.class_name, admission.session_name, admission.division].filter(Boolean).join(" · ")} />
                <Row label="Gender"          value={admission.gender} />
                <Row label="Date of Birth"   value={admission.dob} />
                <Row label="Address"         value={address} />
                <Row label="Guardian"        value={admission.guardian_name} />
                <Row label="Guardian Mobile" value={admission.guardian_mobile_no} />
              </tbody>
            </table>
          </div>

          {/* Payment info */}
          <div className="rounded-xl bg-muted/50 border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Payment Details
            </p>
            <table className="w-full">
              <tbody>
                <Row label="Payment Date"  value={fmt(admission.updated_at)} />
                <Row label="Reference ID"  value={admission.payment_tracking_id} />
                <Row label="Payment For"   value="Admission Application Fee" />
              </tbody>
            </table>
            <div className="border-t mt-3 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Total Paid</span>
              <span className="text-lg font-bold text-green-700">৳{applicationFee}.00</span>
            </div>
          </div>

          {/* Stamp */}
          <div className="flex items-center justify-center gap-2 py-2 border rounded-xl bg-green-50 text-green-700">
            <CheckCircle2 className="size-4" />
            <span className="text-sm font-semibold">
              Payment Confirmed — Application Under Review
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Computer-generated receipt. No signature required.
            Application submitted on {fmt(admission.created_at)}.
          </p>
        </div>
      </div>
    </div>
  );
}
