"use client";
// app/(admin)/admin/documents/page.tsx

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── UI ────────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  Download, FileText, CreditCard, GraduationCap, Search, Eye,
  Loader2, AlertTriangle, Users, X, Archive, BookOpen, Info,
  Receipt, CheckCircle2, Clock, XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
import type { DocumentStudent } from "@/lib/mock-data/documents";
import { MOCK_STUDENTS, SCHOOL_INFO } from "@/lib/mock-data/documents";
import type { PaymentSubmission } from "@/lib/mock-data/payments";
import { MOCK_PAYMENT_SUBMISSIONS } from "@/lib/mock-data/payments";
import { formatBDT, fmtDate } from "@/lib/utils/format";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];
const SECTIONS = ["A", "B", "C"];
const ACADEMIC_YEARS = ["2025-26", "2024-25", "2023-24"];

type DocType = "id-card" | "result-card" | "admit-card";

const DOC_META: Record<DocType, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  "id-card": {
    label: "ID Card",
    icon: CreditCard,
    color: "text-indigo-600",
    desc: "Student identity card with photo, name, class, roll number",
  },
  "result-card": {
    label: "Result Card",
    icon: FileText,
    color: "text-green-600",
    desc: "Report card with subject-wise marks, grades, percentage",
  },
  "admit-card": {
    label: "Admit Card",
    icon: BookOpen,
    color: "text-amber-600",
    desc: "Examination admit card with schedule and roll number",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

async function downloadBlob(url: string, filename: string, method = "GET", body?: object) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error ?? "Download failed");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

async function fetchPreviewUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Preview failed");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ─────────────────────────────────────────────────────────────────────────────
// MockDataBanner
// ─────────────────────────────────────────────────────────────────────────────

function MockDataBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">
        <strong>Preview mode</strong> — using sample data. Connect the student API to generate real documents.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudentSearchCombobox
// ─────────────────────────────────────────────────────────────────────────────

