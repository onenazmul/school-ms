"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Printer, ChevronLeft, CheckCircle2, GraduationCap, AlertCircle,
} from "lucide-react";

type PaymentSubmission = {
  method: string;
  transaction_id: string;
  phone_number: string | null;
  amount_sent: number;
  payment_date: string;
  account_holder_name: string | null;
  branch: string | null;
  deposit_slip_no: string | null;
  verified_at: string | null;
  verified_by: string | null;
  receipt_number: string | null;
};

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

  father_name_en: string | null;
  guardian_name: string | null;
  guardian_mobile_no: string | null;

  application_fee: string;
  payment_status: string;
  payment_tracking_id: string | null;
  username: string;
  created_at: string;
  updated_at: string;

  payment_submission: PaymentSubmission | null;
};

type SchoolInfo = { name: string; phone: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtMethod(m: string) {
  if (m === "bkash") return "bKash";
  if (m === "rocket") return "Rocket";
  return "Bank Transfer";
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 text-sm text-muted-foreground pr-4 w-40 align-top">{label}</td>
      <td className="py-2 text-sm font-medium text-right">{value || "—"}</td>
    </tr>
  );
}

export default function ReceiptPage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [school, setSchool]       = useState<SchoolInfo>({ name: "", phone: "" });
  const [fetching, setFetching]   = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    Promise.all([
      fetch("/api/v1/admissions/me")
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).message ?? "Could not load receipt");
          return r.json() as Promise<{ admission: Admission }>;
        }),
      fetch("/api/v1/settings")
        .then((r) => r.json())
        .catch(() => ({ name: "", phone: "" })),
    ])
      .then(([admissionData, schoolData]) => {
        setAdmission(admissionData.admission);
        setSchool({ name: schoolData.name ?? "", phone: schoolData.phone ?? "" });
      })
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

  if (!admission || admission.payment_status !== "Paid") {
    const submitted = admission?.payment_status === "Payment Submitted";
    return (
      <div className="space-y-4 pt-2">
        <h1 className="text-xl font-semibold print:hidden">Payment Receipt</h1>
        <div className="rounded-xl border bg-background p-8 text-center space-y-4">
          <AlertCircle className={`size-8 mx-auto ${submitted ? "text-blue-500" : "text-amber-500"}`} />
          <div>
            <h2 className="font-semibold">
              {submitted ? "Payment Under Verification" : "Receipt Not Available"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {submitted
                ? "Your payment proof has been submitted and is being reviewed. The receipt will be available once verified by the school."
                : "A receipt will be available here after the application fee has been verified by the school."}
            </p>
          </div>
          {!submitted && (
            <Button asChild variant="outline">
              <a href="/admission/application/payment">Submit Payment Proof</a>
            </Button>
          )}
          <Button asChild variant="ghost">
            <a href="/admission/application">← Back to Application</a>
          </Button>
        </div>
      </div>
    );
  }

  const ps = admission.payment_submission;
  const applicationFee = Number(admission.application_fee) || 0;
  const amountPaid     = ps ? ps.amount_sent : applicationFee;
  const guardianName   = admission.guardian_name ?? admission.father_name_en ?? "—";
  const address        = [admission.present_village, admission.present_upazilla, admission.present_zilla]
    .filter(Boolean).join(", ");

  const classLabel = [admission.class_name, admission.session_name, admission.division]
    .filter(Boolean).join(" · ");

  const receiptNo = ps?.receipt_number
    ?? (admission.payment_tracking_id ? `RCP-${admission.payment_tracking_id.slice(0, 8).toUpperCase()}` : "—");

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

        {/* ── School header ── */}
        <div className="bg-indigo-600 text-white px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="size-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{school.name || "School"}</h1>
              {school.phone && (
                <p className="text-indigo-200 text-xs mt-0.5">{school.phone}</p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm tracking-wide">PAYMENT RECEIPT</p>
            <p className="text-indigo-200 text-xs mt-0.5 font-mono">Receipt No: {receiptNo}</p>
            <p className="text-indigo-200 text-xs font-mono">
              Date: {fmtDate(ps?.verified_at ?? admission.updated_at)}
            </p>
          </div>
        </div>

        {/* ── Verified strip ── */}
        <div className="bg-green-50 border-b border-green-100 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Application Fee Receipt — Payment Verified</span>
          </div>
          {ps?.verified_at && (
            <span className="text-xs text-green-700">Verified {fmtDate(ps.verified_at)}</span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">

          {/* RECEIVED FROM */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Received From
            </p>
            <table className="w-full">
              <tbody>
                <Row label="Name"           value={admission.name_en} />
                {admission.name_bn && <Row label="নাম (বাংলা)" value={admission.name_bn} />}
                <Row label="Application ID" value={admission.username} />
                <Row label="Class Applied"  value={classLabel} />
                <Row label="Gender"         value={admission.gender} />
                <Row label="Date of Birth"  value={admission.dob} />
                {address && <Row label="Address"      value={address} />}
                <Row label="Guardian"       value={guardianName} />
                {admission.guardian_mobile_no && (
                  <Row label="Guardian Mobile" value={admission.guardian_mobile_no} />
                )}
              </tbody>
            </table>
          </div>

          {/* PAYMENT DETAILS */}
          {ps && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Payment Details
              </p>
              <div className="rounded-xl border overflow-hidden">
                {/* table header */}
                <div className="bg-indigo-600 px-4 py-2.5 grid grid-cols-3 gap-2">
                  <span className="text-xs font-semibold text-white">Method</span>
                  <span className="text-xs font-semibold text-white">Reference</span>
                  <span className="text-xs font-semibold text-white text-right">Amount</span>
                </div>
                {/* table row */}
                <div className="px-4 py-3 grid grid-cols-3 gap-2 bg-indigo-50/50">
                  <span className="text-sm font-medium">{fmtMethod(ps.method)}</span>
                  <span className="text-sm font-mono text-muted-foreground break-all">
                    {ps.method === "bank_transfer"
                      ? (ps.deposit_slip_no || ps.account_holder_name || "—")
                      : (ps.transaction_id || "—")}
                  </span>
                  <span className="text-sm font-bold text-green-700 text-right">৳{ps.amount_sent.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Extra fields */}
              <table className="w-full mt-3">
                <tbody>
                  {ps.method !== "bank_transfer" && ps.phone_number && (
                    <Row label="Phone Used"   value={ps.phone_number} />
                  )}
                  {ps.method === "bank_transfer" && ps.account_holder_name && (
                    <Row label="Account Holder" value={ps.account_holder_name} />
                  )}
                  {ps.method === "bank_transfer" && ps.branch && (
                    <Row label="Branch"        value={ps.branch} />
                  )}
                  <Row label="Payment Date"   value={fmtDate(ps.payment_date)} />
                  {ps.verified_by && (
                    <Row label="Verified By"  value={ps.verified_by} />
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* FEE SUMMARY */}
          <div className="rounded-xl bg-muted/50 border p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Fee Summary
            </p>
            <div className="flex justify-between items-center py-1.5 text-sm border-b">
              <span className="text-muted-foreground">Fee Type</span>
              <span className="font-medium">Admission Application Fee</span>
            </div>
            <div className="flex justify-between items-center py-1.5 text-sm border-b">
              <span className="text-muted-foreground">Total Fee</span>
              <span className="font-medium">৳{applicationFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 text-sm border-b">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold text-green-700">৳{amountPaid.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 mt-1">
              <span className="font-semibold">Balance Due</span>
              <span className={`font-bold text-lg ${Math.max(0, applicationFee - amountPaid) > 0 ? "text-red-700" : "text-green-700"}`}>
                ৳{Math.max(0, applicationFee - amountPaid).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Verification + signature */}
          <div className="flex items-end justify-between gap-4">
            <div className="text-xs text-muted-foreground space-y-0.5">
              {ps?.verified_by && <p>Verified By: {ps.verified_by}</p>}
              {ps?.verified_at && <p>Verified On: {fmtDate(ps.verified_at)}</p>}
              <p>Application Submitted: {fmtDate(admission.created_at)}</p>
            </div>
            <div className="text-center w-32">
              <div className="border-b border-gray-400 mb-1.5 h-6" />
              <p className="text-[10px] text-muted-foreground">Authorized Signatory</p>
            </div>
          </div>

          {/* Notice */}
          <div className="border-t pt-3">
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              This receipt is computer-generated and valid without a physical signature.
              {school.name && ` · ${school.name}`}
              {school.phone && ` · ${school.phone}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
