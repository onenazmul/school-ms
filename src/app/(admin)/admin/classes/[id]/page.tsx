"use client";
// app/(admin)/admin/classes/[id]/page.tsx

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Users, BookOpen, Search, Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ClassDetail = {
  id: number;
  name: string;
  isActive: boolean;
  sections: { id: number; name: string; isActive: boolean }[];
};

type Student = {
  id: string;
  name: string;
  roll: string | null;
  section: string | null;
  gender: string | null;
  phone: string | null;
  status: string;
  enrolled_at: string;
};

type ClassResponse = {
  class: ClassDetail;
  total_students: number;
  active_students: number;
  students: Student[];
};

type MasterSubject = { id: number; name: string; code: string | null };
type ClassSubjectRow = {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string | null;
  default_full_marks: number | null;
  default_pass_marks: number | null;
  sort_order: number;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Class Subjects Tab ────────────────────────────────────────────────────────

function ClassSubjectsTab({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [addFullMarks, setAddFullMarks] = useState("100");
  const [addPassMarks, setAddPassMarks] = useState("33");
  const [editId, setEditId] = useState<number | null>(null);
  const [editFull, setEditFull] = useState("");
  const [editPass, setEditPass] = useState("");

  const toggleId = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const { data: csData, isLoading: csLoading } = useQuery<{ subjects: ClassSubjectRow[] }>({
    queryKey: ["class-subjects", classId],
    queryFn: () => fetch(`/api/v1/admin/classes/${classId}/subjects`).then((r) => r.json()),
  });

  const { data: masterData } = useQuery<{ subjects: MasterSubject[] }>({
    queryKey: ["admin-subjects"],
    queryFn: () => fetch("/api/v1/admin/subjects").then((r) => r.json()),
  });

  const classSubjects = csData?.subjects ?? [];
  const masterSubjects = masterData?.subjects ?? [];
  const assignedIds = new Set(classSubjects.map((cs) => cs.subject_id));
  const available = masterSubjects.filter((s) => !assignedIds.has(s.id));

  const addMutation = useMutation({
    mutationFn: async () => {
      for (const subjectId of Array.from(selectedIds)) {
        const r = await fetch(`/api/v1/admin/classes/${classId}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject_id: subjectId,
            default_full_marks: addFullMarks ? Number(addFullMarks) : null,
            default_pass_marks: addPassMarks ? Number(addPassMarks) : null,
          }),
        });
        if (!r.ok) throw new Error((await r.json()).message);
      }
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} subject${selectedIds.size !== 1 ? "s" : ""} added`);
      qc.invalidateQueries({ queryKey: ["class-subjects", classId] });
      setAddOpen(false);
      setSelectedIds(new Set()); setAddFullMarks("100"); setAddPassMarks("33");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, full, pass }: { id: number; full: string; pass: string }) =>
      fetch(`/api/v1/admin/classes/${classId}/subjects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_full_marks: full ? Number(full) : null,
          default_pass_marks: pass ? Number(pass) : null,
        }),
      }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["class-subjects", classId] });
      setEditId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/v1/admin/classes/${classId}/subjects/${id}`, { method: "DELETE" })
        .then(async (r) => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
    onSuccess: () => {
      toast.success("Subject removed");
      qc.invalidateQueries({ queryKey: ["class-subjects", classId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {classSubjects.length} subject{classSubjects.length !== 1 ? "s" : ""} assigned
        </p>
        <Button
          size="sm"
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => setAddOpen(true)}
          disabled={available.length === 0}
        >
          <Plus className="size-3.5" />Add Subject
        </Button>
      </div>

      {csLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      ) : classSubjects.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          No subjects assigned yet.{" "}
          {masterSubjects.length === 0
            ? "Add subjects in Settings → Subjects first."
            : "Click \"Add Subject\" to assign subjects from the master list."}
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Full Marks</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pass Marks</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {classSubjects.map((cs, idx) => (
                <tr key={cs.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{cs.subject_name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{cs.subject_code ?? "—"}</td>
                  {editId === cs.id ? (
                    <>
                      <td className="px-2 py-1.5">
                        <Input className="h-7 text-sm w-20" type="number" value={editFull}
                          onChange={(e) => setEditFull(e.target.value)} placeholder="100" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input className="h-7 text-sm w-20" type="number" value={editPass}
                          onChange={(e) => setEditPass(e.target.value)} placeholder="33" />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => updateMutation.mutate({ id: cs.id, full: editFull, pass: editPass })}
                            disabled={updateMutation.isPending}
                            className="text-green-600 hover:text-green-700 disabled:opacity-40"
                          >
                            {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </button>
                          <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="size-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 text-muted-foreground">{cs.default_full_marks ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{cs.default_pass_marks ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => { setEditId(cs.id); setEditFull(String(cs.default_full_marks ?? "")); setEditPass(String(cs.default_pass_marks ?? "")); }}
                            className="text-muted-foreground hover:text-indigo-600 transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Remove "${cs.subject_name}" from this class?`)) removeMutation.mutate(cs.id); }}
                            disabled={removeMutation.isPending}
                            className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setSelectedIds(new Set()); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Subjects to Class</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All subjects are already assigned to this class.</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Select Subjects *</Label>
                    <button
                      className="text-xs text-indigo-600 hover:underline"
                      onClick={() => setSelectedIds(new Set(available.map((s) => s.id)))}
                    >
                      Select all
                    </button>
                  </div>
                  <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
                    {available.map((s) => (
                      <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer">
                        <input
                          type="checkbox"
                          className="size-4 rounded accent-indigo-600"
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleId(s.id)}
                        />
                        <span className="text-sm font-medium flex-1">{s.name}</span>
                        {s.code && <span className="text-xs text-muted-foreground font-mono">{s.code}</span>}
                      </label>
                    ))}
                  </div>
                  {selectedIds.size > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedIds.size} subject{selectedIds.size !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full Marks (default)</Label>
                    <Input type="number" placeholder="100" value={addFullMarks}
                      onChange={(e) => setAddFullMarks(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pass Marks (default)</Label>
                    <Input type="number" placeholder="33" value={addPassMarks}
                      onChange={(e) => setAddPassMarks(e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setSelectedIds(new Set()); }}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedIds.size === 0 || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {selectedIds.size > 0 ? `Add ${selectedIds.size} Subject${selectedIds.size !== 1 ? "s" : ""}` : "Add Subjects"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");

  const params2 = new URLSearchParams();
  if (search) params2.set("q", search);
  if (sectionFilter !== "all") params2.set("section", sectionFilter);
  const qs = params2.toString() ? `?${params2.toString()}` : "";

  const { data, isLoading } = useQuery<ClassResponse>({
    queryKey: ["class-detail", id, search, sectionFilter],
    queryFn: () => fetch(`/api/v1/admin/classes/${id}${qs}`).then((r) => r.json()),
  });

  const cls = data?.class;
  const students = data?.students ?? [];
  const totalStudents = data?.total_students ?? 0;
  const activeStudents = data?.active_students ?? 0;
  const sections = cls?.sections ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/classes" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />Classes
          </Link>
          <span className="text-muted-foreground">/</span>
          {isLoading
            ? <Skeleton className="h-4 w-20" />
            : <span className="text-sm font-medium">Class {cls?.name}</span>}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 flex-wrap">
        <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
          <BookOpen className="size-7 text-indigo-600" />
        </div>
        <div className="flex-1">
          {isLoading
            ? <Skeleton className="h-6 w-32" />
            : <h1 className="text-xl font-semibold">Class {cls?.name}</h1>}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm">
              <Users className="size-4 text-muted-foreground" />
              {isLoading ? <Skeleton className="h-4 w-16" /> : `${activeStudents} active / ${totalStudents} total`}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          {[
            { label: "Total", value: totalStudents },
            { label: "Active", value: activeStudents },
          ].map((stat) => (
            <div key={stat.label} className="bg-muted/40 rounded-xl px-4 py-3">
              {isLoading
                ? <Skeleton className="h-7 w-10 mx-auto" />
                : <p className="text-xl font-semibold">{stat.value}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Subjects tab */}
        <TabsContent value="subjects" className="mt-4">
          <ClassSubjectsTab classId={id} />
        </TabsContent>

        {/* Students tab */}
        <TabsContent value="students" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {sections.length > 0 && (
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" className="gap-1.5 ml-auto" asChild>
              <Link href="/admin/students/new"><Plus className="size-3.5" />Add Student</Link>
            </Button>
          </div>

          <div className="rounded-xl border overflow-x-auto bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Roll</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Section</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-8" /></td>
                        <td className="py-3 px-4 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-5 w-10" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-5 w-14" /></td>
                        <td className="py-3 px-4" />
                      </tr>
                    ))
                  : students.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.roll ?? "—"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-7">
                              <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">{initials(s.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              {s.gender && <p className="text-xs text-muted-foreground">{s.gender}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {s.section
                            ? <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">{s.section}</Badge>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{s.phone ?? "—"}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-xs ${s.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500"}`}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="size-7" asChild>
                              <Link href={`/admin/students/${s.id}`}><Search className="size-3.5" /></Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!isLoading && students.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {search ? "No students match your search." : "No students in this class yet."}
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
