"use client";
// app/(admin)/admin/admissions/page.tsx

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── UI ────────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  Search, Filter, Download, MoreVertical, Eye, Pencil,
  X, ChevronLeft, ChevronRight, FileText, AlertTriangle,
  RefreshCw, CheckSquare, ClipboardList,
  MapPin, GraduationCap, User, Users,
  FileCheck, CreditCard, MessageSquare, Clock, SlidersHorizontal,
  UserCheck, XCircle, Columns3, BarChart3,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  father_name_bn: string | null;
  father_name_en: string | null;
  father_education: string | null;
  father_occupation: string | null;
  father_monthly_earning: string | null;
  father_mobile_no: string | null;
  father_nid_no: string | null;
  father_dob: string | null;
  mother_name_bn: string | null;
  mother_name_en: string | null;
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

type AdmissionsResponse = {
  admissions: { data: Admission[]; total: number };
};

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions
// ─────────────────────────────────────────────────────────────────────────────

type ColKey =
  | "username" | "applicant" | "class" | "session" | "division"
  | "guardian_name" | "guardian_phone" | "dob"
  | "submitted" | "payment_status" | "app_status";

type ColDef = { key: ColKey; label: string; defaultVisible: boolean };

const COLUMNS: ColDef[] = [
  { key: "username",       label: "ID",               defaultVisible: true  },
  { key: "applicant",      label: "Applicant",        defaultVisible: true  },
  { key: "class",          label: "Class",            defaultVisible: true  },
  { key: "session",        label: "Session",          defaultVisible: false },
  { key: "division",       label: "Division",         defaultVisible: false },
  { key: "guardian_name",  label: "Guardian",         defaultVisible: false },
  { key: "guardian_phone", label: "Phone",            defaultVisible: true  },
  { key: "dob",            label: "Date of Birth",    defaultVisible: false },
  { key: "submitted",      label: "Submitted",        defaultVisible: true  },
  { key: "payment_status", label: "Payment Status",   defaultVisible: true  },
  { key: "app_status",     label: "App Status",       defaultVisible: true  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];
const APP_STATUSES     = ["Pending", "Under Review", "Awaiting Test", "Approved", "Enrolled", "Rejected"];
const PAYMENT_STATUSES = ["Unpaid", "Payment Submitted", "Paid", "Fake Payment Proof"];
const GENDERS          = ["Male", "Female", "Other"];
const PAGE_SIZES       = [10, 25, 50, 100];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function appStatusBadge(status: string) {
  switch (status) {
    case "Enrolled":       return "bg-green-50 text-green-700 border-green-200";
    case "Approved":       return "bg-teal-50 text-teal-700 border-teal-200";
    case "Under Review":   return "bg-amber-50 text-amber-700 border-amber-200";
    case "Awaiting Test":  return "bg-purple-50 text-purple-700 border-purple-200";
    case "Rejected":       return "bg-red-50 text-red-700 border-red-200";
    default:               return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case "Paid":                return "bg-green-50 text-green-700 border-green-200";
    case "Payment Submitted":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "Fake Payment Proof":  return "bg-red-50 text-red-700 border-red-200";
    default:                    return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function divisionBadgeClass(division: string | null) {
  if (!division) return "bg-slate-50 text-slate-600 border-slate-200";
  if (division.includes("ক্যাডেট") || division.toLowerCase().includes("cadet"))
    return "bg-purple-50 text-purple-700 border-purple-200";
  if (division.includes("অনবাসিক") || division.toLowerCase().includes("non"))
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function buildDuplicateMap(list: Admission[]): Map<number, string> {
  const phoneMap = new Map<string, number[]>();
  list.forEach((a) => {
    if (a.guardian_mobile_no) {
      const k = a.guardian_mobile_no.trim();
      phoneMap.set(k, [...(phoneMap.get(k) ?? []), a.id]);
    }
  });
  const result = new Map<number, string>();
  phoneMap.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        const others = ids.filter((x) => x !== id).map((x) => `#${x}`).join(", ");
        result.set(id, `Same phone as Application ${others}`);
      });
    }
  });
  return result;
}

function resolvePhotoUrl(p: string | null): string | null {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `/api/v1/uploads/${p}`;
}

