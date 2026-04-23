"use client";
// app/(admin)/admin/admissions/page.tsx

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── UI ────────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  Search, Filter, Download, MoreVertical, Eye, Pencil, Archive,
  X, ChevronLeft, ChevronRight, FileText, AlertTriangle,
  RefreshCw, CheckSquare, RotateCcw, ClipboardList,
  MapPin, GraduationCap, User, Users,
  FileCheck, CreditCard, MessageSquare, Clock, SlidersHorizontal,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Admission = {
  id: number;
  school_id: number;
  user_id: number | null;
  class_name: string;
  name: string;
  gender: string;
  dob: string;
  stay_type: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  guardian_occupation: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  upozilla: string | null;
  union_pourosova: string | null;
  ward: string | null;
  village_moholla: string | null;
  student_photo_path: string | null;
  birth_certificate_path: string | null;
  status: string | null;
  application_fee: string;
  payment_tracking_id: string | null;
  username: string | null;
  password_text: string | null;
  created_at: string;
  updated_at: string;
  is_archived?: boolean;
};

type AdmissionsResponse = {
  admissions: {
    data: Admission[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];
const APPLICATION_STATUSES = ["Pending", "Under Review", "Shortlisted", "Rejected", "Enrolled"];
const PAYMENT_STATUSES = ["Unpaid", "Partial", "Paid"];
const STAY_TYPES = ["Home", "Hostel", "Boarder"];
const GENDERS = ["Male", "Female", "Other"];
const PAGE_SIZES = [10, 25, 50, 100];

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

function resolvePaymentStatus(a: Admission): "Unpaid" | "Partial" | "Paid" {
  if (!a.payment_tracking_id) return "Unpaid";
  return "Paid";
}

function resolveAppStatus(a: Admission): string {
  return a.status ?? "Pending";
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "Enrolled":     return "bg-green-50 text-green-700 border-green-200";
    case "Shortlisted":  return "bg-blue-50 text-blue-700 border-blue-200";
    case "Under Review": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Rejected":     return "bg-red-50 text-red-700 border-red-200";
    default:             return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function paymentBadgeClass(status: string) {
  switch (status) {
    case "Paid":    return "bg-green-50 text-green-700 border-green-200";
    case "Partial": return "bg-amber-50 text-amber-700 border-amber-200";
    default:        return "bg-red-50 text-red-600 border-red-200";
  }
}

function stayBadgeClass(type: string | null) {
  switch (type) {
    case "Hostel":  return "bg-purple-50 text-purple-700 border-purple-200";
    case "Boarder": return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:        return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function buildDuplicateMap(list: Admission[]): Map<number, string> {
  const phoneMap = new Map<string, number[]>();
  const emailMap = new Map<string, number[]>();
  list.forEach((a) => {
    if (a.guardian_phone) {
      const k = a.guardian_phone.trim();
      phoneMap.set(k, [...(phoneMap.get(k) ?? []), a.id]);
    }
    if (a.guardian_email) {
      const k = a.guardian_email.toLowerCase().trim();
      emailMap.set(k, [...(emailMap.get(k) ?? []), a.id]);
    }
  });
  const result = new Map<number, string>();
  phoneMap.forEach((ids, _phone) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        const others = ids.filter((x) => x !== id).map((x) => `#${x}`).join(", ");
        result.set(id, `Same phone as Application ${others}`);
      });
    }
  });
  emailMap.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        if (!result.has(id)) {
          const others = ids.filter((x) => x !== id).map((x) => `#${x}`).join(", ");
          result.set(id, `Same email as Application ${others}`);
        }
      });
    }
  });
  return result;
}

