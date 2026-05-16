"use client";
// app/(admin)/admin/admissions/[id]/page.tsx

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, User, MapPin, Users, FileCheck,
  CreditCard, MessageSquare, Clock, BarChart3,
  GraduationCap, Pencil, RefreshCw, UserCheck, XCircle, Lock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Admission = {
  id: number;
  name_en: string;
  name_bn: string | null;
  name_ar: string | null;
  dob: string | null;
  birth_certificate_no: string | null;
  gender: string;
  height: string | null;
  weight: string | null;
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
  father_education: string | null;
  father_occupation: string | null;
  father_monthly_earning: string | null;
  father_mobile_no: string | null;
  father_nid_no: string | null;
  father_dob: string | null;
  mother_name_en: string | null;
  mother_name_bn: string | null;
  mother_education: string | null;
  mother_occupation: string | null;
  mother_monthly_earning: string | null;
  mother_mobile_no: string | null;
  mother_nid_no: string | null;
  mother_dob: string | null;
  guardian_name: string | null;
  guardian_student_relation: string | null;
  guardian_present_address: string | null;
  guardian_permanent_address: string | null;
  guardian_education: string | null;
  guardian_occupation: string | null;
  guardian_monthly_earning: string | null;
  guardian_mobile_no: string | null;
  guardian_nid_no: string | null;
  guardian_dob: string | null;
  class_name: string;
  section: string | null;
  session_name: string | null;
  division: string | null;
  previous_institute_name: string | null;
  sibling_details: string | null;
  student_photo: string | null;
  student_signature: string | null;
  status: string;
  payment_status: string;
  application_fee: string;
  payment_tracking_id: string | null;
  enrollment_payment_status: string;
  enrollment_payment_tracking_id: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
  mark: {
    written_marks: number | null;
    viva_marks: number | null;
    total_marks: number | null;
    entered_by: string | null;
    entered_at: string;
  } | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_STATUSES     = ["Pending", "Under Review", "Awaiting Test", "Approved", "Enrolled", "Rejected"];
const PAYMENT_STATUSES = ["Unpaid", "Payment Submitted", "Paid", "Fake Payment Proof"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function resolvePhotoUrl(p: string | null): string | null {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `/api/v1/uploads/${p}`;
}

function appStatusBadge(status: string) {
  switch (status) {
    case "Enrolled":      return "bg-green-50 text-green-700 border-green-200";
    case "Approved":      return "bg-teal-50 text-teal-700 border-teal-200";
    case "Under Review":  return "bg-amber-50 text-amber-700 border-amber-200";
    case "Awaiting Test": return "bg-purple-50 text-purple-700 border-purple-200";
    case "Rejected":      return "bg-red-50 text-red-700 border-red-200";
    default:              return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case "Paid":               return "bg-green-50 text-green-700 border-green-200";
    case "Payment Submitted":  return "bg-blue-50 text-blue-700 border-blue-200";
    case "Fake Payment Proof": return "bg-red-50 text-red-700 border-red-200";
    default:                   return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-muted-foreground shrink-0 pr-3">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-6 pb-2 border-b mb-1">
      <Icon className="size-4 text-indigo-600 shrink-0" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function DocumentItem({ label, value }: { label: string; value: string | null }) {
  const resolved = resolvePhotoUrl(value);
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {resolved ? (
        <a href={resolved} target="_blank" rel="noopener noreferrer"
          className="text-indigo-600 text-xs underline underline-offset-2">View</a>
      ) : (
        <span className="text-xs text-muted-foreground italic">Not uploaded</span>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<{ admission: Admission }>({
    queryKey: ["admin-admission", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/admissions/${id}`);
      if (!res.ok) throw new Error("Failed to load admission");
      return res.json();
    },
    staleTime: 30_000,
  });

  const admission = data?.admission;

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editMode, setEditMode]       = useState(false);
  const [editAppStatus, setAppStatus] = useState("");
  const [editPayStatus, setPayStatus] = useState("");
  const [saving, setSaving]           = useState(false);

  // ── Marks ─────────────────────────────────────────────────────────────────
  const [writtenMarks, setWrittenMarks] = useState("");
  const [vivaMarks, setVivaMarks]       = useState("");
  const [savingMarks, setSavingMarks]   = useState(false);

  // ── Notes ─────────────────────────────────────────────────────────────────
  const [note, setNote]           = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // ── Dialogs ───────────────────────────────────────────────────────────────
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen]   = useState(false);
  const [rejectNote, setRejectNote]   = useState("");

  useEffect(() => {
    if (admission) {
      setAppStatus(admission.status);
      setPayStatus(admission.payment_status);
      setWrittenMarks(admission.mark?.written_marks != null ? String(admission.mark.written_marks) : "");
      setVivaMarks(admission.mark?.viva_marks != null ? String(admission.mark.viva_marks) : "");
    }
  }, [admission]);

  const approveToStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/admin/admissions/${id}/enroll`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? "Failed");
      }
      return res.json();
    },
    onSuccess: (d) => {
      toast.success((d as any).message ?? "Admission approved and student account created");
      qc.invalidateQueries({ queryKey: ["admin-admission", id] });
      setApproveOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve");
      setApproveOpen(false);
    },
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editAppStatus, payment_status: editPayStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Application updated");
      qc.invalidateQueries({ queryKey: ["admin-admission", id] });
      setEditMode(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMarks() {
    setSavingMarks(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${id}/marks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          written_marks: writtenMarks !== "" ? Number(writtenMarks) : null,
          viva_marks:    vivaMarks    !== "" ? Number(vivaMarks)    : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marks saved");
      qc.invalidateQueries({ queryKey: ["admin-admission", id] });
    } catch {
      toast.error("Failed to save marks");
    } finally {
      setSavingMarks(false);
    }
  }

  async function handleSaveNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_note: note }),
      });
      if (!res.ok) throw new Error();
      toast.success("Note saved");
      setNote("");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleReject() {
    try {
      const res = await fetch(`/api/v1/admin/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", admin_note: rejectNote || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Application rejected");
      qc.invalidateQueries({ queryKey: ["admin-admission", id] });
      setRejectOpen(false);
      setRejectNote("");
    } catch {
      toast.error("Failed to reject application");
    }
  }

  if (isLoading) return <PageSkeleton />;

  if (isError || !admission) {
    return (
      <div className="space-y-4">
        <Link href="/admin/admissions" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Admissions
        </Link>
        <div className="border rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Failed to load admission.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const photoUrl = resolvePhotoUrl(admission.student_photo);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/admissions"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back to Admissions
        </Link>
        <div className="flex gap-2">
          {admission.status === "Approved" || admission.status === "Enrolled" ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2.5 py-1.5">
              <Lock className="size-3.5" />
              {admission.status === "Enrolled" ? "Enrolled — locked" : "Approved — locked"}
            </div>
          ) : editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditMode(true)}>
              <Pencil className="size-3.5" /> Edit Status
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-14 shrink-0">
          {photoUrl && <AvatarImage src={photoUrl} alt={admission.name_en} />}
          <AvatarFallback className="text-lg font-semibold bg-indigo-50 text-indigo-700">
            {initials(admission.name_en)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{admission.name_en}</h1>
          {admission.name_bn && (
            <p className="text-sm text-muted-foreground">{admission.name_bn}</p>
          )}
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {admission.username ?? `#${admission.id}`}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {editMode ? (
              <>
                <Select value={editAppStatus} onValueChange={setAppStatus}>
                  <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APP_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={editPayStatus} onValueChange={setPayStatus}>
                  <SelectTrigger className="h-7 text-xs w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Badge variant="outline" className={cn("text-xs", appStatusBadge(admission.status))}>
                  {admission.status}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", paymentStatusBadge(admission.payment_status))}>
                  {admission.payment_status}
                </Badge>
                {admission.division && (
                  <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                    {admission.division}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      {!editMode && admission.status !== "Enrolled" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setApproveOpen(true)}
            >
              <UserCheck className="size-3.5" /> Approve to Student
            </Button>
            {admission.status !== "Rejected" && (
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="size-3.5" /> Reject
              </Button>
            )}
          </div>
          {admission.status === "Approved" && admission.enrollment_payment_status !== "Paid" && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Lock className="size-3" />
              {admission.enrollment_payment_status === "Payment Submitted"
                ? "Enrollment fee submitted — verify payment before enrolling."
                : "Enrollment fee not yet paid. The enroll action will be blocked by the server if fee is required."}
            </p>
          )}
        </div>
      )}

      {/* Student Information */}
      <div>
        <SectionHeading icon={User} title="Student Information" />
        <InfoRow label="Name (EN)"           value={admission.name_en} />
        <InfoRow label="Name (BN)"           value={admission.name_bn} />
        <InfoRow label="Name (AR)"           value={admission.name_ar} />
        <InfoRow label="Class Applied"       value={admission.class_name} />
        <InfoRow label="Section"             value={admission.section} />
        <InfoRow label="Session"             value={admission.session_name} />
        <InfoRow label="Division"            value={admission.division} />
        <InfoRow label="Gender"              value={admission.gender} />
        <InfoRow label="Date of Birth"       value={fmtDate(admission.dob)} />
        <InfoRow label="Blood Group"         value={admission.blood_group} />
        <InfoRow label="Nationality"         value={admission.nationality} />
        <InfoRow label="Height"              value={admission.height} />
        <InfoRow label="Weight"              value={admission.weight} />
        <InfoRow label="Identify Sign"       value={admission.identify_sign} />
        <InfoRow label="Birth Certificate"   value={admission.birth_certificate_no} />
        <InfoRow label="Previous Institute"  value={admission.previous_institute_name} />
        <InfoRow label="Sibling Details"     value={admission.sibling_details} />
      </div>

      {/* Present Address */}
      <div>
        <SectionHeading icon={MapPin} title="Present Address" />
        <InfoRow label="Village"   value={admission.present_village} />
        <InfoRow label="Post"      value={admission.present_post} />
        <InfoRow label="Post Code" value={admission.present_post_code} />
        <InfoRow label="Upazilla"  value={admission.present_upazilla} />
        <InfoRow label="Zilla"     value={admission.present_zilla} />
      </div>

      {/* Permanent Address */}
      <div>
        <SectionHeading icon={MapPin} title="Permanent Address" />
        <InfoRow label="Village"   value={admission.permanent_village} />
        <InfoRow label="Post"      value={admission.permanent_post} />
        <InfoRow label="Post Code" value={admission.permanent_post_code} />
        <InfoRow label="Upazilla"  value={admission.permanent_upazilla} />
        <InfoRow label="Zilla"     value={admission.permanent_zilla} />
      </div>

      {/* Father */}
      <div>
        <SectionHeading icon={Users} title="Father's Information" />
        <InfoRow label="Name (EN)"        value={admission.father_name_en} />
        <InfoRow label="Name (BN)"        value={admission.father_name_bn} />
        <InfoRow label="Education"        value={admission.father_education} />
        <InfoRow label="Occupation"       value={admission.father_occupation} />
        <InfoRow label="Monthly Earning"  value={admission.father_monthly_earning ? `৳ ${admission.father_monthly_earning}` : null} />
        <InfoRow label="Mobile No."       value={admission.father_mobile_no} />
        <InfoRow label="NID No."          value={admission.father_nid_no} />
        <InfoRow label="Date of Birth"    value={fmtDate(admission.father_dob)} />
      </div>

      {/* Mother */}
      <div>
        <SectionHeading icon={Users} title="Mother's Information" />
        <InfoRow label="Name (EN)"        value={admission.mother_name_en} />
        <InfoRow label="Name (BN)"        value={admission.mother_name_bn} />
        <InfoRow label="Education"        value={admission.mother_education} />
        <InfoRow label="Occupation"       value={admission.mother_occupation} />
        <InfoRow label="Monthly Earning"  value={admission.mother_monthly_earning ? `৳ ${admission.mother_monthly_earning}` : null} />
        <InfoRow label="Mobile No."       value={admission.mother_mobile_no} />
        <InfoRow label="NID No."          value={admission.mother_nid_no} />
        <InfoRow label="Date of Birth"    value={fmtDate(admission.mother_dob)} />
      </div>

      {/* Guardian */}
      <div>
        <SectionHeading icon={Users} title="Guardian's Information" />
        <InfoRow label="Name"             value={admission.guardian_name} />
        <InfoRow label="Relation"         value={admission.guardian_student_relation} />
        <InfoRow label="Mobile No."       value={admission.guardian_mobile_no} />
        <InfoRow label="NID No."          value={admission.guardian_nid_no} />
        <InfoRow label="Education"        value={admission.guardian_education} />
        <InfoRow label="Occupation"       value={admission.guardian_occupation} />
        <InfoRow label="Monthly Earning"  value={admission.guardian_monthly_earning ? `৳ ${admission.guardian_monthly_earning}` : null} />
        <InfoRow label="Date of Birth"    value={fmtDate(admission.guardian_dob)} />
        <InfoRow label="Present Address"  value={admission.guardian_present_address} />
        <InfoRow label="Permanent Address" value={admission.guardian_permanent_address} />
      </div>

      {/* Documents */}
      <div>
        <SectionHeading icon={FileCheck} title="Documents" />
        <DocumentItem label="Student Photo"     value={admission.student_photo} />
        <DocumentItem label="Student Signature" value={admission.student_signature} />
      </div>

      {/* Marks */}
      <div>
        <SectionHeading icon={BarChart3} title="Admission Test Marks" />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs mb-1 block">Written Marks</Label>
            <Input
              type="number" min="0" placeholder="—"
              className="h-8 text-sm"
              value={writtenMarks}
              onChange={(e) => setWrittenMarks(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Viva Marks</Label>
            <Input
              type="number" min="0" placeholder="—"
              className="h-8 text-sm"
              value={vivaMarks}
              onChange={(e) => setVivaMarks(e.target.value)}
            />
          </div>
        </div>
        {(writtenMarks !== "" || vivaMarks !== "") && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Total: {(Number(writtenMarks || 0) + Number(vivaMarks || 0)).toFixed(0)}
          </p>
        )}
        {admission.mark?.entered_by && (
          <p className="text-xs text-muted-foreground mt-1">
            Last entered by {admission.mark.entered_by} on {fmtDate(admission.mark.entered_at)}
          </p>
        )}
        <Button
          size="sm" variant="outline" className="h-7 text-xs mt-2"
          disabled={savingMarks || (writtenMarks === "" && vivaMarks === "")}
          onClick={handleSaveMarks}
        >
          {savingMarks ? "Saving…" : "Save Marks"}
        </Button>
      </div>

      {/* Fee & Payment */}
      <div>
        <SectionHeading icon={CreditCard} title="Fee & Payment" />
        <InfoRow label="Application Fee"         value={`৳ ${admission.application_fee}`} />
        <InfoRow label="App Payment Status"      value={admission.payment_status} />
        <InfoRow label="App Tracking ID"         value={admission.payment_tracking_id} />
        <div className="pt-2 mt-2 border-t border-dashed">
          <InfoRow
            label="Enrollment Payment"
            value={admission.enrollment_payment_status}
          />
          {admission.enrollment_payment_tracking_id && (
            <InfoRow label="Enrollment Tracking ID" value={admission.enrollment_payment_tracking_id} />
          )}
        </div>
      </div>

      {/* Account */}
      {admission.username && (
        <div>
          <SectionHeading icon={GraduationCap} title="Applicant Account" />
          <InfoRow label="Username" value={admission.username} />
        </div>
      )}

      {/* Internal Notes */}
      <div>
        <SectionHeading icon={MessageSquare} title="Internal Notes" />
        <Textarea
          placeholder="Add internal notes (not visible to applicants)…"
          className="text-sm min-h-20 resize-none mt-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          size="sm" variant="outline" className="mt-2 h-7 text-xs"
          disabled={!note.trim() || savingNote}
          onClick={handleSaveNote}
        >
          {savingNote ? "Saving…" : "Save Note"}
        </Button>
      </div>

      {/* Activity Log */}
      <div>
        <SectionHeading icon={Clock} title="Activity Log" />
        <div className="space-y-2 mt-2">
          {[
            { text: "Application submitted", date: fmtDate(admission.created_at) },
            ...(admission.status !== "Pending"
              ? [{ text: `App status: ${admission.status}`, date: fmtDate(admission.updated_at) }]
              : []),
            ...(admission.payment_status !== "Unpaid"
              ? [{ text: `Payment: ${admission.payment_status}`, date: fmtDate(admission.updated_at) }]
              : []),
          ].map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="size-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Application ID: #{admission.id} · Submitted: {fmtDate(admission.created_at)} · Last updated: {fmtDate(admission.updated_at)}
        </p>
      </div>

      {/* Approve dialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Admission to Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a student account for <strong>{admission.name_en}</strong> and
              mark them as enrolled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              disabled={approveToStudentMutation.isPending}
              onClick={() => approveToStudentMutation.mutate()}
            >
              {approveToStudentMutation.isPending ? "Approving…" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="size-4" /> Reject Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              Reject the application for <strong>{admission.name_en}</strong>?
              The applicant will not be admitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-1">
            <Label className="text-sm mb-1.5 block">Admin note (optional)</Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Reason for rejection…"
              className="resize-none min-h-20 text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleReject}
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
