"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BookOpen, Plus, ChevronRight, Calendar, Users, FileText, Loader2,
} from "lucide-react";

type Exam = {
  id: string;
  name: string;
  academic_year: string;
  class_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "published";
  schedule_count: number;
  result_count: number;
  created_at: string;
};

type ApiClass = { id: string; name: string };

function statusBadge(status: string) {
  return status === "published"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
}

export default function ExamsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery<{ exams: Exam[] }>({
    queryKey: ["admin-exams"],
    queryFn: () => fetch("/api/v1/admin/exams").then((r) => r.json()),
  });

  const { data: classesData } = useQuery<{ classes: ApiClass[] }>({
    queryKey: ["classes-for-docs"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });

  const { data: settingsData } = useQuery<{ setting: { academic_year: string } }>({
    queryKey: ["school-setting"],
    queryFn: () => fetch("/api/v1/admin/settings").then((r) => r.json()),
  });

  const exams = data?.exams ?? [];
  const classes = classesData?.classes ?? [];
  const settingsYear = settingsData?.setting?.academic_year ?? "";

  const [form, setForm] = useState({ name: "", academic_year: "", class_name: "", schedule_mode: "shared" });

  // Prefill academic_year when settings load
  if (settingsYear && !form.academic_year) {
    setForm((f) => ({ ...f, academic_year: settingsYear }));
  }

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/v1/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, class_name: body.class_name || null }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      }),
    onSuccess: (data) => {
      toast.success("Exam created — set up the schedule");
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
      setCreateOpen(false);
      setForm({ name: "", academic_year: settingsYear, class_name: "", schedule_mode: "shared" });
      router.push(`/admin/exams/${data.exam.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="size-5 text-indigo-600" />
            Exams & Results
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage exam schedules and enter student results
          </p>
        </div>
        <Button
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New Exam
        </Button>
      </div>

      {/* Exam list */}
      <div className="rounded-xl border overflow-hidden bg-background">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No exams yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/admin/exams/${exam.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="size-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <BookOpen className="size-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{exam.name}</p>
                  <div className="flex items-center flex-wrap gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{exam.academic_year}</span>
                    {exam.class_name ? (
                      <span className="text-xs text-muted-foreground">{exam.class_name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">All Classes</span>
                    )}
                    {exam.start_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(exam.start_date).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
                        {exam.end_date && ` – ${new Date(exam.end_date).toLocaleDateString("en-BD", { day: "2-digit", month: "short" })}`}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="size-3" />
                      {exam.schedule_count} subject{exam.schedule_count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="size-3" />
                      {exam.result_count} result{exam.result_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${statusBadge(exam.status)}`}>
                  {exam.status}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Exam Name *</Label>
              <Input
                placeholder="e.g. Annual Examination 2025-26"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Academic Year *</Label>
              <Input
                placeholder="e.g. 2025-26"
                value={form.academic_year}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select
                value={form.class_name || "all"}
                onValueChange={(v) => setForm((f) => ({ ...f, class_name: v === "all" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes (auto-load all subjects)</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Schedule Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["shared", "per_class"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, schedule_mode: mode }))}
                    className={cn(
                      "py-2 rounded-lg border text-sm font-medium transition-colors",
                      form.schedule_mode === mode
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-background hover:bg-muted/50 text-foreground"
                    )}
                  >
                    {mode === "shared" ? "Shared" : "Per-Class"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.schedule_mode === "shared"
                  ? "One date/time per subject, applies to all classes."
                  : "Each class has its own separate timetable per subject."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!form.name || !form.academic_year || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? <><Loader2 className="size-4 animate-spin mr-2" />Creating…</> : "Create & Set Up Schedule →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