function exportCSV(list: Admission[]) {
  const headers = ["ID", "Name", "Class", "Gender", "Stay Type", "Guardian", "Phone", "Email", "Status", "Payment Status", "Fee", "Submitted"];
  const rows = list.map((a) => [
    a.username ?? a.id,
    a.name,
    a.class_name,
    a.gender,
    a.stay_type ?? "",
    a.guardian_name ?? "",
    a.guardian_phone ?? "",
    a.guardian_email ?? "",
    resolveAppStatus(a),
    resolvePaymentStatus(a),
    a.application_fee,
    fmtDate(a.created_at),
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
// useIsMobile hook
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
// Sub-components: InfoRow, SectionTitle, DocumentItem, ActivityItem
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
  const isReal = value && value !== "n/a";
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {isReal ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs underline underline-offset-2">
          View
        </a>
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
// Admission Quick View / Edit Sheet
// ─────────────────────────────────────────────────────────────────────────────

function AdmissionSheet({
  admission,
  open,
  onClose,
  token,
  onUpdated,
  isMobile,
}: {
  admission: Admission | null;
  open: boolean;
  onClose: () => void;
  token: string | undefined;
  onUpdated: () => void;
  isMobile: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPayStatus, setEditPayStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (admission) {
      setEditMode(false);
      setEditStatus(resolveAppStatus(admission));
      setEditPayStatus(resolvePaymentStatus(admission));
      setNote("");
    }
  }, [admission]);

  async function handleSave() {
    if (!admission) return;
    setSaving(true);
    try {
      await api.patch(EP.ADMISSION(admission.id), { status: editStatus }, token);
      toast.success("Application updated");
      onUpdated();
      setEditMode(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const content = admission ? (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold text-sm">
              {initials(admission.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{admission.name}</p>
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
          {/* Status badges */}
          <div className="flex gap-2 pt-4 pb-1 flex-wrap">
            {editMode ? (
              <div className="flex gap-3 w-full flex-wrap">
                <div className="flex-1 min-w-32">
                  <Label className="text-xs mb-1 block">Application Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-32">
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
              <>
                <Badge variant="outline" className={cn("text-xs", statusBadgeClass(resolveAppStatus(admission)))}>
                  {resolveAppStatus(admission)}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", paymentBadgeClass(resolvePaymentStatus(admission)))}>
                  {resolvePaymentStatus(admission)}
                </Badge>
                {admission.is_archived && (
                  <Badge variant="outline" className="text-xs bg-slate-100 text-slate-500">Archived</Badge>
                )}
              </>
            )}
          </div>

          <SectionTitle icon={User} title="Student Information" />
          <InfoRow label="Full Name" value={admission.name} />
          <InfoRow label="Class Applied" value={admission.class_name} />
          <InfoRow label="Gender" value={admission.gender} />
          <InfoRow label="Date of Birth" value={admission.dob ? fmtDate(admission.dob) : null} />
          <InfoRow label="Stay Type" value={admission.stay_type} />

          <SectionTitle icon={MapPin} title="Address" />
          <InfoRow label="Village / Moholla" value={admission.village_moholla} />
          <InfoRow label="Ward" value={admission.ward} />
          <InfoRow label="Union / Pouroshova" value={admission.union_pourosova} />
          <InfoRow label="Upozilla" value={admission.upozilla} />

          <SectionTitle icon={Users} title="Family & Guardian" />
          <InfoRow label="Father's Name" value={admission.father_name} />
          <InfoRow label="Mother's Name" value={admission.mother_name} />
          <InfoRow label="Guardian Name" value={admission.guardian_name} />
          <InfoRow label="Occupation" value={admission.guardian_occupation} />
          <InfoRow label="Phone" value={admission.guardian_phone} />
          <InfoRow label="Email" value={admission.guardian_email} />

          <SectionTitle icon={FileCheck} title="Documents" />
          <DocumentItem label="Student Photo" value={admission.student_photo_path} />
          <DocumentItem label="Birth Certificate" value={admission.birth_certificate_path} />

          <SectionTitle icon={CreditCard} title="Fee & Payment" />
          <InfoRow label="Application Fee" value={`৳ ${admission.application_fee}`} />
          <InfoRow label="Payment Status" value={resolvePaymentStatus(admission)} />
          <InfoRow label="Payment ID" value={admission.payment_tracking_id} />

          {admission.username && (
            <>
              <SectionTitle icon={GraduationCap} title="Applicant Account" />
              <InfoRow label="Username" value={admission.username} />
              <InfoRow label="Password (plain)" value={admission.password_text} />
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
            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" disabled={!note.trim()}>
              Save Note
            </Button>
          </div>

          <SectionTitle icon={Clock} title="Activity Log" />
          <div className="py-2 space-y-2">
            <ActivityItem text="Application submitted" date={fmtDate(admission.created_at)} />
            {admission.status && (
              <ActivityItem
                text={`Status set to ${admission.status}`}
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
        {/* max-h-[92vh] overrides the built-in 80vh cap for more content space */}
        <DrawerContent className="flex flex-col max-h-[92vh]">
          <DrawerHeader className="sr-only"><DrawerTitle>Application Details</DrawerTitle></DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      {/* showCloseButton=false: we render our own X; p-0 + flex flex-col fills the panel height */}
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col" showCloseButton={false}>
        <SheetHeader className="sr-only"><SheetTitle>Application Details</SheetTitle></SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton states
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className="py-3 px-4"><Skeleton className="size-4 rounded" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-12" /></td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-16" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-24" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-16" /></td>
          <td className="py-3 px-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
          <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
          <td className="py-3 px-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
          <td className="py-3 px-4"><Skeleton className="size-6" /></td>
        </tr>
      ))}
    </>
  );
}

function CardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
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
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="border rounded-xl overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <Skeleton className="h-4 w-full" />
        </div>
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
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 font-medium"
        >
          {chip.label}
          <button onClick={chip.onRemove} className="hover:text-indigo-900 ml-0.5">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Action Bar
// ─────────────────────────────────────────────────────────────────────────────

function BulkActionBar({
  count, onDeselect, onUpdateStatus, onUpdatePayment, onArchive,
}: {
  count: number;
  onDeselect: () => void;
  onUpdateStatus: () => void;
  onUpdatePayment: () => void;
  onArchive: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background border rounded-xl shadow-lg px-4 py-2.5 text-sm whitespace-nowrap">
      <span className="font-semibold text-indigo-700 mr-1">{count} selected</span>
      <Separator orientation="vertical" className="h-4" />
      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={onUpdateStatus}>
        <CheckSquare className="size-3.5" /> Status
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={onUpdatePayment}>
        <CreditCard className="size-3.5" /> Payment
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive" onClick={onArchive}>
        <Archive className="size-3.5" /> Archive
      </Button>
      <Separator orientation="vertical" className="h-4" />
      <Button size="icon" variant="ghost" className="size-7" onClick={onDeselect}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — uses useSearchParams (must be inside Suspense)
// ─────────────────────────────────────────────────────────────────────────────

function AdmissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const token = (session?.user as any)?.laravelToken as string | undefined;
  const isMobile = useIsMobile();

  // ── All filter state ───────────────────────────────────────────────────────
  const [search, setSearch]           = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebounced] = useState(searchParams.get("q") ?? "");
  const [classFilter, setClassFilter] = useState(searchParams.get("class") ?? "");
  const [genderFilter, setGenderFilter] = useState(searchParams.get("gender") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [payFilter, setPayFilter]     = useState(searchParams.get("payment") ?? "");
  const [stayFilter, setStayFilter]   = useState(searchParams.get("stay") ?? "");
  const [dateFrom, setDateFrom]       = useState(searchParams.get("from") ?? "");
  const [dateTo, setDateTo]           = useState(searchParams.get("to") ?? "");
  const [showArchived, setShowArchived] = useState(searchParams.get("archived") === "1");
  const [page, setPage]               = useState(Math.max(1, Number(searchParams.get("page") || 1)));
  const [perPage, setPerPage]         = useState(Number(searchParams.get("per") || 25));

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters]     = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selected, setSelected]           = useState<Set<number>>(new Set());
  const [sheetAdmission, setSheetAdmission] = useState<Admission | null>(null);
  const [sheetOpen, setSheetOpen]         = useState(false);

  // ── Bulk dialogs ───────────────────────────────────────────────────────────
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkPayDialog, setBulkPayDialog]       = useState(false);
  const [archiveDialog, setArchiveDialog]       = useState(false);
  const [bulkStatusValue, setBulkStatusValue]   = useState("");
  const [bulkPayValue, setBulkPayValue]         = useState("");
  const [archiveTarget, setArchiveTarget]       = useState<Admission | null>(null);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── URL sync — stable write on filter changes ─────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("q", debouncedSearch);
    if (classFilter)     p.set("class", classFilter);
    if (genderFilter)    p.set("gender", genderFilter);
    if (statusFilter)    p.set("status", statusFilter);
    if (payFilter)       p.set("payment", payFilter);
    if (stayFilter)      p.set("stay", stayFilter);
    if (dateFrom)        p.set("from", dateFrom);
    if (dateTo)          p.set("to", dateTo);
    if (showArchived)    p.set("archived", "1");
    if (page > 1)        p.set("page", String(page));
    if (perPage !== 25)  p.set("per", String(perPage));
    // router.replace is stable in Next.js App Router — safe to omit from deps
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, classFilter, genderFilter, statusFilter, payFilter, stayFilter, dateFrom, dateTo, showArchived, page, perPage]);

  // ── Fetch ALL admissions (large per_page) — filtering done client-side ─────
  // We fetch all records once and filter/paginate locally. This ensures filters,
  // search, and pagination work correctly regardless of what the server supports.
  const { data, isLoading, isFetching, isError, refetch } = useQuery<AdmissionsResponse>({
    queryKey: ["admissions", token ?? ""],
    queryFn: () =>
      api.get<AdmissionsResponse>(EP.ADMISSIONS, token, { per_page: 500 }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const allAdmissions = data?.admissions?.data ?? [];

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allAdmissions;

    // Search: name, ID, username, guardian name, phone, email
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        String(a.id).includes(q) ||
        (a.username ?? "").toLowerCase().includes(q) ||
        (a.guardian_name ?? "").toLowerCase().includes(q) ||
        (a.guardian_phone ?? "").includes(q) ||
        (a.guardian_email ?? "").toLowerCase().includes(q)
      );
    }

    // Class — case-insensitive partial match to handle "class 7" vs "Class 7"
    if (classFilter) {
      list = list.filter((a) =>
        a.class_name.toLowerCase() === classFilter.toLowerCase()
      );
    }

    // Gender
    if (genderFilter) {
      list = list.filter((a) =>
        a.gender.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    // Application status
    if (statusFilter) {
      list = list.filter((a) => resolveAppStatus(a) === statusFilter);
    }

    // Payment status
    if (payFilter) {
      list = list.filter((a) => resolvePaymentStatus(a) === payFilter);
    }

    // Stay type
    if (stayFilter) {
      list = list.filter((a) => (a.stay_type ?? "") === stayFilter);
    }

    // Date range (by submission date)
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((a) => new Date(a.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((a) => new Date(a.created_at) <= to);
    }

    // Archived toggle
    list = list.filter((a) => !!a.is_archived === showArchived);

    return list;
  }, [allAdmissions, debouncedSearch, classFilter, genderFilter, statusFilter, payFilter, stayFilter, dateFrom, dateTo, showArchived]);

  // ── Client-side pagination ─────────────────────────────────────────────────
  const totalItems  = filtered.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage    = Math.min(page, totalPages);
  const pageStart   = (safePage - 1) * perPage;
  const paginated   = filtered.slice(pageStart, pageStart + perPage);

  const paginationInfo = {
    from:         totalItems === 0 ? 0 : pageStart + 1,
    to:           Math.min(pageStart + perPage, totalItems),
    total:        totalItems,
    currentPage:  safePage,
    totalPages,
    hasPrev:      safePage > 1,
    hasNext:      safePage < totalPages,
  };

  const duplicates = useMemo(() => buildDuplicateMap(filtered), [filtered]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(EP.ADMISSION(id), { is_archived: true }, token),
    onSuccess: () => {
      toast.success("Application archived");
      qc.invalidateQueries({ queryKey: ["admissions"] });
      setSelected(new Set());
    },
    onError: () => toast.error("Failed to archive"),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => api.patch(EP.ADMISSION(id), { status: bulkStatusValue }, token))),
    onSuccess: () => {
      toast.success(`Status updated for ${selected.size} application${selected.size !== 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["admissions"] });
      setSelected(new Set());
      setBulkStatusDialog(false);
    },
    onError: () => toast.error("Bulk status update failed"),
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => api.patch(EP.ADMISSION(id), { is_archived: true }, token))),
    onSuccess: () => {
      toast.success(`${selected.size} application${selected.size !== 1 ? "s" : ""} archived`);
      qc.invalidateQueries({ queryKey: ["admissions"] });
      setSelected(new Set());
      setArchiveDialog(false);
    },
    onError: () => toast.error("Bulk archive failed"),
  });

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected  = paginated.length > 0 && paginated.every((a) => selected.has(a.id));
  const someSelected = paginated.some((a) => selected.has(a.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(paginated.map((a) => a.id)));
  }
  function toggleOne(id: number) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }
  function openSheet(a: Admission) {
    setSheetAdmission(a);
    setSheetOpen(true);
  }

  // ── Clear filters ──────────────────────────────────────────────────────────
  function clearAllFilters() {
    setSearch(""); setDebounced(""); setClassFilter(""); setGenderFilter("");
    setStatusFilter(""); setPayFilter(""); setStayFilter("");
    setDateFrom(""); setDateTo(""); setShowArchived(false); setPage(1);
  }

  // ── Active filter chips ────────────────────────────────────────────────────
  const filterChips: FilterChip[] = [
    ...(classFilter  ? [{ key: "class",  label: classFilter,         onRemove: () => { setClassFilter("");  setPage(1); } }] : []),
    ...(genderFilter ? [{ key: "gender", label: genderFilter,        onRemove: () => { setGenderFilter(""); setPage(1); } }] : []),
    ...(statusFilter ? [{ key: "status", label: statusFilter,        onRemove: () => { setStatusFilter(""); setPage(1); } }] : []),
    ...(payFilter    ? [{ key: "pay",    label: payFilter,           onRemove: () => { setPayFilter("");    setPage(1); } }] : []),
    ...(stayFilter   ? [{ key: "stay",   label: stayFilter,          onRemove: () => { setStayFilter("");   setPage(1); } }] : []),
    ...(dateFrom     ? [{ key: "from",   label: `From ${dateFrom}`,  onRemove: () => { setDateFrom("");     setPage(1); } }] : []),
    ...(dateTo       ? [{ key: "to",     label: `To ${dateTo}`,      onRemove: () => { setDateTo("");       setPage(1); } }] : []),
    ...(showArchived ? [{ key: "arch",   label: "Archived",          onRemove: () => { setShowArchived(false); setPage(1); } }] : []),
  ];

  // ── Filter fields (shared desktop bar + mobile drawer) ────────────────────
  function FilterFields({ compact = false }: { compact?: boolean }) {
    return (
      <div className={cn("flex gap-3 flex-wrap", compact && "flex-col")}>
        <Select value={classFilter || "all"} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-36")}>
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={genderFilter || "all"} onValueChange={(v) => { setGenderFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-28")}>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-36")}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={payFilter || "all"} onValueChange={(v) => { setPayFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-32")}>
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={stayFilter || "all"} onValueChange={(v) => { setStayFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className={cn("h-9 text-sm", compact ? "w-full" : "w-28")}>
            <SelectValue placeholder="Stay" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stay Types</SelectItem>
            {STAY_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className={cn("flex gap-2", compact && "w-full")}>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 text-sm w-36" />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 text-sm w-36" />
        </div>

        <div className="flex items-center gap-2">
          <Switch id="archived" checked={showArchived} onCheckedChange={(v) => { setShowArchived(v); setPage(1); }} />
          <Label htmlFor="archived" className="text-sm cursor-pointer whitespace-nowrap">Show Archived</Label>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="size-5 text-indigo-600" />
            Admissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading applications…"
              : `${totalItems} of ${allAdmissions.length} applications`}
            {isFetching && !isLoading && (
              <span className="ml-2 text-indigo-500 text-xs animate-pulse">Refreshing…</span>
            )}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {isMobile && !mobileSearchOpen && (
            <Button variant="outline" size="icon" className="size-9" onClick={() => setMobileSearchOpen(true)}>
              <Search className="size-4" />
            </Button>
          )}

          {isMobile ? (
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowFilters(true)}>
              <Filter className="size-3.5" />
              Filters
              {filterChips.length > 0 && (
                <span className="size-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">
                  {filterChips.length}
                </span>
              )}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-3.5" />
              {showFilters ? "Hide Filters" : "Filters"}
              {filterChips.length > 0 && (
                <span className="size-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">
                  {filterChips.length}
                </span>
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <Download className="size-3.5" />
                Export
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

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      {(!isMobile || mobileSearchOpen) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus={mobileSearchOpen}
            className="pl-9 pr-9 h-10 text-sm"
            placeholder="Search name, ID, phone, email, guardian…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button
              onClick={() => { setSearch(""); setDebounced(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : isMobile ? (
            <button onClick={() => setMobileSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {/* ── Desktop Filter Bar ───────────────────────────────────────────── */}
      {!isMobile && showFilters && (
        <div className="bg-muted/30 border rounded-xl p-4">
          <FilterFields />
        </div>
      )}

      {/* ── Active Chips ─────────────────────────────────────────────────── */}
      {filterChips.length > 0 && (
        <ActiveFilterChips chips={filterChips} onClearAll={clearAllFilters} />
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {isError && (
        <div className="border rounded-xl p-10 text-center space-y-3">
          <AlertTriangle className="size-9 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load applications.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      {!isMobile && !isError && (
        <div className={cn("rounded-xl border overflow-x-auto bg-background transition-opacity", isFetching && "opacity-70")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    className={someSelected && !allSelected ? "opacity-50" : ""}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Applicant</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Class</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Guardian</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Submitted</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Stay</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Payment</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                paginated.map((a) => {
                  const appStatus = resolveAppStatus(a);
                  const payStatus = resolvePaymentStatus(a);
                  const isDup = duplicates.has(a.id);
                  return (
                    <tr
                      key={a.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group cursor-pointer",
                        selected.has(a.id) && "bg-indigo-50/60",
                        a.is_archived && "opacity-60",
                      )}
                      onClick={() => openSheet(a)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleOne(a.id)} />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {a.username ?? `#${a.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                              {initials(a.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium truncate max-w-32">{a.name}</p>
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
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {a.class_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-28">
                        {a.guardian_name ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                        {a.guardian_phone ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(a.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {a.stay_type ? (
                          <Badge variant="outline" className={cn("text-xs", stayBadgeClass(a.stay_type))}>
                            {a.stay_type}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn("text-xs whitespace-nowrap", statusBadgeClass(appStatus))}>
                          {appStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn("text-xs", paymentBadgeClass(payStatus))}>
                          {payStatus}
                        </Badge>
                      </td>
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
                              <Pencil className="size-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {a.is_archived ? (
                              <DropdownMenuItem className="gap-2" onClick={() => archiveMutation.mutate(a.id)}>
                                <RotateCcw className="size-3.5" /> Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => setArchiveTarget(a)}
                              >
                                <Archive className="size-3.5" /> Archive
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
              <p className="text-sm font-medium text-muted-foreground">
                {showArchived ? "No archived applications" : "No applications match your filters"}
              </p>
              {(filterChips.length > 0 || debouncedSearch) && (
                <Button size="sm" variant="outline" onClick={clearAllFilters}>Clear filters</Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Mobile Cards ─────────────────────────────────────────────────── */}
      {isMobile && !isError && (
        <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-70")}>
          {isLoading ? (
            <CardSkeleton />
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ClipboardList className="size-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {showArchived ? "No archived applications" : "No applications match your filters"}
              </p>
              {(filterChips.length > 0 || debouncedSearch) && (
                <Button size="sm" variant="outline" onClick={clearAllFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            paginated.map((a) => {
              const appStatus = resolveAppStatus(a);
              const payStatus = resolvePaymentStatus(a);
              const isDup = duplicates.has(a.id);
              return (
                <div
                  key={a.id}
                  onClick={() => openSheet(a)}
                  onContextMenu={(e) => { e.preventDefault(); toggleOne(a.id); }}
                  className={cn(
                    "border rounded-xl p-4 bg-background cursor-pointer transition-colors",
                    selected.has(a.id) ? "border-indigo-400 bg-indigo-50/60" : "hover:bg-muted/30",
                    a.is_archived && "opacity-60",
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
                        <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700 font-semibold">
                          {initials(a.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm truncate">{a.name}</p>
                          {isDup && (
                            <span title={duplicates.get(a.id)}>
                              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{a.username ?? `#${a.id}`}</p>
                      </div>
                    </div>
                    {a.is_archived && (
                      <Badge variant="outline" className="text-xs bg-slate-100 text-slate-500 shrink-0">Archived</Badge>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {a.class_name}
                    </span>
                    {a.stay_type && (
                      <Badge variant="outline" className={cn("text-xs py-0", stayBadgeClass(a.stay_type))}>
                        {a.stay_type}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className={cn("text-xs", statusBadgeClass(appStatus))}>{appStatus}</Badge>
                    <Badge variant="outline" className={cn("text-xs", paymentBadgeClass(payStatus))}>{payStatus}</Badge>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">Submitted {fmtDate(a.created_at)}</p>
                </div>
              );
            })
          )}

          {/* Mobile: load more button */}
          {paginationInfo.hasNext && (
            <Button variant="outline" className="w-full" onClick={() => setPage((p) => p + 1)}>
              Load more
            </Button>
          )}
        </div>
      )}

      {/* ── Pagination (desktop) ─────────────────────────────────────────── */}
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
          <span className="text-xs">
            Showing {paginationInfo.from}–{paginationInfo.to} of {paginationInfo.total} applications
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => setPage((p) => p - 1)} disabled={!paginationInfo.hasPrev}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-2 text-xs font-medium">
              {paginationInfo.currentPage} / {paginationInfo.totalPages}
            </span>
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => setPage((p) => p + 1)} disabled={!paginationInfo.hasNext}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ──────────────────────────────────────────────── */}
      <BulkActionBar
        count={selected.size}
        onDeselect={() => setSelected(new Set())}
        onUpdateStatus={() => setBulkStatusDialog(true)}
        onUpdatePayment={() => setBulkPayDialog(true)}
        onArchive={() => setArchiveDialog(true)}
      />

      {/* ── Quick View Sheet ─────────────────────────────────────────────── */}
      <AdmissionSheet
        admission={sheetAdmission}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        token={token}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["admissions"] })}
        isMobile={isMobile}
      />

      {/* ── Mobile Filter Drawer ─────────────────────────────────────────── */}
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

      {/* ── Bulk Status Dialog ───────────────────────────────────────────── */}
      <AlertDialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Application Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update the status of {selected.size} application{selected.size !== 1 ? "s" : ""}.
              {bulkStatusValue && ` New status: "${bulkStatusValue}".`}
              {" "}This will notify guardians if notifications are enabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
              <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      {/* ── Bulk Payment Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={bulkPayDialog} onOpenChange={setBulkPayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Payment Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update payment status for {selected.size} selected application{selected.size !== 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={bulkPayValue} onValueChange={setBulkPayValue}>
              <SelectTrigger><SelectValue placeholder="Select payment status" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!bulkPayValue}>Update Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Archive Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={archiveDialog} onOpenChange={setArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Applications</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to archive {selected.size} application{selected.size !== 1 ? "s" : ""}.
              Archived applications will no longer appear in the active list but can be restored.
              This cannot be undone without admin access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={bulkArchiveMutation.isPending}
              onClick={() => bulkArchiveMutation.mutate(Array.from(selected))}
            >
              {bulkArchiveMutation.isPending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Single Archive Confirm ───────────────────────────────────────── */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Application</AlertDialogTitle>
            <AlertDialogDescription>
              Archive the application for <strong>{archiveTarget?.name}</strong>?
              This can be restored by toggling "Show Archived" in filters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (archiveTarget) {
                  archiveMutation.mutate(archiveTarget.id);
                  setArchiveTarget(null);
                }
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export — wraps AdmissionsContent in Suspense so useSearchParams works
// ─────────────────────────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdmissionsContent />
    </Suspense>
  );
}
