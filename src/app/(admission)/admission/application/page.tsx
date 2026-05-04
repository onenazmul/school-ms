"use client";

import { useEffect, useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, CreditCard, Pencil, Printer,
  GraduationCap, AlertCircle, RefreshCw, MapPin, Users, BookOpen,
} from "lucide-react";

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
  application_fee: string;
  payment_tracking_id: string | null;
  username: string;
  created_at: string;
};

function isPaid(a: Admission) {
  return (
    a.payment_tracking_id !== null &&
    a.payment_tracking_id !== "4" &&
    a.payment_tracking_id !== ""
  );
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
    <div className="flex justify-between text-sm py-1.5 ">
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
  const { session, loading: sessionLoading } = useStudentSession();
  const router = useRouter();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    setFetching(true);
    api
      .get<{ admission: Admission }>(EP.ADMISSION(session.id), session.laravelToken)
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

  const paid = isPaid(admission);
  const applicationFee = Number(admission.application_fee) || 100;

  const presentAddress = [
    admission.present_village,
    admission.present_post,
    admission.present_upazilla,
    admission.present_zilla,
    admission.present_post_code,
  ].filter(Boolean).join(", ");

  const permanentAddress = [
    admission.permanent_village,
    admission.permanent_post,
    admission.permanent_upazilla,
    admission.permanent_zilla,
    admission.permanent_post_code,
  ].filter(Boolean).join(", ");

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
              <a href="/admission/application/receipt" className="underline font-medium">
                View receipt →
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <Clock className="size-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Payment Pending</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Pay ৳{applicationFee} to complete your application.
            </p>
          </div>
        </div>
      )}

      {/* Student details */}
      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={GraduationCap} title="Student Details" />
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Name (English)"      value={admission.name_en} />
          <InfoRow label="Name (Bengali)"       value={admission.name_bn} />
          <InfoRow label="Name (Arabic)"        value={admission.name_ar} />
        </div>
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Date of Birth"        value={admission.dob} />
          <InfoRow label="Birth Certificate No" value={admission.birth_certificate_no} />
        </div>
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Gender"               value={admission.gender} />
          <InfoRow label="Age"                  value={admission.age} />
          
        </div>
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Nationality"          value={admission.nationality} />
          <InfoRow label="Blood Group"          value={admission.blood_group} />
        </div>
        <div className="sm:flex sm:justify-between">
          
          <InfoRow label="Height"               value={admission.height} />
          <InfoRow label="Weight"               value={admission.weight} />
        </div>
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Identify Sign"        value={admission.identify_sign} />
          <InfoRow label="Application ID"       value={admission.username} />
        </div>
      </div>

      {/* Academic */}
      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={BookOpen} title="Academic Details" />
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Applied Class"         value={admission.class_name} />
          <InfoRow label="Session"               value={admission.session_name} />
        </div>
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Division"              value={admission.division} />
          <InfoRow label="Previous Institute"    value={admission.previous_institute_name} />
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={MapPin} title="Address" />
        <InfoRow label="Present Address"   value={presentAddress || "—"} />
        <InfoRow label="Permanent Address" value={permanentAddress || "—"} />
      </div>

      {/* Guardian / Family */}
      <div className="rounded-xl border bg-background p-4">
        <SectionHeader icon={Users} title="Guardian / Family" />
        <div className="sm:flex sm:justify-between">
        <InfoRow label="Father (English)" value={admission.father_name_en} />
        <InfoRow label="Father (Bengali)" value={admission.father_name_bn} />
        </div>
        <div className="sm:flex sm:justify-between">
        <InfoRow label="Father Mobile"    value={admission.father_mobile_no} />
        <InfoRow label="Father Occupation" value={admission.father_occupation} />
        </div>
        
        <div className="sm:flex sm:justify-between">
        <InfoRow label="Mother (English)" value={admission.mother_name_en} />
        <InfoRow label="Mother (Bengali)" value={admission.mother_name_bn} />
        <InfoRow label="Mother Mobile"    value={admission.mother_mobile_no} />
        </div>
        
        <div className="sm:flex sm:justify-between">
        <InfoRow label="Guardian Name"    value={admission.guardian_name} />
        <InfoRow label="Relation"         value={admission.guardian_student_relation} />
        </div>
        
        <div className="sm:flex sm:justify-between">
          <InfoRow label="Guardian Mobile"  value={admission.guardian_mobile_no} />
        <InfoRow label="Guardian Occupation" value={admission.guardian_occupation} />
        </div>
        
      </div>

      {/* Actions */}
      <div className="space-y-2.5 print:hidden">
        {!paid && (
          <>
            <Button
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold"
              onClick={() => router.push("/admission/application/payment")}
            >
              <CreditCard className="size-5" />
              Pay Application Fee — ৳{applicationFee}
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