function exportCSV(list: Admission[]) {
  const headers = [
    "ID", "Name (EN)", "Name (BN)", "Class", "Session", "Division",
    "Gender", "Guardian", "Phone", "Submitted", "App Status", "Payment Status", "Fee",
  ];
  const rows = list.map((a) => [
    a.username ?? a.id,
    a.name_en,
    a.name_bn ?? "",
    a.class_name,
    a.session_name ?? "",
    a.division ?? "",
    a.gender,
    a.guardian_name ?? "",
    a.guardian_mobile_no ?? "",
    fmtDate(a.created_at),
    a.status,
    a.payment_status,
    a.application_fee,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile
// ─────────────────────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-muted-foreground shrink-0 pr-3">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-5 pb-1">
      <Icon className="size-4 text-indigo-600 shrink-0" />
      <h4 className="text-sm font-semibold">{title}</h4>
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

function ActivityItem({ text, date }: { text: string; date: string }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="size-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
      <div>
        <p className="text-sm">{text}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject Dialog
// ─────────────────────────────────────────────────────────────────────────────

function RejectDialog({
  admission,
  open,
  onClose,
  onRejected,
}: {
  admission: Admission | null;
  open: boolean;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setNote(""); }, [open]);

  async function handleReject() {
    if (!admission) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${admission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", admin_note: note || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Application rejected");
      onRejected();
      onClose();
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="size-4" /> Reject Application
          </AlertDialogTitle>
          <AlertDialogDescription>
            Reject the application for <strong>{admission?.name_en}</strong>?
            The applicant will not be admitted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-1">
          <Label className="text-sm mb-1.5 block">Admin note (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection…"
            className="resize-none min-h-20 text-sm"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={saving}
            onClick={handleReject}
          >
            {saving ? "Rejecting…" : "Reject Application"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admission Detail Sheet
// ─────────────────────────────────────────────────────────────────────────────

function AdmissionSheet({
  admission,
  open,
  onClose,
  onUpdated,
  isMobile,
  onApproveToStudent,
  onReject,
}: {
  admission: Admission | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  isMobile: boolean;
  onApproveToStudent: (a: Admission) => void;
  onReject: (a: Admission) => void;
}) {
  const [editMode, setEditMode]   = useState(false);
  const [editAppStatus, setEditAppStatus]     = useState("");
  const [editPayStatus, setEditPayStatus]     = useState("");
  const [note, setNote]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [writtenMarks, setWrittenMarks] = useState("");
  const [vivaMarks, setVivaMarks]       = useState("");
  const [savingMarks, setSavingMarks]   = useState(false);

  useEffect(() => {
    if (admission) {
      setEditMode(false);
      setEditAppStatus(admission.status);
      setEditPayStatus(admission.payment_status);
      setNote("");
      setWrittenMarks(admission.mark?.written_marks != null ? String(admission.mark.written_marks) : "");
      setVivaMarks(admission.mark?.viva_marks != null ? String(admission.mark.viva_marks) : "");
    }
  }, [admission]);

  async function handleSaveMarks() {
    if (!admission) return;
    setSavingMarks(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${admission.id}/marks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          written_marks: writtenMarks !== "" ? Number(writtenMarks) : null,
          viva_marks:    vivaMarks    !== "" ? Number(vivaMarks)    : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marks saved");
      onUpdated();
    } catch {
      toast.error("Failed to save marks");
    } finally {
      setSavingMarks(false);
    }
  }

  async function handleSave() {
    if (!admission) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${admission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editAppStatus, payment_status: editPayStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Application updated");
      onUpdated();
      setEditMode(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote() {
    if (!admission || !note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/v1/admin/admissions/${admission.id}`, {
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

  const photoUrl = resolvePhotoUrl(admission?.student_photo ?? null);

  const content = admission ? (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-10 shrink-0">
            {photoUrl && <AvatarImage src={photoUrl} alt={admission.name_en} />}
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold text-sm">
              {initials(admission.name_en)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{admission.name_en}</p>
            {admission.name_bn && (
              <p className="text-xs text-muted-foreground truncate">{admission.name_bn}</p>
            )}
            <p className="text-xs text-muted-foreground font-mono">
              {admission.username ?? `#${admission.id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setEditMode(true)}>
              <Pencil className="size-3" /> Edit
            </Button>
          )}
          <Button size="icon" variant="ghost" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5">
        <div className="pb-10">
          {/* Status section */}
          {editMode ? (
            <div className="flex gap-3 pt-4 pb-2 flex-wrap">
              <div className="flex-1 min-w-36">
                <Label className="text-xs mb-1 block">Application Status</Label>
                <Select value={editAppStatus} onValueChange={setEditAppStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APP_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-36">
                <Label className="text-xs mb-1 block">Payment Status</Label>
                <Select value={editPayStatus} onValueChange={setEditPayStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-4 pb-1 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", appStatusBadge(admission.status))}>
                {admission.status}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", paymentStatusBadge(admission.payment_status))}>
                {admission.payment_status}
              </Badge>
              {admission.division && (
                <Badge variant="outline" className={cn("text-xs", divisionBadgeClass(admission.division))}>
                  {admission.division}
                </Badge>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!editMode && admission.status !== "Enrolled" && (
            <div className="flex gap-2 pt-3 flex-wrap">
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { onApproveToStudent(admission); onClose(); }}
              >
                <UserCheck className="size-3.5" /> Approve to Student
              </Button>
              {admission.status !== "Rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => { onReject(admission); onClose(); }}
                >
                  <XCircle className="size-3.5" /> Reject
                </Button>
              )}
            </div>
          )}

          <SectionTitle icon={User} title="Student Information" />
          <InfoRow label="Name (EN)" value={admission.name_en} />
          <InfoRow label="Name (BN)" value={admission.name_bn} />
          <InfoRow label="Name (AR)" value={admission.name_ar} />
          <InfoRow label="Class Applied" value={admission.class_name} />
          <InfoRow label="Section" value={admission.section} />
          <InfoRow label="Session" value={admission.session_name} />
          <InfoRow label="Division" value={admission.division} />
          <InfoRow label="Gender" value={admission.gender} />
          <InfoRow label="Date of Birth" value={admission.dob ? fmtDate(admission.dob) : null} />
          <InfoRow label="Blood Group" value={admission.blood_group} />
          <InfoRow label="Nationality" value={admission.nationality} />
          <InfoRow label="Height" value={admission.height} />
          <InfoRow label="Weight" value={admission.weight} />
          <InfoRow label="Identify Sign" value={admission.identify_sign} />
          <InfoRow label="Birth Certificate No." value={admission.birth_certificate_no} />
          <InfoRow label="Previous Institute" value={admission.previous_institute_name} />
          <InfoRow label="Sibling Details" value={admission.sibling_details} />

          <SectionTitle icon={MapPin} title="Present Address" />
          <InfoRow label="Village" value={admission.present_village} />
          <InfoRow label="Post" value={admission.present_post} />
          <InfoRow label="Post Code" value={admission.present_post_code} />
          <InfoRow label="Upazilla" value={admission.present_upazilla} />
          <InfoRow label="Zilla" value={admission.present_zilla} />

          <SectionTitle icon={MapPin} title="Permanent Address" />
          <InfoRow label="Village" value={admission.permanent_village} />
          <InfoRow label="Post" value={admission.permanent_post} />
          <InfoRow label="Post Code" value={admission.permanent_post_code} />
          <InfoRow label="Upazilla" value={admission.permanent_upazilla} />
          <InfoRow label="Zilla" value={admission.permanent_zilla} />

          <SectionTitle icon={Users} title="Father's Information" />
          <InfoRow label="Name (EN)" value={admission.father_name_en} />
          <InfoRow label="Name (BN)" value={admission.father_name_bn} />
          <InfoRow label="Education" value={admission.father_education} />
          <InfoRow label="Occupation" value={admission.father_occupation} />
          <InfoRow label="Monthly Earning" value={admission.father_monthly_earning ? `৳ ${admission.father_monthly_earning}` : null} />
          <InfoRow label="Mobile No." value={admission.father_mobile_no} />
          <InfoRow label="NID No." value={admission.father_nid_no} />
          <InfoRow label="Date of Birth" value={admission.father_dob ? fmtDate(admission.father_dob) : null} />

          <SectionTitle icon={Users} title="Mother's Information" />
          <InfoRow label="Name (EN)" value={admission.mother_name_en} />
          <InfoRow label="Name (BN)" value={admission.mother_name_bn} />
          <InfoRow label="Education" value={admission.mother_education} />
          <InfoRow label="Occupation" value={admission.mother_occupation} />
          <InfoRow label="Monthly Earning" value={admission.mother_monthly_earning ? `৳ ${admission.mother_monthly_earning}` : null} />
          <InfoRow label="Mobile No." value={admission.mother_mobile_no} />
          <InfoRow label="NID No." value={admission.mother_nid_no} />
          <InfoRow label="Date of Birth" value={admission.mother_dob ? fmtDate(admission.mother_dob) : null} />

          <SectionTitle icon={Users} title="Guardian's Information" />
          <InfoRow label="Name" value={admission.guardian_name} />
          <InfoRow label="Relation" value={admission.guardian_student_relation} />
          <InfoRow label="Mobile No." value={admission.guardian_mobile_no} />
          <InfoRow label="NID No." value={admission.guardian_nid_no} />
          <InfoRow label="Education" value={admission.guardian_education} />
          <InfoRow label="Occupation" value={admission.guardian_occupation} />
          <InfoRow label="Monthly Earning" value={admission.guardian_monthly_earning ? `৳ ${admission.guardian_monthly_earning}` : null} />
          <InfoRow label="Date of Birth" value={admission.guardian_dob ? fmtDate(admission.guardian_dob) : null} />
          <InfoRow label="Present Address" value={admission.guardian_present_address} />
          <InfoRow label="Permanent Address" value={admission.guardian_permanent_address} />

          <SectionTitle icon={FileCheck} title="Documents" />
          <DocumentItem label="Student Photo" value={admission.student_photo} />
          <DocumentItem label="Student Signature" value={admission.student_signature} />

          <SectionTitle icon={BarChart3} title="Admission Test Marks" />
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
              <p className="text-xs text-muted-foreground">
                Total: {(Number(writtenMarks || 0) + Number(vivaMarks || 0)).toFixed(0)}
              </p>
            )}
            {admission.mark?.entered_by && (
              <p className="text-xs text-muted-foreground">
                Last entered by {admission.mark.entered_by} on {fmtDate(admission.mark.entered_at)}
              </p>
            )}
            <Button
              size="sm" variant="outline" className="h-7 text-xs"
              disabled={savingMarks || (writtenMarks === "" && vivaMarks === "")}
              onClick={handleSaveMarks}
            >
              {savingMarks ? "Saving…" : "Save Marks"}
            </Button>
          </div>

          <SectionTitle icon={CreditCard} title="Fee & Payment" />
          <InfoRow label="Application Fee" value={`৳ ${admission.application_fee}`} />
          <InfoRow label="Application Status" value={admission.status} />
          <InfoRow label="Payment Status" value={admission.payment_status} />
          <InfoRow label="Payment Tracking ID" value={admission.payment_tracking_id} />
          <InfoRow label="Enrollment Payment" value={admission.enrollment_payment_status} />
          {admission.enrollment_payment_tracking_id && (
            <InfoRow label="Enrollment Tracking ID" value={admission.enrollment_payment_tracking_id} />
          )}

          {admission.username && (
            <>
              <SectionTitle icon={GraduationCap} title="Applicant Account" />
              <InfoRow label="Username" value={admission.username} />
            </>
          )}

          <SectionTitle icon={MessageSquare} title="Internal Notes" />
          <div className="py-2">
            <Textarea
              placeholder="Add internal notes (not visible to applicants)…"
              className="text-sm min-h-20 resize-none"
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

          <SectionTitle icon={Clock} title="Activity Log" />
          <div className="py-2 space-y-2">
            <ActivityItem text="Application submitted" date={fmtDate(admission.created_at)} />
            {admission.status !== "Pending" && (
              <ActivityItem
                text={`App status: ${admission.status}`}
                date={fmtDate(admission.updated_at)}
              />
            )}
            {admission.payment_status !== "Unpaid" && (
              <ActivityItem
                text={`Payment: ${admission.payment_status}`}
                date={fmtDate(admission.updated_at)}
              />
            )}
          </div>

          <div className="pt-4 text-xs text-muted-foreground space-y-1 border-t mt-2">
            <p>Submitted: {fmtDate(admission.created_at)}</p>
            <p>Last updated: {fmtDate(admission.updated_at)}</p>
            <p>Application ID: #{admission.id}</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="flex flex-col max-h-[92vh]">
          <DrawerHeader className="sr-only"><DrawerTitle>Application Details</DrawerTitle></DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col" showCloseButton={false}>
        <SheetHeader className="sr-only"><SheetTitle>Application Details</SheetTitle></SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column Visibility Toggle
// ─────────────────────────────────────────────────────────────────────────────

function ColumnToggle({
  visible,
  onChange,
}: {
  visible: Set<ColKey>;
  onChange: (key: ColKey, on: boolean) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Columns3 className="size-3.5" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <p className="text-xs font-semibold text-muted-foreground px-2 pb-1.5">Show / hide columns</p>
        {COLUMNS.map((col) => (
          <label
            key={col.key}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
          >
            <Checkbox
              checked={visible.has(col.key)}
              onCheckedChange={(v) => onChange(col.key, !!v)}
            />
            <span className="text-sm">{col.label}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton({ cols = 8 }: { cols?: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b">
          {Array.from({ length: cols + 2 }).map((__, j) => (
            <td key={j} className="py-3 px-4"><Skeleton className="h-3.5 w-full max-w-24" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-xl p-4 space-y-3 bg-background">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="border rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b items-center">
            <Skeleton className="size-4" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Filter Chips
// ─────────────────────────────────────────────────────────────────────────────

type FilterChip = { key: string; label: string; onRemove: () => void };

function ActiveFilterChips({ chips, onClearAll }: { chips: FilterChip[]; onClearAll: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {chips.map((chip) => (
        <span key={chip.key}
          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 font-medium">
          {chip.label}
          <button onClick={chip.onRemove} className="hover:text-indigo-900 ml-0.5">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button onClick={onClearAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
        Clear all
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Action Bar
// ─────────────────────────────────────────────────────────────────────────────

function BulkActionBar({ count, onDeselect, onUpdateStatus }: {
  count: number; onDeselect: () => void; onUpdateStatus: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background border rounded-xl shadow-lg px-4 py-2.5 text-sm whitespace-nowrap">
      <span className="font-semibold text-indigo-700 mr-1">{count} selected</span>
      <Separator orientation="vertical" className="h-4" />
      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={onUpdateStatus}>
        <CheckSquare className="size-3.5" /> Status
      </Button>
      <Separator orientation="vertical" className="h-4" />
      <Button size="icon" variant="ghost" className="size-7" onClick={onDeselect}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Content
// ─────────────────────────────────────────────────────────────────────────────

function AdmissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  // ── Column visibility ──────────────────────────────────────────────────────
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    () => new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
  );
  function toggleCol(key: ColKey, on: boolean) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  }

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch]             = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebounced] = useState(searchParams.get("q") ?? "");
  const [classFilter, setClassFilter]   = useState(searchParams.get("class") ?? "");
  const [genderFilter, setGenderFilter] = useState(searchParams.get("gender") ?? "");
  const [appStatusFilter, setAppStatus] = useState(searchParams.get("status") ?? "");
  const [payStatusFilter, setPayStatus] = useState(searchParams.get("payment") ?? "");
  const [dateFrom, setDateFrom]         = useState(searchParams.get("from") ?? "");
  const [dateTo, setDateTo]             = useState(searchParams.get("to") ?? "");
  const [page, setPage]                 = useState(Math.max(1, Number(searchParams.get("page") || 1)));
  const [perPage, setPerPage]           = useState(Number(searchParams.get("per") || 25));

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters]           = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selected, setSelected]                 = useState<Set<number>>(new Set());
  const [sheetAdmission, setSheetAdmission]     = useState<Admission | null>(null);
  const [sheetOpen, setSheetOpen]               = useState(false);

  // ── Dialog targets ─────────────────────────────────────────────────────────
  const [approveTarget, setApproveTarget]   = useState<Admission | null>(null);
  const [rejectTarget, setRejectTarget]     = useState<Admission | null>(null);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue]   = useState("");

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── URL sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("q", debouncedSearch);
    if (classFilter)     p.set("class", classFilter);
    if (genderFilter)    p.set("gender", genderFilter);
    if (appStatusFilter) p.set("status", appStatusFilter);
    if (payStatusFilter) p.set("payment", payStatusFilter);
    if (dateFrom)        p.set("from", dateFrom);
    if (dateTo)          p.set("to", dateTo);
    if (page > 1)        p.set("page", String(page));
    if (perPage !== 25)  p.set("per", String(perPage));
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, classFilter, genderFilter, appStatusFilter, payStatusFilter, dateFrom, dateTo, page, perPage]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, refetch } = useQuery<AdmissionsResponse>({
    queryKey: ["admin-admissions"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/admissions");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const allAdmissions = data?.admissions?.data ?? [];

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allAdmissions;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((a) =>
        a.name_en.toLowerCase().includes(q) ||
        (a.name_bn ?? "").toLowerCase().includes(q) ||
        String(a.id).includes(q) ||
        (a.username ?? "").toLowerCase().includes(q) ||
        (a.guardian_name ?? "").toLowerCase().includes(q) ||
        (a.guardian_mobile_no ?? "").includes(q)
      );
    }
    if (classFilter)     list = list.filter((a) => a.class_name.toLowerCase() === classFilter.toLowerCase());
    if (genderFilter)    list = list.filter((a) => a.gender.toLowerCase() === genderFilter.toLowerCase());
    if (appStatusFilter) list = list.filter((a) => a.status === appStatusFilter);
    if (payStatusFilter) list = list.filter((a) => a.payment_status === payStatusFilter);
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      list = list.filter((a) => new Date(a.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      list = list.filter((a) => new Date(a.created_at) <= to);
    }
    return list;
  }, [allAdmissions, debouncedSearch, classFilter, genderFilter, appStatusFilter, payStatusFilter, dateFrom, dateTo]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * perPage;
  const paginated  = filtered.slice(pageStart, pageStart + perPage);
  const paginationInfo = {
    from: totalItems === 0 ? 0 : pageStart + 1,
    to: Math.min(pageStart + perPage, totalItems),
    total: totalItems, currentPage: safePage, totalPages,
    hasPrev: safePage > 1, hasNext: safePage < totalPages,
  };

  const duplicates = useMemo(() => buildDuplicateMap(filtered), [filtered]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const approveToStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/admissions/${id}/enroll`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? "Failed");
      }
      return res.json();
    },
    onSuccess: (d) => {
      toast.success((d as any).message ?? "Admission approved and student account created");
      qc.invalidateQueries({ queryKey: ["admin-admissions"] });
      setApproveTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve admission");
      setApproveTarget(null);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) =>
        fetch(`/api/v1/admin/admissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatusValue }),
        })
      )),
    onSuccess: () => {
      toast.success(`Status updated for ${selected.size} application${selected.size !== 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["admin-admissions"] });
      setSelected(new Set());
      setBulkStatusDialog(false);
    },
    onError: () => toast.error("Bulk status update failed"),
  });

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected  = paginated.length > 0 && paginated.every((a) => selected.has(a.id));
  const someSelected = paginated.some((a) => selected.has(a.id));
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(paginated.map((a) => a.id))); }
  function toggleOne(id: number) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }
  function openSheet(a: Admission) { setSheetAdmission(a); setSheetOpen(true); }

  function clearAllFilters() {
    setSearch(""); setDebounced(""); setClassFilter(""); setGenderFilter("");
    setAppStatus(""); setPayStatus(""); setDateFrom(""); setDateTo(""); setPage(1);
  }

  const filterChips: FilterChip[] = [
    ...(classFilter     ? [{ key: "class",   label: classFilter,        onRemove: () => { setClassFilter("");  setPage(1); } }] : []),
    ...(genderFilter    ? [{ key: "gender",  label: genderFilter,       onRemove: () => { setGenderFilter(""); setPage(1); } }] : []),
    ...(appStatusFilter ? [{ key: "status",  label: appStatusFilter,    onRemove: () => { setAppStatus("");    setPage(1); } }] : []),
    ...(payStatusFilter ? [{ key: "payment", label: payStatusFilter,    onRemove: () => { setPayStatus("");    setPage(1); } }] : []),
    ...(dateFrom        ? [{ key: "from",    label: `From ${dateFrom}`, onRemove: () => { setDateFrom("");     setPage(1); } }] : []),
    ...(dateTo          ? [{ key: "to",      label: `To ${dateTo}`,     onRemove: () => { setDateTo("");       setPage(1); } }] : []),
  ];

  function FilterFields({ compact = false }: { compact?: boolean }) {
    return (
      <div className={cn("flex gap-3 flex-wrap", compact && "flex-col")}>
        <Select value={classFilter || "all"} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-36")}><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={genderFilter || "all"} onValueChange={(v) => { setGenderFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-28")}><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={appStatusFilter || "all"} onValueChange={(v) => { setAppStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-40")}><SelectValue placeholder="App Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All App Statuses</SelectItem>
            {APP_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={payStatusFilter || "all"} onValueChange={(v) => { setPayStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-44")}><SelectValue placeholder="Payment Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Statuses</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className={cn("flex gap-2", compact && "w-full")}>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 text-sm w-36" />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 text-sm w-36" />
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="size-5 text-indigo-600" /> Admissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${totalItems} of ${allAdmissions.length} applications`}
            {isFetching && !isLoading && <span className="ml-2 text-indigo-500 text-xs animate-pulse">Refreshing…</span>}
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {isMobile && !mobileSearchOpen && (
            <Button variant="outline" size="icon" className="size-9" onClick={() => setMobileSearchOpen(true)}>
              <Search className="size-4" />
            </Button>
          )}

          {isMobile ? (
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowFilters(true)}>
              <Filter className="size-3.5" /> Filters
              {filterChips.length > 0 && (
                <span className="size-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">{filterChips.length}</span>
              )}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-3.5" />
              {showFilters ? "Hide Filters" : "Filters"}
              {filterChips.length > 0 && (
                <span className="size-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">{filterChips.length}</span>
              )}
            </Button>
          )}

          {!isMobile && (
            <ColumnToggle visible={visibleCols} onChange={toggleCol} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <Download className="size-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCSV(filtered)} className="gap-2">
                <FileText className="size-3.5" /> Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      {(!isMobile || mobileSearchOpen) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus={mobileSearchOpen}
            className="pl-9 pr-9 h-10 text-sm"
            placeholder="Search name, ID, phone, guardian…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button onClick={() => { setSearch(""); setDebounced(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          ) : isMobile ? (
            <button onClick={() => setMobileSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {/* Desktop Filter Bar */}
      {!isMobile && showFilters && (
        <div className="bg-muted/30 border rounded-xl p-4"><FilterFields /></div>
      )}

      {/* Active Chips */}
      {filterChips.length > 0 && <ActiveFilterChips chips={filterChips} onClearAll={clearAllFilters} />}

      {/* Error */}
      {isError && (
        <div className="border rounded-xl p-10 text-center space-y-3">
          <AlertTriangle className="size-9 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load applications.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* Desktop Table */}
      {!isMobile && !isError && (
        <div className={cn("rounded-xl border overflow-x-auto bg-background transition-opacity", isFetching && "opacity-70")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all"
                    className={someSelected && !allSelected ? "opacity-50" : ""} />
                </th>
                {visibleCols.has("username")       && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs whitespace-nowrap">ID</th>}
                {visibleCols.has("applicant")      && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Applicant</th>}
                {visibleCols.has("class")          && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Class</th>}
                {visibleCols.has("session")        && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Session</th>}
                {visibleCols.has("division")       && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Division</th>}
                {visibleCols.has("guardian_name")  && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Guardian</th>}
                {visibleCols.has("guardian_phone") && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Phone</th>}
                {visibleCols.has("dob")            && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Date of Birth</th>}
                {visibleCols.has("submitted")      && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Submitted</th>}
                {visibleCols.has("payment_status") && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Payment</th>}
                {visibleCols.has("app_status")     && <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs whitespace-nowrap">App Status</th>}
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton cols={visibleCols.size} />
              ) : (
                paginated.map((a) => {
                  const isDup = duplicates.has(a.id);
                  return (
                    <tr
                      key={a.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group cursor-pointer",
                        selected.has(a.id) && "bg-indigo-50/60",
                      )}
                      onClick={() => openSheet(a)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleOne(a.id)} />
                      </td>
                      {visibleCols.has("username") && (
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {a.username ?? `#${a.id}`}
                        </td>
                      )}
                      {visibleCols.has("applicant") && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8 shrink-0">
                              {resolvePhotoUrl(a.student_photo) && (
                                <AvatarImage src={resolvePhotoUrl(a.student_photo)!} alt={a.name_en} />
                              )}
                              <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                                {initials(a.name_en)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium truncate max-w-32">{a.name_en}</p>
                                {isDup && (
                                  <span title={duplicates.get(a.id)} className="cursor-help shrink-0">
                                    <AlertTriangle className="size-3 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">{a.gender}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleCols.has("class") && (
                        <td className="py-3 px-4">
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {a.class_name}{a.section ? ` · ${a.section}` : ""}
                          </span>
                        </td>
                      )}
                      {visibleCols.has("session") && (
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {a.session_name ?? "—"}
                        </td>
                      )}
                      {visibleCols.has("division") && (
                        <td className="py-3 px-4">
                          {a.division
                            ? <Badge variant="outline" className={cn("text-xs", divisionBadgeClass(a.division))}>{a.division}</Badge>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                      )}
                      {visibleCols.has("guardian_name") && (
                        <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-28">
                          {a.guardian_name ?? "—"}
                        </td>
                      )}
                      {visibleCols.has("guardian_phone") && (
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {a.guardian_mobile_no ?? "—"}
                        </td>
                      )}
                      {visibleCols.has("dob") && (
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {a.dob ? fmtDate(a.dob) : "—"}
                        </td>
                      )}
                      {visibleCols.has("submitted") && (
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(a.created_at)}
                        </td>
                      )}
                      {visibleCols.has("payment_status") && (
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn("text-xs whitespace-nowrap", paymentStatusBadge(a.payment_status))}>
                            {a.payment_status}
                          </Badge>
                        </td>
                      )}
                      {visibleCols.has("app_status") && (
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn("text-xs whitespace-nowrap", appStatusBadge(a.status))}>
                            {a.status}
                          </Badge>
                        </td>
                      )}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => openSheet(a)}>
                              <Eye className="size-3.5" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => openSheet(a)}>
                              <Pencil className="size-3.5" /> Edit Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {a.status !== "Enrolled" && (
                              <DropdownMenuItem
                                className="gap-2 text-green-600 focus:text-green-700"
                                onClick={() => setApproveTarget(a)}
                              >
                                <UserCheck className="size-3.5" /> Approve to Student
                              </DropdownMenuItem>
                            )}
                            {a.status !== "Rejected" && (
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => setRejectTarget(a)}
                              >
                                <XCircle className="size-3.5" /> Reject
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!isLoading && paginated.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <ClipboardList className="size-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">No applications match your filters</p>
              {(filterChips.length > 0 || debouncedSearch) && (
                <Button size="sm" variant="outline" onClick={clearAllFilters}>Clear filters</Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Cards */}
      {isMobile && !isError && (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-70")}>
          {isLoading ? <CardSkeleton /> : paginated.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ClipboardList className="size-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">No applications match your filters</p>
              {(filterChips.length > 0 || debouncedSearch) && (
                <Button size="sm" variant="outline" onClick={clearAllFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            paginated.map((a) => {
              const isDup = duplicates.has(a.id);
              return (
                <div
                  key={a.id}
                  onClick={() => openSheet(a)}
                  onContextMenu={(e) => { e.preventDefault(); toggleOne(a.id); }}
                  className={cn(
                    "border rounded-xl p-4 bg-background cursor-pointer transition-colors",
                    selected.has(a.id) ? "border-indigo-400 bg-indigo-50/60" : "hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {selected.has(a.id) && (
                        <div className="size-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                          <CheckSquare className="size-3 text-white" />
                        </div>
                      )}
                      <Avatar className="size-9 shrink-0">
                        {resolvePhotoUrl(a.student_photo) && (
                          <AvatarImage src={resolvePhotoUrl(a.student_photo)!} alt={a.name_en} />
                        )}
                        <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700 font-semibold">
                          {initials(a.name_en)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm truncate">{a.name_en}</p>
                          {isDup && <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{a.username ?? `#${a.id}`}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                        {a.class_name}{a.section ? ` · ${a.section}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={cn("text-xs", appStatusBadge(a.status))}>{a.status}</Badge>
                    <Badge variant="outline" className={cn("text-xs", paymentStatusBadge(a.payment_status))}>{a.payment_status}</Badge>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Submitted {fmtDate(a.created_at)}</p>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {a.status !== "Enrolled" && (
                        <Button size="sm" variant="ghost"
                          className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 px-2"
                          onClick={() => setApproveTarget(a)}>
                          <UserCheck className="size-3" />
                        </Button>
                      )}
                      {a.status !== "Rejected" && (
                        <Button size="sm" variant="ghost"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive px-2"
                          onClick={() => setRejectTarget(a)}>
                          <XCircle className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {paginationInfo.hasNext && (
            <Button variant="outline" className="w-full" onClick={() => setPage((p) => p + 1)}>Load more</Button>
          )}
        </div>
      )}

      {/* Desktop Pagination */}
      {!isMobile && !isLoading && paginationInfo.total > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows per page:</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs">Showing {paginationInfo.from}–{paginationInfo.to} of {paginationInfo.total}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => setPage((p) => p - 1)} disabled={!paginationInfo.hasPrev}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-2 text-xs font-medium">{paginationInfo.currentPage} / {paginationInfo.totalPages}</span>
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => setPage((p) => p + 1)} disabled={!paginationInfo.hasNext}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar count={selected.size} onDeselect={() => setSelected(new Set())} onUpdateStatus={() => setBulkStatusDialog(true)} />

      {/* Detail Sheet */}
      <AdmissionSheet
        admission={sheetAdmission}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["admin-admissions"] })}
        isMobile={isMobile}
        onApproveToStudent={(a) => setApproveTarget(a)}
        onReject={(a) => setRejectTarget(a)}
      />

      {/* Mobile Filter Drawer */}
      <Drawer open={isMobile && showFilters} onOpenChange={(v) => !v && setShowFilters(false)}>
        <DrawerContent className="px-5 pb-8">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Filter className="size-4 text-indigo-600" /> Filters
            </DrawerTitle>
          </DrawerHeader>
          <FilterFields compact />
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={clearAllFilters}>Clear all</Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>Apply</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Approve to Student Dialog */}
      <AlertDialog open={approveTarget !== null} onOpenChange={(v) => !v && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Admission to Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a student account for <strong>{approveTarget?.name_en}</strong> and
              mark them as enrolled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              disabled={approveToStudentMutation.isPending}
              onClick={() => { if (approveTarget) approveToStudentMutation.mutate(approveTarget.id); }}
            >
              {approveToStudentMutation.isPending ? "Approving…" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <RejectDialog
        admission={rejectTarget}
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onRejected={() => {
          qc.invalidateQueries({ queryKey: ["admin-admissions"] });
          setRejectTarget(null);
        }}
      />

      {/* Bulk Status Dialog */}
      <AlertDialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Application Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update the app status of {selected.size} application{selected.size !== 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
              <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
              <SelectContent>
                {APP_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!bulkStatusValue || bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate(Array.from(selected))}
            >
              {bulkStatusMutation.isPending ? "Updating…" : "Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdmissionsContent />
    </Suspense>
  );
}