function StudentSearchCombobox({
  value,
  onChange,
}: {
  value: DocumentStudent | null;
  onChange: (s: DocumentStudent | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results =
    query.trim().length < 1
      ? MOCK_STUDENTS
      : MOCK_STUDENTS.filter((s) => {
          const q = query.toLowerCase();
          return (
            s.name.toLowerCase().includes(q) ||
            s.username.toLowerCase().includes(q) ||
            s.roll_number.includes(q) ||
            s.class_name.toLowerCase().includes(q)
          );
        });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(s: DocumentStudent) {
    onChange(s);
    setQuery(s.name);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 pr-9 h-10 text-sm"
          placeholder="Search by name, ID, roll number…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
            ) : (
              results.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={() => select(s)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-colors",
                    value?.id === s.id && "bg-indigo-50"
                  )}
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700 font-semibold">
                      {initials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.class_name} · Sec {s.section} · Roll {s.roll_number}
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-mono text-muted-foreground shrink-0">
                    {s.username}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudentPreviewCard
// ─────────────────────────────────────────────────────────────────────────────

function StudentPreviewCard({ student }: { student: DocumentStudent }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-indigo-200 text-indigo-800 font-semibold text-sm">
          {initials(student.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-indigo-900 truncate">{student.name}</p>
        <p className="text-xs text-indigo-700">
          {student.class_name} · Sec {student.section} · Roll {student.roll_number}
        </p>
        <p className="text-xs font-mono text-indigo-500 mt-0.5">{student.username}</p>
      </div>
      <div className="ml-auto shrink-0 space-y-1">
        {student.gender && (
          <Badge variant="outline" className="text-xs bg-white border-indigo-200 text-indigo-700">
            {student.gender}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentPreviewDialog
// ─────────────────────────────────────────────────────────────────────────────

function DocumentPreviewDialog({
  open,
  onClose,
  student,
  docType,
}: {
  open: boolean;
  onClose: () => void;
  student: DocumentStudent | null;
  docType: DocType;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setPdfUrl(null);

    fetchPreviewUrl(`/api/documents/${docType}/${student.id}`)
      .then((url) => {
        objectUrl = url;
        setPdfUrl(url);
      })
      .catch((e) => setError(e.message ?? "Preview failed"))
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, student, docType]);

  async function handleDownload() {
    if (!student) return;
    setDownloading(true);
    try {
      await downloadBlob(
        `/api/documents/${docType}/${student.id}`,
        `${docType}-${student.username}.pdf`
      );
      toast.success(`${DOC_META[docType].label} downloaded for ${student.name}`);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            {(() => {
              const Icon = DOC_META[docType].icon;
              return <Icon className={cn("size-4.5", DOC_META[docType].color)} />;
            })()}
            {DOC_META[docType].label} Preview
            {student && (
              <span className="font-normal text-muted-foreground">— {student.name}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="h-[560px] bg-muted/30">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-indigo-600" />
              <p className="text-sm text-muted-foreground">Generating document…</p>
            </div>
          )}
          {error && (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="size-8 text-amber-500" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {pdfUrl && !loading && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Document Preview"
            />
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleDownload}
            disabled={!pdfUrl || downloading}
          >
            {downloading
              ? <><Loader2 className="size-4 animate-spin" />Downloading…</>
              : <><Download className="size-4" />Download PDF</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IndividualDownload panel
// ─────────────────────────────────────────────────────────────────────────────

function IndividualDownload({ docType }: { docType: DocType }) {
  const [student, setStudent] = useState<DocumentStudent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!student) return;
    setDownloading(true);
    try {
      await downloadBlob(
        `/api/documents/${docType}/${student.id}`,
        `${docType}-${student.username}.pdf`
      );
      toast.success(`${DOC_META[docType].label} downloaded for ${student.name}`);
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1.5">Search Student</p>
        <StudentSearchCombobox value={student} onChange={setStudent} />
      </div>

      {student && <StudentPreviewCard student={student} />}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          disabled={!student}
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-4" />
          Preview
        </Button>
        <Button
          className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={!student || downloading}
          onClick={handleDownload}
        >
          {downloading
            ? <><Loader2 className="size-4 animate-spin" />Generating…</>
            : <><Download className="size-4" />Download PDF</>}
        </Button>
      </div>

      <DocumentPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        student={student}
        docType={docType}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClassWiseDownload panel
// ─────────────────────────────────────────────────────────────────────────────

function ClassWiseDownload({ docType }: { docType: DocType }) {
  const [classFilter, setClassFilter] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [downloading, setDownloading] = useState(false);

  const studentCount = MOCK_STUDENTS.filter(
    (s) =>
      (!classFilter || s.class_name === classFilter) &&
      (!section || s.section === section)
  ).length;

  async function handleBulkDownload() {
    setDownloading(true);
    try {
      const body: Record<string, string> = { academic_year: academicYear };
      if (classFilter) body.class_name = classFilter;
      if (section) body.section = section;

      const label = classFilter
        ? `${classFilter.replace(/\s+/g, "-").toLowerCase()}${section ? `-${section}` : ""}`
        : "all-students";

      await downloadBlob(
        `/api/documents/${docType}/bulk`,
        `${docType}s-${label}.zip`,
        "POST",
        body
      );
      toast.success(
        `${DOC_META[docType].label}s downloaded — ${studentCount} file${studentCount !== 1 ? "s" : ""} in ZIP`
      );
    } catch (e: any) {
      toast.error(e.message ?? "Bulk download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <p className="text-sm font-medium mb-1.5">Class</p>
          <Select value={classFilter || "all"} onValueChange={(v) => setClassFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-1.5">Section</p>
          <Select value={section || "all"} onValueChange={(v) => setSection(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {SECTIONS.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-1.5">Academic Year</p>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {studentCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-3.5 shrink-0" />
          <span>
            {studentCount} student{studentCount !== 1 ? "s" : ""} match the selected filters
          </span>
          <Badge variant="outline" className="ml-1 text-xs font-mono bg-indigo-50 text-indigo-700 border-indigo-200">
            {studentCount}
          </Badge>
        </div>
      )}

      <Button
        className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-11"
        onClick={handleBulkDownload}
        disabled={downloading || studentCount === 0}
      >
        {downloading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating {studentCount} document{studentCount !== 1 ? "s" : ""}…
          </>
        ) : (
          <>
            <Archive className="size-4" />
            Generate &amp; Download ZIP ({studentCount} file{studentCount !== 1 ? "s" : ""})
          </>
        )}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentReceiptsTab
// ─────────────────────────────────────────────────────────────────────────────

function receiptStatusBadge(status: PaymentSubmission["status"]) {
  switch (status) {
    case "verified":     return { label: "Verified",     cls: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 };
    case "pending":      return { label: "Pending",      cls: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock };
    case "under_review": return { label: "Under Review", cls: "bg-blue-50 text-blue-700 border-blue-200",    icon: Clock };
    case "rejected":     return { label: "Rejected",     cls: "bg-red-50 text-red-700 border-red-200",       icon: XCircle };
  }
}

function contextLabel(sub: PaymentSubmission) {
  if (sub.paymentContext === "admission") return `Admission — ${sub.applicationId ?? ""}`;
  return `Exam Fee — ${sub.examFeeId ?? ""}`;
}

function PaymentReceiptsTab() {
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = MOCK_PAYMENT_SUBMISSIONS.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      (s.applicationId ?? "").toLowerCase().includes(q) ||
      (s.examFeeId ?? "").toLowerCase().includes(q) ||
      (s.transactionId ?? "").toLowerCase().includes(q) ||
      (s.receiptNumber ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDownload(sub: PaymentSubmission) {
    setDownloading(sub.id);
    try {
      await downloadBlob(
        `/api/documents/payment-receipt/${sub.id}`,
        `Receipt-${sub.receiptNumber ?? sub.id}.pdf`
      );
      toast.success(`Receipt downloaded for ${sub.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Receipt className="size-5 shrink-0 text-violet-600" />
        <div>
          <p className="font-semibold">Payment Receipts</p>
          <p className="text-xs text-muted-foreground">Download verified payment receipts for admission and exam fee submissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 pr-9 h-10 text-sm"
          placeholder="Search by submission ID, application ID, TxnID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submission</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Context</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                  No submissions match your search.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const badge = receiptStatusBadge(sub.status);
                const BadgeIcon = badge.icon;
                const isVerified = sub.status === "verified";
                const isDownloading = downloading === sub.id;
                return (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium">{sub.id}</p>
                      {sub.receiptNumber && (
                        <p className="text-xs text-muted-foreground mt-0.5">{sub.receiptNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{contextLabel(sub)}</td>
                    <td className="px-4 py-3 font-semibold">{formatBDT(sub.amountSent)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(sub.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium", badge.cls)}>
                        <BadgeIcon className="size-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={isVerified ? "default" : "outline"}
                        className={cn("gap-1.5 text-xs", isVerified && "bg-violet-600 hover:bg-violet-700 text-white")}
                        disabled={!isVerified || isDownloading}
                        onClick={() => handleDownload(sub)}
                      >
                        {isDownloading
                          ? <><Loader2 className="size-3 animate-spin" />Downloading…</>
                          : <><Download className="size-3" />{isVerified ? "Download" : "Not verified"}</>}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            No submissions match your search.
          </div>
        ) : (
          filtered.map((sub) => {
            const badge = receiptStatusBadge(sub.status);
            const BadgeIcon = badge.icon;
            const isVerified = sub.status === "verified";
            const isDownloading = downloading === sub.id;
            return (
              <div key={sub.id} className="rounded-xl border bg-background p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold">{sub.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{contextLabel(sub)}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium shrink-0", badge.cls)}>
                    <BadgeIcon className="size-3" />
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{fmtDate(sub.paymentDate)}</span>
                  <span className="font-semibold">{formatBDT(sub.amountSent)}</span>
                </div>
                <Button
                  size="sm"
                  variant={isVerified ? "default" : "outline"}
                  className={cn("w-full gap-2", isVerified && "bg-violet-600 hover:bg-violet-700 text-white")}
                  disabled={!isVerified || isDownloading}
                  onClick={() => handleDownload(sub)}
                >
                  {isDownloading
                    ? <><Loader2 className="size-3.5 animate-spin" />Downloading…</>
                    : <><Download className="size-3.5" />{isVerified ? "Download Receipt" : "Not verified"}</>}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentTab — wraps both panels for one doc type
// ─────────────────────────────────────────────────────────────────────────────

function DocumentTab({ docType }: { docType: DocType }) {
  const meta = DOC_META[docType];
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-5 shrink-0", meta.color)} />
        <div>
          <p className="font-semibold">{meta.label}</p>
          <p className="text-xs text-muted-foreground">{meta.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual */}
        <div className="rounded-xl border bg-background p-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <GraduationCap className="size-3.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Individual Student</p>
              <p className="text-xs text-muted-foreground">Search, preview & download single PDF</p>
            </div>
          </div>
          <IndividualDownload docType={docType} />
        </div>

        {/* Class-wise */}
        <div className="rounded-xl border bg-background p-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="size-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Class / Section Wise</p>
              <p className="text-xs text-muted-foreground">Generate all PDFs as a ZIP download</p>
            </div>
          </div>
          <ClassWiseDownload docType={docType} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Download className="size-5 text-indigo-600" />
            Download Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate and download ID cards, result cards, and admit cards for students
          </p>
        </div>
      </div>

      {/* Mock data banner */}
      <MockDataBanner />

      {/* Tabs */}
      <Tabs defaultValue="id-card" className="space-y-6">
        <TabsList className="h-10 p-1">
          {(Object.entries(DOC_META) as [DocType, typeof DOC_META[DocType]][]).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <TabsTrigger key={key} value={key} className="gap-2 text-sm px-4">
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="sm:hidden">{meta.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="receipts" className="gap-2 text-sm px-4">
            <Receipt className="size-3.5" />
            <span className="hidden sm:inline">Receipts</span>
            <span className="sm:hidden">Rec.</span>
          </TabsTrigger>
        </TabsList>

        {(Object.keys(DOC_META) as DocType[]).map((docType) => (
          <TabsContent key={docType} value={docType}>
            <DocumentTab docType={docType} />
          </TabsContent>
        ))}

        <TabsContent value="receipts">
          <PaymentReceiptsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
