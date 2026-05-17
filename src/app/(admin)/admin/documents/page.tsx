"use client";
// app/(admin)/admin/documents/page.tsx

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// ── UI ────────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Loader2, AlertTriangle, Users, X, Archive, BookOpen,
  Receipt, CheckCircle2, Clock, XCircle, CalendarX,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
import { formatBDT, fmtDate } from "@/lib/utils/format";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DocStudent = {
  id: string;
  username: string | null;
  name_en: string;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  gender: string | null;
  blood_group: string | null;
  academic_year: string;
};

type ApiClass = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type ApiExam = {
  id: string;
  name: string;
  academic_year: string;
  class_name: string | null;
  status: string;
  start_date: string | null;
};

type ApiPaymentSub = {
  id: string;
  applicant_name: string | null;
  applicant_username: string | null;
  admission_id: number | null;
  student_id: string | null;
  payment_context: string;
  method: string;
  transaction_id: string;
  amount_sent: string;
  payment_date: string;
  status: string;
  admin_note: string | null;
  receipt_number: string | null;
  submitted_at: string;
};

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

function docUrl(docType: DocType, studentId: string, examId?: string) {
  const base = `/api/documents/${docType}/${studentId}`;
  return examId ? `${base}?examId=${examId}` : base;
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Preview failed" }));
    throw new Error(err.error ?? "Preview failed");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ─────────────────────────────────────────────────────────────────────────────
// StudentSearchCombobox
// ─────────────────────────────────────────────────────────────────────────────

function StudentSearchCombobox({
  value,
  onChange,
}: {
  value: DocStudent | null;
  onChange: (s: DocStudent | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery<{ students: DocStudent[] }>({
    queryKey: ["doc-students", debouncedQuery],
    queryFn: () =>
      fetch(`/api/v1/admin/students?q=${encodeURIComponent(debouncedQuery)}&limit=20&status=Active`).then((r) => r.json()),
    enabled: open,
  });

  const students = data?.students ?? [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(s: DocStudent) {
    onChange(s);
    setQuery(s.name_en);
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
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
            ) : (
              students.map((s) => (
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
                      {initials(s.name_en)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name_en}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.class_name}{s.section ? ` · Sec ${s.section}` : ""}{s.roll_number ? ` · Roll ${s.roll_number}` : ""}
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

function StudentPreviewCard({ student }: { student: DocStudent }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-indigo-200 text-indigo-800 font-semibold text-sm">
          {initials(student.name_en)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-indigo-900 truncate">{student.name_en}</p>
        <p className="text-xs text-indigo-700">
          {student.class_name}{student.section ? ` · Sec ${student.section}` : ""}{student.roll_number ? ` · Roll ${student.roll_number}` : ""}
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
  examId,
}: {
  open: boolean;
  onClose: () => void;
  student: DocStudent | null;
  docType: DocType;
  examId?: string;
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

    fetchPreviewUrl(docUrl(docType, student.id, examId))
      .then((url) => {
        objectUrl = url;
        setPdfUrl(url);
      })
      .catch((e) => setError(e.message ?? "Preview failed"))
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, student, docType, examId]);

  async function handleDownload() {
    if (!student) return;
    setDownloading(true);
    try {
      await downloadBlob(
        docUrl(docType, student.id, examId),
        `${docType}-${student.username ?? student.id}.pdf`
      );
      toast.success(`${DOC_META[docType].label} downloaded for ${student.name_en}`);
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
              <span className="font-normal text-muted-foreground">— {student.name_en}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="h-140 bg-muted/30">
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

function IndividualDownload({
  docType,
  examId,
}: {
  docType: DocType;
  examId?: string;
}) {
  const [student, setStudent] = useState<DocStudent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: resultCheckData, isLoading: resultCheckLoading } = useQuery<{ has_result: boolean }>({
    queryKey: ["result-check", student?.id, examId],
    queryFn: () =>
      fetch(`/api/v1/admin/results/check?studentId=${student!.id}&examId=${examId}`).then((r) => r.json()),
    enabled: docType === "result-card" && !!student && !!examId,
  });
  const resultUnavailable =
    docType === "result-card" && !!student && !!examId && !resultCheckLoading && resultCheckData?.has_result === false;

  async function handleDownload() {
    if (!student) return;
    setDownloading(true);
    try {
      await downloadBlob(
        docUrl(docType, student.id, examId),
        `${docType}-${student.username ?? student.id}.pdf`
      );
      toast.success(`${DOC_META[docType].label} downloaded for ${student.name_en}`);
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

      {docType === "result-card" && student && examId && (
        resultCheckLoading ? (
          <Skeleton className="h-8 w-56" />
        ) : resultCheckData?.has_result ? (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="size-3.5 shrink-0" />
            Result published for this student in the selected exam
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="size-3.5 shrink-0" />
            No published result for this student in the selected exam
          </div>
        )
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          disabled={!student || resultUnavailable}
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-4" />
          Preview
        </Button>
        <Button
          className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={!student || downloading || resultUnavailable}
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
        examId={examId}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClassWiseDownload panel
// ─────────────────────────────────────────────────────────────────────────────

function ClassWiseDownload({
  docType,
  examId,
  defaultAcademicYear,
}: {
  docType: DocType;
  examId?: string;
  defaultAcademicYear?: string;
}) {
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Seed academic year once default arrives
  useEffect(() => {
    if (defaultAcademicYear && !academicYear) setAcademicYear(defaultAcademicYear);
  }, [defaultAcademicYear]);

  const { data: classesData } = useQuery<{ classes: ApiClass[] }>({
    queryKey: ["classes-for-docs"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });

  const classes = classesData?.classes ?? [];
  const selectedClass = classes.find((c) => c.name === classFilter);
  const sections = selectedClass?.sections ?? [];

  const { data: countData } = useQuery<{ pagination: { total: number } }>({
    queryKey: ["doc-student-count", classFilter, sectionFilter],
    queryFn: () => {
      const p = new URLSearchParams({ limit: "1", status: "Active" });
      if (classFilter) p.set("class", classFilter);
      if (sectionFilter) p.set("section", sectionFilter);
      return fetch(`/api/v1/admin/students?${p}`).then((r) => r.json());
    },
  });

  const studentCount = countData?.pagination?.total ?? 0;

  async function handleBulkDownload() {
    setDownloading(true);
    try {
      const body: Record<string, string> = {};
      if (academicYear) body.academic_year = academicYear;
      if (classFilter) body.class_name = classFilter;
      if (sectionFilter) body.section = sectionFilter;
      if (examId) body.exam_id = examId;

      const label = classFilter
        ? `${classFilter.replace(/\s+/g, "-").toLowerCase()}${sectionFilter ? `-${sectionFilter}` : ""}`
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
          <Select
            value={classFilter || "all"}
            onValueChange={(v) => {
              setClassFilter(v === "all" ? "" : v);
              setSectionFilter("");
            }}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-1.5">Section</p>
          <Select
            value={sectionFilter || "all"}
            onValueChange={(v) => setSectionFilter(v === "all" ? "" : v)}
            disabled={!classFilter || sections.length === 0}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((s) => <SelectItem key={s.id} value={s.name}>Section {s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-1.5">Academic Year</p>
          <Input
            className="h-10 text-sm"
            placeholder="e.g. 2025-26"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
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

      {docType === "result-card" && (
        <p className="text-xs text-muted-foreground">
          Only students with a published result for the selected exam will be included in the ZIP.
        </p>
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

function receiptStatusBadge(status: string) {
  switch (status) {
    case "verified":     return { label: "Verified",     cls: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 };
    case "pending":      return { label: "Pending",      cls: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock };
    case "under_review": return { label: "Under Review", cls: "bg-blue-50 text-blue-700 border-blue-200",    icon: Clock };
    case "rejected":     return { label: "Rejected",     cls: "bg-red-50 text-red-700 border-red-200",       icon: XCircle };
    default:             return { label: status,         cls: "bg-muted text-muted-foreground border",       icon: Clock };
  }
}

function contextLabel(sub: ApiPaymentSub) {
  if (sub.payment_context === "admission") return `Admission — ${sub.applicant_username ?? sub.admission_id ?? ""}`;
  if (sub.payment_context === "enrollment") return `Enrollment — ${sub.applicant_name ?? ""}`;
  return `Exam Fee — ${sub.student_id ?? ""}`;
}

function PaymentReceiptsTab() {
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ submissions: ApiPaymentSub[] }>({
    queryKey: ["doc-payment-submissions"],
    queryFn: () => fetch("/api/v1/admin/payment-submissions").then((r) => r.json()),
  });

  const all = data?.submissions ?? [];
  const filtered = all.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      (s.applicant_name ?? "").toLowerCase().includes(q) ||
      (s.applicant_username ?? "").toLowerCase().includes(q) ||
      (s.transaction_id ?? "").toLowerCase().includes(q) ||
      (s.receipt_number ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDownload(sub: ApiPaymentSub) {
    setDownloading(sub.id);
    try {
      await downloadBlob(
        `/api/documents/payment-receipt/${sub.id}`,
        `Receipt-${sub.receipt_number ?? sub.id}.pdf`
      );
      toast.success(`Receipt downloaded`);
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 pr-9 h-10 text-sm"
          placeholder="Search by name, TxnID, receipt number…"
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
      <div className="hidden md:block rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submission</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Applicant</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-24 ml-auto" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
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
                      {sub.receipt_number && (
                        <p className="text-xs text-muted-foreground mt-0.5">{sub.receipt_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{sub.applicant_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{contextLabel(sub)}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatBDT(parseFloat(sub.amount_sent))}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(sub.payment_date)}</td>
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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
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
                    <p className="text-sm font-medium mt-0.5">{sub.applicant_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{contextLabel(sub)}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium shrink-0", badge.cls)}>
                    <BadgeIcon className="size-3" />
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{fmtDate(sub.payment_date)}</span>
                  <span className="font-semibold">{formatBDT(parseFloat(sub.amount_sent))}</span>
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
  const needsExamSelect = docType === "admit-card" || docType === "result-card";

  const [selectedExamId, setSelectedExamId] = useState<string>("");

  const { data: examsData, isLoading: examsLoading } = useQuery<{ exams: ApiExam[] }>({
    queryKey: ["exams-for-docs"],
    queryFn: () => fetch("/api/v1/admin/exams").then((r) => r.json()),
    enabled: needsExamSelect,
  });

  const { data: settingsData } = useQuery<{ setting: { academic_year: string } }>({
    queryKey: ["school-setting"],
    queryFn: () => fetch("/api/v1/admin/settings").then((r) => r.json()),
  });

  const allExams = examsData?.exams ?? [];
  const publishedExams = allExams.filter((e) => e.status === "published");
  const examOptions = publishedExams;

  // Auto-select first option when list loads
  useEffect(() => {
    if (!selectedExamId && examOptions.length > 0) {
      setSelectedExamId(examOptions[0].id);
    }
  }, [examOptions.length]);

  const defaultAcademicYear = settingsData?.setting?.academic_year ?? "";

  // Header
  const header = (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-5 shrink-0", meta.color)} />
      <div>
        <p className="font-semibold">{meta.label}</p>
        <p className="text-xs text-muted-foreground">{meta.desc}</p>
      </div>
    </div>
  );

  // For admit-card and result-card: if no published exams, show empty state
  if (needsExamSelect && !examsLoading && publishedExams.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-3">
          <CalendarX className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 text-sm">No published exams</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {docType === "admit-card"
                ? "Publish at least one exam from the Exams section to generate admit cards."
                : "Publish at least one exam from the Exams section, then enter and publish student results to generate result cards."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {/* Exam selector for admit-card and result-card */}
      {needsExamSelect && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium">
            {docType === "admit-card" ? "Select Exam" : "Select Exam"}
          </p>
          {examsLoading ? (
            <Skeleton className="h-10 w-full max-w-sm" />
          ) : examOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exams found</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {examOptions.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm border transition-colors text-left",
                    selectedExamId === exam.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-background border-border hover:border-indigo-300 text-foreground"
                  )}
                >
                  <span className="font-medium">{exam.name}</span>
                  <span className="ml-2 text-xs opacity-70">{exam.academic_year}</span>
                  {exam.class_name && (
                    <span className="ml-1 text-xs opacity-70">· {exam.class_name}</span>
                  )}
                  <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                    Published
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          <IndividualDownload
            docType={docType}
            examId={needsExamSelect ? selectedExamId : undefined}
          />
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
          <ClassWiseDownload
            docType={docType}
            examId={needsExamSelect ? selectedExamId : undefined}
            defaultAcademicYear={defaultAcademicYear}
          />
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
