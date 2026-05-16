"use client";
// app/(admin)/admin/exams/[id]/page.tsx

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, BookOpen, Plus, Trash2, Loader2, CheckCircle2,
  Calendar, FileText, Users, Edit3, GraduationCap, Globe,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ScheduleEntry = {
  id: string;
  subject: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  sort_order: number;
};

type ExamDetail = {
  id: string;
  name: string;
  academic_year: string;
  class_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "published";
  instructions: string[];
  result_count: number;
  schedule: ScheduleEntry[];
};

type Result = {
  id: string;
  student_id: string;
  student_name: string;
  username: string | null;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  grade: string | null;
  position: number | null;
  pass: boolean | null;
  published_at: string | null;
};

type DocStudent = { id: string; name_en: string; username: string | null; class_name: string; section: string | null; roll_number: string | null };
type ApiClass = { id: string; name: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  return status === "published"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
}

// ── Schedule tab ──────────────────────────────────────────────────────────────

function ScheduleTab({ examId, schedule, refetch }: { examId: string; schedule: ScheduleEntry[]; refetch: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", exam_date: "", start_time: "", end_time: "", room: "" });
  const [deleting, setDeleting] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/v1/admin/exams/${examId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      }),
    onSuccess: () => {
      toast.success("Subject added");
      refetch();
      setOpen(false);
      setForm({ subject: "", exam_date: "", start_time: "", end_time: "", room: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleDelete(entryId: string) {
    setDeleting(entryId);
    try {
      const r = await fetch(`/api/v1/admin/exams/${examId}/schedule/${entryId}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success("Removed");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{schedule.length} subject{schedule.length !== 1 ? "s" : ""} in schedule</p>
        <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />Add Subject
        </Button>
      </div>

      {schedule.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          No subjects yet. Add subjects to build the exam schedule.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Room</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedule.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(s.exam_date).toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs">{s.start_time} – {s.end_time}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.room ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      {deleting === s.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Subject to Schedule</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input placeholder="e.g. Bangla" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Exam Date *</Label>
              <Input type="date" value={form.exam_date} onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time *</Label>
                <Input placeholder="10:00 AM" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time *</Label>
                <Input placeholder="1:00 PM" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Room</Label>
              <Input placeholder="Hall A" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!form.subject || !form.exam_date || !form.start_time || !form.end_time || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────

function ResultsTab({ examId, examName, academicYear, examClassName }: {
  examId: string; examName: string; academicYear: string; examClassName: string | null;
}) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<DocStudent | null>(null);
  const [subjects, setSubjects] = useState<{ subject: string; fullMarks: number; obtainedMarks: number; grade: string; remarks: string }[]>([
    { subject: "", fullMarks: 100, obtainedMarks: 0, grade: "", remarks: "" },
  ]);
  const [extras, setExtras] = useState({
    position: "", total_students: "", attendance_present: "", attendance_total: "",
    pass: true, teacher_remarks: "", publish: false,
  });

  const { data: resultsData, isLoading, refetch } = useQuery<{ results: Result[] }>({
    queryKey: ["exam-results", examId],
    queryFn: () => fetch(`/api/v1/admin/exams/${examId}/results`).then((r) => r.json()),
  });

  const { data: studentsData } = useQuery<{ students: DocStudent[] }>({
    queryKey: ["doc-students-exam", studentQuery],
    queryFn: () => fetch(`/api/v1/admin/students?q=${encodeURIComponent(studentQuery)}&limit=20&status=Active${examClassName ? `&class=${encodeURIComponent(examClassName)}` : ""}`).then((r) => r.json()),
    enabled: addOpen,
  });

  const results = resultsData?.results ?? [];
  const students = studentsData?.students ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        student_id: selectedStudent!.id,
        subjects: subjects.filter((s) => s.subject.trim()),
        position: extras.position ? Number(extras.position) : null,
        total_students: extras.total_students ? Number(extras.total_students) : null,
        attendance_present: extras.attendance_present ? Number(extras.attendance_present) : null,
        attendance_total: extras.attendance_total ? Number(extras.attendance_total) : null,
        pass: extras.pass,
        teacher_remarks: extras.teacher_remarks || null,
        publish: extras.publish,
      };
      return fetch(`/api/v1/admin/exams/${examId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success("Result saved");
      qc.invalidateQueries({ queryKey: ["exam-results", examId] });
      setAddOpen(false);
      setSelectedStudent(null);
      setStudentQuery("");
      setSubjects([{ subject: "", fullMarks: 100, obtainedMarks: 0, grade: "", remarks: "" }]);
      setExtras({ position: "", total_students: "", attendance_present: "", attendance_total: "", pass: true, teacher_remarks: "", publish: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""} entered</p>
        <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />Enter Result
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          No results yet. Click "Enter Result" to add.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pass/Fail</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.class_name}{r.section ? ` · ${r.section}` : ""}{r.roll_number ? ` · Roll ${r.roll_number}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-mono">{r.grade ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.position ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.pass === null ? <span className="text-muted-foreground text-xs">—</span> : (
                      <span className={cn("text-xs font-semibold", r.pass ? "text-green-600" : "text-red-600")}>
                        {r.pass ? "Pass" : "Fail"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.published_at
                      ? <CheckCircle2 className="size-4 text-green-500" />
                      : <span className="text-xs text-muted-foreground">Draft</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enter result dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enter Result</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            {/* Student search */}
            <div className="space-y-1.5">
              <Label>Student *</Label>
              <Input
                placeholder="Search by name or ID…"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
              {students.length > 0 && !selectedStudent && (
                <div className="border rounded-lg overflow-hidden mt-1">
                  {students.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex items-center justify-between"
                      onClick={() => { setSelectedStudent(s); setStudentQuery(s.name_en); }}
                    >
                      <span className="font-medium">{s.name_en}</span>
                      <span className="text-xs text-muted-foreground font-mono">{s.username}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudent && (
                <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                  <span className="font-medium text-indigo-900">{selectedStudent.name_en}</span>
                  <button onClick={() => { setSelectedStudent(null); setStudentQuery(""); }} className="text-xs text-indigo-500 hover:text-indigo-700">Clear</button>
                </div>
              )}
            </div>

            {/* Subjects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subjects</Label>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => setSubjects((s) => [...s, { subject: "", fullMarks: 100, obtainedMarks: 0, grade: "", remarks: "" }])}>
                  <Plus className="size-3" />Add Row
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Subject</th>
                      <th className="text-left px-3 py-2 font-medium w-20">Max</th>
                      <th className="text-left px-3 py-2 font-medium w-20">Obtained</th>
                      <th className="text-left px-3 py-2 font-medium w-16">Grade</th>
                      <th className="text-left px-3 py-2 font-medium">Remarks</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <Input className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0" value={s.subject}
                            onChange={(e) => setSubjects((arr) => arr.map((r, j) => j === i ? { ...r, subject: e.target.value } : r))} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0 w-16" value={s.fullMarks}
                            onChange={(e) => setSubjects((arr) => arr.map((r, j) => j === i ? { ...r, fullMarks: Number(e.target.value) } : r))} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0 w-16" value={s.obtainedMarks}
                            onChange={(e) => setSubjects((arr) => arr.map((r, j) => j === i ? { ...r, obtainedMarks: Number(e.target.value) } : r))} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0 w-12" value={s.grade}
                            onChange={(e) => setSubjects((arr) => arr.map((r, j) => j === i ? { ...r, grade: e.target.value } : r))} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0" value={s.remarks}
                            onChange={(e) => setSubjects((arr) => arr.map((r, j) => j === i ? { ...r, remarks: e.target.value } : r))} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => setSubjects((arr) => arr.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500">
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extra fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Position in Class</Label>
                <Input type="number" placeholder="e.g. 3" value={extras.position}
                  onChange={(e) => setExtras((x) => ({ ...x, position: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Total Students</Label>
                <Input type="number" placeholder="e.g. 42" value={extras.total_students}
                  onChange={(e) => setExtras((x) => ({ ...x, total_students: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Days Present</Label>
                <Input type="number" placeholder="e.g. 178" value={extras.attendance_present}
                  onChange={(e) => setExtras((x) => ({ ...x, attendance_present: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Total Days</Label>
                <Input type="number" placeholder="e.g. 192" value={extras.attendance_total}
                  onChange={(e) => setExtras((x) => ({ ...x, attendance_total: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teacher Remarks</Label>
              <Textarea rows={2} placeholder="Optional remarks…" value={extras.teacher_remarks}
                onChange={(e) => setExtras((x) => ({ ...x, teacher_remarks: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pass-cb" checked={extras.pass}
                  onChange={(e) => setExtras((x) => ({ ...x, pass: e.target.checked }))} className="size-4" />
                <Label htmlFor="pass-cb" className="font-normal cursor-pointer">Mark as Passed</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub-cb" checked={extras.publish}
                  onChange={(e) => setExtras((x) => ({ ...x, publish: e.target.checked }))} className="size-4" />
                <Label htmlFor="pub-cb" className="font-normal cursor-pointer">Publish result now</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!selectedStudent || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ exam: ExamDetail }>({
    queryKey: ["admin-exam", examId],
    queryFn: () => fetch(`/api/v1/admin/exams/${examId}`).then((r) => r.json()),
  });

  const exam = data?.exam;

  const publishMutation = useMutation({
    mutationFn: (status: "draft" | "published") =>
      fetch(`/api/v1/admin/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      }),
    onSuccess: (_, status) => {
      toast.success(status === "published" ? "Exam published — admit cards available" : "Exam set to draft");
      qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/v1/admin/exams/${examId}`, { method: "DELETE" }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      }),
    onSuccess: () => {
      toast.success("Exam deleted");
      router.push("/admin/exams");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center py-16 text-muted-foreground">Exam not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link href="/admin/exams" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1">
          <ArrowLeft className="size-4" />Back
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{exam.name}</h1>
            <Badge variant="outline" className={cn("text-xs", statusBadge(exam.status))}>
              {exam.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {exam.academic_year}
            {exam.class_name && <> · {exam.class_name}</>}
            {exam.start_date && (
              <> · {new Date(exam.start_date).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {exam.status === "draft" ? (
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => publishMutation.mutate("published")}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
              Publish
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" onClick={() => publishMutation.mutate("draft")} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Edit3 className="size-4" />}
              Set to Draft
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
            onClick={() => {
              if (confirm("Delete this exam? This cannot be undone.")) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: "Subjects", value: exam.schedule.length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Users, label: "Results", value: exam.result_count, color: "text-green-600", bg: "bg-green-50" },
          { icon: Calendar, label: "Start", value: exam.start_date ? new Date(exam.start_date).toLocaleDateString("en-BD", { day: "2-digit", month: "short" }) : "—", color: "text-amber-600", bg: "bg-amber-50" },
          { icon: Calendar, label: "End", value: exam.end_date ? new Date(exam.end_date).toLocaleDateString("en-BD", { day: "2-digit", month: "short" }) : "—", color: "text-rose-600", bg: "bg-rose-50" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-xl border bg-background p-4 flex items-center gap-3">
            <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("size-5", color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule" className="gap-2">
            <FileText className="size-3.5" />Schedule
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <GraduationCap className="size-3.5" />Results
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleTab examId={examId} schedule={exam.schedule} refetch={() => refetch()} />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <ResultsTab
            examId={examId}
            examName={exam.name}
            academicYear={exam.academic_year}
            examClassName={exam.class_name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
