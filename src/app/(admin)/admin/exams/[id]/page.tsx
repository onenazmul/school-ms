"use client";

import { useState, use, useEffect, useRef } from "react";
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
  ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
  Calendar, FileText, Users, Edit3, GraduationCap, Globe,
  ChevronUp, ChevronDown, Pencil, Wand2,
} from "lucide-react";

// ── Date utilities ─────────────────────────────────────────────────────────────

function addDaysToDateStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().split("T")[0];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ScheduleEntry = {
  id: string;
  subject: string;
  class_name: string | null;
  subject_id: number | null;
  subject_code: string | null;
  full_marks: number | null;
  pass_marks: number | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  sort_order: number;
};

type ClassSubjectOption = {
  subject_id: number;
  subject_name: string;
  subject_code: string | null;
  class_name: string | null;
  default_full_marks: number | null;
  default_pass_marks: number | null;
};

type ExamDetail = {
  id: string;
  name: string;
  academic_year: string;
  class_name: string | null;
  schedule_mode: string;
  start_date: string | null;
  end_date: string | null;
  result_date: string | null;
  result_days_after: number | null;
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
  total_students: number | null;
  attendance_present: number | null;
  attendance_total: number | null;
  pass: boolean | null;
  teacher_remarks: string | null;
  published_at: string | null;
  subjects: { subject: string; subject_code: string; fullMarks: number; obtainedMarks: number; grade: string; remarks: string }[];
};

type DocStudent = { id: string; name_en: string; username: string | null; class_name: string; section: string | null; roll_number: string | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  return status === "published"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short" });
}

// ── Schedule tab ──────────────────────────────────────────────────────────────

function ScheduleTab({ examId, examClassName, schedule, scheduleMode, refetch }: {
  examId: string;
  examClassName: string | null;
  schedule: ScheduleEntry[];
  scheduleMode: string;
  refetch: () => void;
}) {
  const { data: settingsData } = useQuery<{ setting: { weekly_off_days: string[]; session_start: string; academic_year: string } }>({
    queryKey: ["school-setting"],
    queryFn: () => fetch("/api/v1/admin/settings").then((r) => r.json()),
  });
  const offDayNames = settingsData?.setting?.weekly_off_days ?? ["Friday", "Saturday"];

  // Pre-fill generator start date from session_start when first loaded
  useEffect(() => {
    if (genStartDate) return;
    const ss = settingsData?.setting?.session_start;
    if (ss) setGenStartDate(ss);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData?.setting?.session_start]);
  const WDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const offDayNums = new Set(offDayNames.map((n) => WDAY_NAMES.indexOf(n)).filter((n) => n >= 0));

  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [form, setForm] = useState({ exam_date: "", start_time: "", end_time: "", room: "", full_marks: "", pass_marks: "" });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingClass, setLoadingClass] = useState(false);
  const [reordering, setReordering] = useState(false);
  const autoLoaded = useRef(false);

  // Generator state
  const [genOpen, setGenOpen] = useState(true);
  const [genStartDate, setGenStartDate] = useState("");
  const [genGap, setGenGap] = useState<"weekday" | "daily" | "every2" | "custom">("weekday");
  const [genGapDays, setGenGapDays] = useState(1);
  const [genStartTime, setGenStartTime] = useState("10:00 AM");
  const [genEndTime, setGenEndTime] = useState("01:00 PM");
  const [generating, setGenerating] = useState(false);

  const { data: classSubjectsData } = useQuery<{ subjects: ClassSubjectOption[]; is_all_classes: boolean }>({
    queryKey: ["exam-class-subjects", examId],
    queryFn: () => fetch(`/api/v1/admin/exams/${examId}/schedule`).then((r) => r.json()),
  });

  const classSubjects = classSubjectsData?.subjects ?? [];
  const isAllClasses = classSubjectsData?.is_all_classes ?? false;

  const scheduledKeys = new Set(
    schedule.map((s) =>
      scheduleMode === "shared"
        ? `${s.subject_id ?? s.subject}`
        : `${s.subject_id ?? s.subject}__${s.class_name ?? ""}`
    )
  );

  const availableSubjects = (() => {
    const filtered = classSubjects.filter((cs) =>
      scheduleMode === "shared"
        ? !scheduledKeys.has(`${cs.subject_id}`)
        : !scheduledKeys.has(`${cs.subject_id}__${cs.class_name ?? ""}`)
    );
    if (scheduleMode === "shared") {
      const seen = new Set<number>();
      return filtered.filter((cs) => { if (seen.has(cs.subject_id)) return false; seen.add(cs.subject_id); return true; });
    }
    return filtered;
  })();

  const useDropdown = availableSubjects.length > 0;
  const canAdd = editEntry
    ? (form.exam_date && form.start_time && form.end_time)
    : useDropdown ? !!subjectId : !!subjectName.trim();

  // Auto-load subjects when schedule is empty on first render
  useEffect(() => {
    if (autoLoaded.current) return;
    if (schedule.length > 0) { autoLoaded.current = true; return; }
    if (classSubjects.length === 0) return;
    autoLoaded.current = true;
    doLoadFromClass(classSubjects);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSubjects.length]);

  function resetDialog() {
    setSubjectId("");
    setSubjectName("");
    setEditEntry(null);
    setForm({ exam_date: "", start_time: "10:00 AM", end_time: "01:00 PM", room: "", full_marks: "", pass_marks: "" });
  }

  function openEdit(entry: ScheduleEntry) {
    setEditEntry(entry);
    setForm({
      exam_date: entry.exam_date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room ?? "",
      full_marks: entry.full_marks ? String(entry.full_marks) : "",
      pass_marks: entry.pass_marks ? String(entry.pass_marks) : "",
    });
    setOpen(true);
  }

  const addMutation = useMutation({
    mutationFn: () => {
      if (editEntry) {
        return fetch(`/api/v1/admin/exams/${examId}/schedule/${editEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exam_date: form.exam_date,
            start_time: form.start_time,
            end_time: form.end_time,
            room: form.room || null,
            full_marks: form.full_marks ? Number(form.full_marks) : null,
            pass_marks: form.pass_marks ? Number(form.pass_marks) : null,
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).message);
          return r.json();
        });
      }
      const body: Record<string, unknown> = {
        exam_date: form.exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room || null,
        full_marks: form.full_marks ? Number(form.full_marks) : null,
        pass_marks: form.pass_marks ? Number(form.pass_marks) : null,
      };
      if (subjectId) {
        body.subject_id = Number(subjectId);
        const cs = availableSubjects.find((s) => String(s.subject_id) === subjectId);
        body.class_name = (scheduleMode === "per_class" && cs?.class_name) ? cs.class_name : "";
      } else {
        body.subject = subjectName.trim();
        body.class_name = "";
      }
      return fetch(`/api/v1/admin/exams/${examId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success(editEntry ? "Updated" : "Added to schedule");
      refetch();
      setOpen(false);
      resetDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function doLoadFromClass(subjects: ClassSubjectOption[]) {
    if (subjects.length === 0) return;
    setLoadingClass(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      let entries: Record<string, unknown>[];
      if (scheduleMode === "shared") {
        const seen = new Set<number>();
        entries = subjects
          .filter((cs) => { if (seen.has(cs.subject_id)) return false; seen.add(cs.subject_id); return true; })
          .map((cs) => ({
            subject_id: cs.subject_id,
            class_name: "",
            exam_date: today,
            start_time: genStartTime || "10:00 AM",
            end_time: genEndTime || "01:00 PM",
            full_marks: cs.default_full_marks ?? null,
            pass_marks: cs.default_pass_marks ?? null,
          }));
      } else {
        entries = subjects.map((cs) => ({
          subject_id: cs.subject_id,
          class_name: cs.class_name ?? "",
          exam_date: today,
          start_time: genStartTime || "10:00 AM",
          end_time: genEndTime || "01:00 PM",
          full_marks: cs.default_full_marks ?? null,
          pass_marks: cs.default_pass_marks ?? null,
        }));
      }
      const r = await fetch(`/api/v1/admin/exams/${examId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: entries }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success(`${entries.length} subjects loaded — use "Generate Dates" to set the schedule`);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingClass(false);
    }
  }

  async function handleGenerateDates() {
    if (!genStartDate || sorted.length === 0) return;
    setGenerating(true);
    try {
      // Collect unique subjects in sort order
      const seen = new Set<string>();
      const subjectOrder: string[] = [];
      for (const e of sorted) {
        if (!seen.has(e.subject)) { seen.add(e.subject); subjectOrder.push(e.subject); }
      }

      // Ensure start date is a weekday if weekday mode
      let startDate = genStartDate;
      if (genGap === "weekday") {
        while (offDayNums.has(new Date(startDate + "T00:00:00Z").getUTCDay())) {
          startDate = addDaysToDateStr(startDate, 1);
        }
      }

      // Build subject → date map
      const subjectDates = new Map<string, string>();
      let cur = startDate;
      for (const subj of subjectOrder) {
        subjectDates.set(subj, cur);
        if (genGap === "weekday") {
          let next = addDaysToDateStr(cur, 1);
          while (offDayNums.has(new Date(next + "T00:00:00Z").getUTCDay())) {
            next = addDaysToDateStr(next, 1);
          }
          cur = next;
        } else if (genGap === "every2") {
          cur = addDaysToDateStr(cur, 2);
        } else if (genGap === "custom") {
          cur = addDaysToDateStr(cur, Math.max(1, genGapDays));
        } else {
          cur = addDaysToDateStr(cur, 1);
        }
      }

      await Promise.all(
        sorted.map((entry) =>
          fetch(`/api/v1/admin/exams/${examId}/schedule/${entry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exam_date: subjectDates.get(entry.subject) ?? genStartDate,
              start_time: genStartTime || "10:00 AM",
              end_time: genEndTime || "01:00 PM",
            }),
          })
        )
      );

      toast.success(`Dates set for ${subjectOrder.length} subject${subjectOrder.length !== 1 ? "s" : ""}`);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  }

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

  async function handleReorder(idx: number, direction: "up" | "down") {
    const sorted = [...schedule].sort((a, b) => a.sort_order - b.sort_order);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newOrder = [...sorted];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setReordering(true);
    try {
      const r = await fetch(`/api/v1/admin/exams/${examId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map((e) => e.id) }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReordering(false);
    }
  }

  const sorted = [...schedule].sort((a, b) => a.sort_order - b.sort_order);
  const uniqueSubjectCount = new Set(sorted.map((e) => e.subject)).size;

  // Group by class_name only in per-class mode with multiple classes
  const groups: { className: string | null; entries: typeof sorted }[] = [];
  if (scheduleMode === "per_class" && isAllClasses && sorted.some((s) => s.class_name)) {
    const classMap = new Map<string, typeof sorted>();
    sorted.forEach((s) => {
      const key = s.class_name || "";
      if (!classMap.has(key)) classMap.set(key, []);
      classMap.get(key)!.push(s);
    });
    classMap.forEach((entries, className) => groups.push({ className: className || null, entries }));
  } else {
    groups.push({ className: null, entries: sorted });
  }

  return (
    <div className="space-y-4">
      {/* Date generator panel */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <button
          onClick={() => setGenOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Wand2 className="size-4 text-indigo-600" />
            Schedule Date Generator
            {sorted.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                {uniqueSubjectCount} subject{uniqueSubjectCount !== 1 ? "s" : ""}
                {" · "}
                {genGap === "weekday" ? "skip off-days" : genGap === "every2" ? "every 2 days" : genGap === "custom" ? `every ${genGapDays}d` : "daily"}
              </span>
            )}
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", genOpen && "rotate-180")} />
        </button>
        {genOpen && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">First Exam Date</Label>
                <Input type="date" className="h-8 text-sm" value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Gap Between Exams</Label>
                <Select value={genGap} onValueChange={(v: any) => setGenGap(v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">
                      Skip off-days{offDayNames.length > 0 ? ` (${offDayNames.map((d) => d.slice(0, 3)).join(", ")})` : ""}
                    </SelectItem>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="every2">Every 2 days</SelectItem>
                    <SelectItem value="custom">Custom gap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {genGap === "custom" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Days Apart</Label>
                  <Input type="number" min={1} className="h-8 text-sm" value={genGapDays}
                    onChange={(e) => setGenGapDays(Math.max(1, Number(e.target.value)))} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input className="h-8 text-sm" placeholder="10:00 AM" value={genStartTime}
                  onChange={(e) => setGenStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input className="h-8 text-sm" placeholder="01:00 PM" value={genEndTime}
                  onChange={(e) => setGenEndTime(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {sorted.length === 0
                  ? "Subjects will be loaded automatically, then you can generate dates."
                  : `Fills sequential dates for ${uniqueSubjectCount} unique subject${uniqueSubjectCount !== 1 ? "s" : ""}.${scheduleMode === "per_class" && isAllClasses ? " All classes sharing a subject get the same date." : ""}`}
              </p>
              <Button
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                onClick={handleGenerateDates}
                disabled={!genStartDate || generating || sorted.length === 0}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                Generate Dates
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule list header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{schedule.length} subject{schedule.length !== 1 ? "s" : ""} in schedule</p>
        <div className="flex gap-2">
          {classSubjects.length > 0 && availableSubjects.length > 0 && (
            <Button
              size="sm" variant="outline" className="gap-1.5 text-xs"
              onClick={() => doLoadFromClass(availableSubjects)} disabled={loadingClass}
            >
              {loadingClass ? <Loader2 className="size-3.5 animate-spin" /> : <GraduationCap className="size-3.5" />}
              {schedule.length === 0 ? "Load Subjects" : "Load Remaining"}
            </Button>
          )}
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { resetDialog(); setOpen(true); }}>
            <Plus className="size-3.5" />Add to Schedule
          </Button>
        </div>
      </div>

      {/* Schedule table */}
      {loadingClass && schedule.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin mx-auto mb-2" />
          Loading subjects…
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground px-6">
          {classSubjects.length > 0
            ? <>Loading subjects from {isAllClasses ? "all classes" : "class"}…</>
            : examClassName
            ? <>No subjects linked to <strong>{examClassName}</strong> yet. Go to <strong>Classes → {examClassName} → Subjects tab</strong> to assign subjects first.</>
            : "No subjects yet. Click Add to Schedule or configure class subjects first."}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ className, entries }) => (
            <div key={className ?? "__all"}>
              {className && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {className}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="w-16 px-2 py-3" />
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Full / Pass</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Room</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entries.map((s, idx) => {
                      const globalIdx = sorted.indexOf(s);
                      return (
                        <tr key={s.id} className="hover:bg-muted/20 group">
                          <td className="px-2 py-2">
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                onClick={() => handleReorder(globalIdx, "up")}
                                disabled={globalIdx === 0 || reordering}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                              >
                                <ChevronUp className="size-3.5" />
                              </button>
                              <span className="text-[10px] text-muted-foreground font-mono">{idx + 1}</span>
                              <button
                                onClick={() => handleReorder(globalIdx, "down")}
                                disabled={globalIdx === sorted.length - 1 || reordering}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                              >
                                <ChevronDown className="size-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{s.subject}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {s.full_marks ?? "—"}{s.pass_marks ? ` / ${s.pass_marks}` : ""}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {fmtDate(s.exam_date)}
                          </td>
                          <td className="px-4 py-3 text-xs">{s.start_time} – {s.end_time}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.room ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEdit(s)}
                                className="text-muted-foreground hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                disabled={deleting === s.id}
                                className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-40"
                              >
                                {deleting === s.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editEntry ? `Edit: ${editEntry.subject}` : "Add to Schedule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {!editEntry && (
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                {useDropdown ? (
                  <Select value={subjectId} onValueChange={(v) => {
                    setSubjectId(v);
                    const cs = availableSubjects.find((s) => String(s.subject_id) === v);
                    if (cs) {
                      setForm((f) => ({
                        ...f,
                        full_marks: cs.default_full_marks ? String(cs.default_full_marks) : "",
                        pass_marks: cs.default_pass_marks ? String(cs.default_pass_marks) : "",
                      }));
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select subject…" /></SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((cs) => (
                        <SelectItem key={`${cs.subject_id}-${cs.class_name}`} value={String(cs.subject_id)}>
                          {cs.subject_name}{cs.subject_code ? ` (${cs.subject_code})` : ""}
                          {scheduleMode === "per_class" && cs.class_name ? ` — ${cs.class_name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="e.g. Mathematics"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Marks</Label>
                <Input type="number" placeholder="100" value={form.full_marks}
                  onChange={(e) => setForm((f) => ({ ...f, full_marks: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Pass Marks</Label>
                <Input type="number" placeholder="33" value={form.pass_marks}
                  onChange={(e) => setForm((f) => ({ ...f, pass_marks: e.target.value }))} />
              </div>
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
            <Button variant="outline" onClick={() => { setOpen(false); resetDialog(); }}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!canAdd || !form.exam_date || !form.start_time || !form.end_time || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {editEntry ? "Save Changes" : "Add to Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────

function ResultsTab({ examId, examClassName, schedule, scheduleMode }: {
  examId: string;
  examClassName: string | null;
  schedule: ScheduleEntry[];
  scheduleMode: string;
}) {
  const [selectedClass, setSelectedClass] = useState<string>(examClassName ?? "");

  // Classes: per_class → unique from schedule; shared all-classes → fetch class list
  const perClassClasses = scheduleMode === "per_class"
    ? [...new Set(schedule.filter((s) => s.class_name).map((s) => s.class_name!))]
    : [];

  const { data: allClassesData } = useQuery<{ classes: { id: string; name: string }[] }>({
    queryKey: ["classes-for-docs"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
    enabled: scheduleMode !== "per_class" && !examClassName,
  });

  const availableClasses = scheduleMode === "per_class"
    ? perClassClasses
    : examClassName
      ? [examClassName]
      : (allClassesData?.classes?.map((c) => c.name) ?? []);

  // Auto-select if only one class
  useEffect(() => {
    if (!selectedClass && availableClasses.length === 1) {
      setSelectedClass(availableClasses[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableClasses.length]);

  // Subjects for selected class
  const classSubjects: ScheduleEntry[] = (() => {
    if (!selectedClass) return [];
    if (scheduleMode === "per_class") {
      return schedule.filter((s) => s.class_name === selectedClass).sort((a, b) => a.sort_order - b.sort_order);
    }
    const seen = new Set<string>();
    return schedule.filter((s) => {
      if (seen.has(s.subject)) return false;
      seen.add(s.subject);
      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  })();

  // Students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ students: DocStudent[] }>({
    queryKey: ["results-students", selectedClass],
    queryFn: () => fetch(`/api/v1/admin/students?class=${encodeURIComponent(selectedClass)}&status=Active&limit=500`).then((r) => r.json()),
    enabled: !!selectedClass,
  });

  // Existing results for selected class
  const { data: resultsData, refetch: refetchResults } = useQuery<{ results: Result[] }>({
    queryKey: ["exam-results", examId, selectedClass],
    queryFn: () => fetch(`/api/v1/admin/exams/${examId}/results${selectedClass ? `?class=${encodeURIComponent(selectedClass)}` : ""}`).then((r) => r.json()),
    enabled: !!selectedClass,
  });

  const students = [...(studentsData?.students ?? [])].sort((a, b) => {
    const ra = parseInt(a.roll_number ?? "9999");
    const rb = parseInt(b.roll_number ?? "9999");
    return ra !== rb ? ra - rb : (a.name_en ?? "").localeCompare(b.name_en ?? "");
  });
  const results = resultsData?.results ?? [];
  const existingResultMap = new Map(results.map((r) => [r.student_id, r]));

  type ExtraInfo = { teacherRemarks: string; attendancePresent: string; attendanceTotal: string; position: string; totalStudents: string };
  const emptyExtra = (): ExtraInfo => ({ teacherRemarks: "", attendancePresent: "", attendanceTotal: "", position: "", totalStudents: "" });

  // marks = user-typed only; dbMarks = pre-filled from DB
  const [marks,    setMarks]    = useState<Record<string, Record<string, string>>>({});
  const [dbMarks,  setDbMarks]  = useState<Record<string, Record<string, string>>>({});
  // per-subject remarks
  const [subjectRemarks,   setSubjectRemarks]   = useState<Record<string, Record<string, string>>>({});
  const [dbSubjectRemarks, setDbSubjectRemarks] = useState<Record<string, Record<string, string>>>({});
  // student-level extras
  const [extraInfo, setExtraInfo] = useState<Record<string, ExtraInfo>>({});
  const [dbExtra,   setDbExtra]   = useState<Record<string, ExtraInfo>>({});

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dirtyRows,    setDirtyRows]    = useState<Set<string>>(new Set());
  const [savedRows,    setSavedRows]    = useState<Set<string>>(new Set());
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);

  const unpublishedResults = results.filter((r) => !r.published_at);
  const publishedCount = results.length - unpublishedResults.length;

  // Populate from DB when results load
  useEffect(() => {
    if (!resultsData) return;
    const lMarks: Record<string, Record<string, string>> = {};
    const lRemarks: Record<string, Record<string, string>> = {};
    const lExtra: Record<string, ExtraInfo> = {};
    for (const r of resultsData.results ?? []) {
      lMarks[r.student_id] = {};
      lRemarks[r.student_id] = {};
      for (const s of r.subjects ?? []) {
        if (s.obtainedMarks != null) lMarks[r.student_id][s.subject] = String(s.obtainedMarks);
        if (s.remarks)               lRemarks[r.student_id][s.subject] = s.remarks;
      }
      lExtra[r.student_id] = {
        teacherRemarks:    r.teacher_remarks ?? "",
        attendancePresent: r.attendance_present != null ? String(r.attendance_present) : "",
        attendanceTotal:   r.attendance_total   != null ? String(r.attendance_total)   : "",
        position:          r.position           != null ? String(r.position)           : "",
        totalStudents:     r.total_students      != null ? String(r.total_students)     : "",
      };
    }
    setDbMarks(lMarks);
    setDbSubjectRemarks(lRemarks);
    setDbExtra(lExtra);
  }, [resultsData]);

  function markDirty(studentId: string) {
    setDirtyRows((prev) => new Set(prev).add(studentId));
    setSavedRows((prev) => { const n = new Set(prev); n.delete(studentId); return n; });
  }

  function handleMarkChange(studentId: string, subject: string, value: string) {
    setMarks((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? {}), [subject]: value } }));
    markDirty(studentId);
  }

  function handleRemarkChange(studentId: string, subject: string, value: string) {
    setSubjectRemarks((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? {}), [subject]: value } }));
    markDirty(studentId);
  }

  function handleExtraChange(studentId: string, field: keyof ExtraInfo, value: string) {
    setExtraInfo((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? emptyExtra()), [field]: value } }));
    markDirty(studentId);
  }

  function toggleExpand(studentId: string) {
    setExpandedRows((prev) => { const n = new Set(prev); n.has(studentId) ? n.delete(studentId) : n.add(studentId); return n; });
  }

  // Auto pass/fail: fails if any subject with a pass_mark threshold is below it
  function computePass(studentId: string): boolean {
    const effective = { ...(dbMarks[studentId] ?? {}), ...(marks[studentId] ?? {}) };
    for (const s of classSubjects) {
      const obtained = Number(effective[s.subject] ?? "");
      if (!effective[s.subject]) continue;
      const passMark = s.pass_marks ?? Math.ceil((s.full_marks ?? 100) * 0.33);
      if (obtained < passMark) return false;
    }
    return true;
  }

  async function handleSave() {
    if (classSubjects.length === 0 || dirtyRows.size === 0) return;
    setSaving(true);
    const toSave = [...dirtyRows];
    let errorCount = 0;
    await Promise.all(
      toSave.map(async (studentId) => {
        const effectiveMarks = { ...(dbMarks[studentId] ?? {}), ...(marks[studentId] ?? {}) };
        const studentRmks   = { ...(dbSubjectRemarks[studentId] ?? {}), ...(subjectRemarks[studentId] ?? {}) };
        const extra         = { ...(dbExtra[studentId] ?? emptyExtra()), ...(extraInfo[studentId] ?? {}) };
        const existingResult = existingResultMap.get(studentId);

        const subjects = classSubjects
          .filter((s) => {
            const hasMarks  = effectiveMarks[s.subject] !== "" && effectiveMarks[s.subject] !== undefined;
            const hasRemark = !!studentRmks[s.subject];
            return hasMarks || hasRemark;
          })
          .map((s) => ({
            subject:       s.subject,
            subject_code:  s.subject_code ?? "",
            fullMarks:     s.full_marks ?? 100,
            obtainedMarks: effectiveMarks[s.subject] ? Number(effectiveMarks[s.subject]) : 0,
            ...(studentRmks[s.subject] ? { remarks: studentRmks[s.subject] } : {}),
          }));

        const hasAnyData = subjects.length > 0 || extra.teacherRemarks || extra.attendancePresent || extra.position;
        if (!hasAnyData) {
          setSavedRows((prev) => new Set(prev).add(studentId));
          setDirtyRows((prev) => { const n = new Set(prev); n.delete(studentId); return n; });
          return;
        }

        // Auto pass/fail based on all marks (including unmodified DB marks)
        const autoPass = computePass(studentId);

        try {
          const body: Record<string, unknown> = {
            student_id: studentId,
            result_id:  existingResult?.id,
            subjects,
            pass: autoPass,
          };
          if (extra.teacherRemarks)    body.teacher_remarks   = extra.teacherRemarks;
          if (extra.attendancePresent) body.attendance_present = Number(extra.attendancePresent);
          if (extra.attendanceTotal)   body.attendance_total   = Number(extra.attendanceTotal);
          if (extra.position)          body.position           = Number(extra.position);
          if (extra.totalStudents)     body.total_students     = Number(extra.totalStudents);

          const r = await fetch(`/api/v1/admin/exams/${examId}/results`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!r.ok) throw new Error();
          setSavedRows((prev) => new Set(prev).add(studentId));
          setDirtyRows((prev) => { const n = new Set(prev); n.delete(studentId); return n; });
        } catch {
          errorCount++;
        }
      })
    );
    setSaving(false);
    if (errorCount === 0) {
      toast.success(`Saved ${toSave.length} student${toSave.length !== 1 ? "s" : ""}`);
    } else {
      toast.error(`${errorCount} row${errorCount !== 1 ? "s" : ""} failed to save`);
    }
    refetchResults();
  }

  async function handlePublish() {
    if (!selectedClass) return;
    setPublishing(true);
    try {
      const r = await fetch(`/api/v1/admin/exams/${examId}/results`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: selectedClass, action: "publish" }),
      });
      if (!r.ok) throw new Error();
      const json = await r.json();
      toast.success(`Published results for ${json.updated} student${json.updated !== 1 ? "s" : ""}`);
      refetchResults();
    } catch {
      toast.error("Failed to publish results");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Class selector + Save + Publish buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {!examClassName && (
          <>
            <Label className="text-sm shrink-0">Class</Label>
            <Select
              value={selectedClass || "__none__"}
              onValueChange={(v) => {
                setSelectedClass(v === "__none__" ? "" : v);
                setMarks({}); setDbMarks({}); setDirtyRows(new Set()); setSavedRows(new Set());
              }}
            >
              <SelectTrigger className="w-[180px] h-8 text-sm"><SelectValue placeholder="Select class…" /></SelectTrigger>
              <SelectContent>
                {availableClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
        {selectedClass && (
          <span className="text-xs text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""}
            {results.length > 0 && <> · {results.length} result{results.length !== 1 ? "s" : ""} in DB</>}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {dirtyRows.size > 0 && (
            <span className="text-xs text-amber-600 font-medium">{dirtyRows.size} unsaved</span>
          )}
          {savedRows.size > 0 && dirtyRows.size === 0 && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />{savedRows.size} saved
            </span>
          )}
          {results.length > 0 && (
            <Button
              size="sm"
              variant={unpublishedResults.length === 0 ? "outline" : "default"}
              className={cn("gap-1.5", unpublishedResults.length > 0 && "bg-green-600 hover:bg-green-700 text-white")}
              disabled={publishing || unpublishedResults.length === 0}
              onClick={handlePublish}
            >
              {publishing
                ? <><Loader2 className="size-3.5 animate-spin" />Publishing…</>
                : unpublishedResults.length === 0
                  ? <><CheckCircle2 className="size-3.5" />All published ({publishedCount})</>
                  : <><Globe className="size-3.5" />Publish ({unpublishedResults.length})</>}
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={dirtyRows.size === 0 || saving || !selectedClass}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {saving ? "Saving…" : `Save${dirtyRows.size > 0 ? ` (${dirtyRows.size})` : ""}`}
          </Button>
        </div>
      </div>

      {!selectedClass ? (
        <div className="rounded-xl border py-16 text-center text-sm text-muted-foreground">
          Select a class above to enter results.
        </div>
      ) : studentsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          No active students in {selectedClass}.
        </div>
      ) : classSubjects.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          No subjects in schedule{scheduleMode === "per_class" ? ` for ${selectedClass}` : ""}. Set up the schedule first.
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-14">Roll</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground min-w-[130px]">Name</th>
                {classSubjects.map((s) => (
                  <th key={s.id} className="text-center px-2 py-2.5 font-medium text-muted-foreground text-xs min-w-[72px]">
                    <div className="truncate max-w-[80px] mx-auto">{s.subject}</div>
                    <div className="font-normal text-muted-foreground/60 text-xs">/{s.full_marks ?? 100}</div>
                  </th>
                ))}
                <th className="w-8 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => {
                const isDirty   = dirtyRows.has(student.id);
                const isSaved   = savedRows.has(student.id);
                const isExpanded = expandedRows.has(student.id);
                const extra = { ...(dbExtra[student.id] ?? emptyExtra()), ...(extraInfo[student.id] ?? {}) };
                const colSpan = 2 + classSubjects.length + 1;
                return (
                  <>
                    <tr key={student.id} className={cn("hover:bg-muted/20", isDirty && "bg-amber-50/40")}>
                      <td className="px-3 py-2 text-muted-foreground text-xs font-mono">{student.roll_number ?? "—"}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-xs leading-tight truncate max-w-[130px]">{student.name_en}</p>
                        {student.section && <p className="text-xs text-muted-foreground leading-tight">{student.section}</p>}
                      </td>
                      {classSubjects.map((s) => (
                        <td key={s.id} className="px-1.5 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            max={s.full_marks ?? 100}
                            className="h-7 w-16 text-center text-xs font-medium"
                            value={marks[student.id]?.[s.subject] ?? dbMarks[student.id]?.[s.subject] ?? ""}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(student.id, s.subject, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center w-8">
                        <div className="flex flex-col items-center gap-0.5">
                          {saving && isDirty && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                          {isSaved && !isDirty && <CheckCircle2 className="size-3.5 text-green-500" />}
                          {!saving && !isSaved && existingResultMap.get(student.id) && (
                            <span
                              className={cn("block size-2 rounded-full", existingResultMap.get(student.id)!.published_at ? "bg-green-400" : "bg-gray-300")}
                              title={existingResultMap.get(student.id)!.published_at ? "Published" : "Saved, not published"}
                            />
                          )}
                          <button
                            onClick={() => toggleExpand(student.id)}
                            className="text-muted-foreground hover:text-foreground"
                            title={isExpanded ? "Hide details" : "Add remark / attendance / position"}
                          >
                            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${student.id}-extra`} className="bg-muted/10 border-b">
                        <td colSpan={colSpan} className="px-4 py-3 space-y-3">
                          {/* Per-subject remarks */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Subject Remarks</p>
                            <div className="space-y-1.5">
                              {classSubjects.map((s) => {
                                const obtained = marks[student.id]?.[s.subject] ?? dbMarks[student.id]?.[s.subject] ?? "";
                                const remark = subjectRemarks[student.id]?.[s.subject] ?? dbSubjectRemarks[student.id]?.[s.subject] ?? "";
                                return (
                                  <div key={s.id} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{s.subject}</span>
                                    <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">
                                      {obtained ? `${obtained}/${s.full_marks ?? 100}` : "—"}
                                    </span>
                                    <Input
                                      className="h-6 text-xs flex-1"
                                      placeholder="Remark (e.g. Excellent, Needs improvement…)"
                                      value={remark}
                                      onChange={(e) => handleRemarkChange(student.id, s.subject, e.target.value)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {/* Student-level extras */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-dashed">
                            <div className="sm:col-span-2">
                              <p className="text-xs text-muted-foreground mb-1">Teacher's Overall Remark</p>
                              <Input
                                className="h-7 text-xs"
                                placeholder="e.g. Excellent progress this term"
                                value={extra.teacherRemarks}
                                onChange={(e) => handleExtraChange(student.id, "teacherRemarks", e.target.value)}
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Attendance (Present / Total)</p>
                              <div className="flex gap-1">
                                <Input type="number" min={0} className="h-7 text-xs" placeholder="178"
                                  value={extra.attendancePresent}
                                  onChange={(e) => handleExtraChange(student.id, "attendancePresent", e.target.value)} />
                                <Input type="number" min={0} className="h-7 text-xs" placeholder="192"
                                  value={extra.attendanceTotal}
                                  onChange={(e) => handleExtraChange(student.id, "attendanceTotal", e.target.value)} />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Position (rank / of)</p>
                              <div className="flex gap-1">
                                <Input type="number" min={1} className="h-7 text-xs" placeholder="1"
                                  value={extra.position}
                                  onChange={(e) => handleExtraChange(student.id, "position", e.target.value)} />
                                <Input type="number" min={1} className="h-7 text-xs" placeholder="45"
                                  value={extra.totalStudents}
                                  onChange={(e) => handleExtraChange(student.id, "totalStudents", e.target.value)} />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [resultMode, setResultMode] = useState<"manual" | "3" | "7" | "14" | "custom">("manual");
  const [customDays, setCustomDays] = useState("30");
  const [resultDateInput, setResultDateInput] = useState("");
  const [savingResultDate, setSavingResultDate] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ exam: ExamDetail }>({
    queryKey: ["admin-exam", examId],
    queryFn: () => fetch(`/api/v1/admin/exams/${examId}`).then((r) => r.json()),
  });

  const exam = data?.exam;

  // Initialise result date state when exam data first arrives
  useEffect(() => {
    if (!exam) return;
    if (exam.result_days_after != null) {
      if ([3, 7, 14].includes(exam.result_days_after)) {
        setResultMode(String(exam.result_days_after) as "3" | "7" | "14");
      } else {
        setResultMode("custom");
        setCustomDays(String(exam.result_days_after));
      }
    } else {
      setResultMode("manual");
      if (exam.result_date) setResultDateInput(exam.result_date);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id]);

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

  async function saveResultDate() {
    setSavingResultDate(true);
    try {
      let body: Record<string, unknown>;
      if (resultMode === "manual") {
        body = { result_date: resultDateInput || null, result_days_after: null };
      } else {
        const n = resultMode === "custom" ? Number(customDays) : Number(resultMode);
        body = { result_days_after: n, result_date: computedResultDate ?? null };
      }
      const r = await fetch(`/api/v1/admin/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success("Result date saved");
      qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingResultDate(false);
    }
  }

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

  // Compute start/end from schedule entries
  const scheduleDates = exam.schedule.map((s) => s.exam_date).filter(Boolean).sort();
  const computedStart = scheduleDates[0] ?? exam.start_date;
  const computedEnd   = scheduleDates[scheduleDates.length - 1] ?? exam.end_date;

  // Compute result date from mode
  const computedResultDate = (() => {
    if (resultMode === "manual") return exam.result_date;
    const n = resultMode === "custom" ? Number(customDays) : Number(resultMode);
    if (!n || isNaN(n) || !computedEnd) return null;
    return addDaysToDateStr(computedEnd, n);
  })();

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
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              {exam.class_name ?? "All Classes"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {exam.academic_year}
            {exam.class_name ? <> · {exam.class_name}</> : <> · All Classes</>}
            {" · "}
            {exam.schedule_mode === "per_class" ? "Per-Class schedule" : "Shared schedule"}
            {computedStart && (
              <> · {new Date(computedStart).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}</>
            )}
            {computedEnd && computedEnd !== computedStart && (
              <> – {new Date(computedEnd).toLocaleDateString("en-BD", { day: "2-digit", month: "short" })}</>
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
          {
            icon: Calendar, label: "Starts",
            value: computedStart ? new Date(computedStart).toLocaleDateString("en-BD", { day: "2-digit", month: "short" }) : "—",
            color: "text-amber-600", bg: "bg-amber-50",
          },
          {
            icon: Calendar, label: "Ends",
            value: computedEnd ? new Date(computedEnd).toLocaleDateString("en-BD", { day: "2-digit", month: "short" }) : "—",
            color: "text-rose-600", bg: "bg-rose-50",
          },
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

      {/* Result date row */}
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-background flex-wrap">
        <Calendar className="size-4 text-muted-foreground shrink-0" />
        <Label className="text-sm shrink-0">Result Date</Label>
        <Select value={resultMode} onValueChange={(v: any) => setResultMode(v)}>
          <SelectTrigger className="h-8 w-[180px] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Set manually</SelectItem>
            <SelectItem value="3">3 days after exam</SelectItem>
            <SelectItem value="7">7 days after exam</SelectItem>
            <SelectItem value="14">14 days after exam</SelectItem>
            <SelectItem value="custom">Custom…</SelectItem>
          </SelectContent>
        </Select>
        {resultMode === "manual" && (
          <Input
            type="date"
            className="h-8 max-w-[160px] text-sm"
            value={resultDateInput}
            onChange={(e) => setResultDateInput(e.target.value)}
          />
        )}
        {resultMode === "custom" && (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              className="h-8 w-16 text-sm"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">days after</span>
          </div>
        )}
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={saveResultDate} disabled={savingResultDate}>
          {savingResultDate ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
        </Button>
        {computedResultDate && (
          <span className="text-xs text-muted-foreground">
            = {new Date(computedResultDate).toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )}
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
          <ScheduleTab
            examId={examId}
            examClassName={exam.class_name}
            schedule={exam.schedule}
            scheduleMode={exam.schedule_mode}
            refetch={() => refetch()}
          />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <ResultsTab
            examId={examId}
            examClassName={exam.class_name}
            schedule={exam.schedule}
            scheduleMode={exam.schedule_mode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
