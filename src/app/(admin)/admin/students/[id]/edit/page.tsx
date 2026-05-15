"use client";
// app/(admin)/admin/students/[id]/edit/page.tsx

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentProfile = {
  id: string;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  academic_year: string;
  session_name: string | null;
  status: string;
  name_en: string;
};

type SchoolClass = { id: number; name: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDENT_STATUSES = ["Active", "Inactive", "Graduated", "Transferred"] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<{ student: StudentProfile }>({
    queryKey: ["admin-student", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/students/${id}`);
      if (!res.ok) throw new Error("Failed to load student");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: classesData } = useQuery<{ classes: SchoolClass[] }>({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/classes");
      if (!res.ok) throw new Error("Failed to load classes");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  const student = data?.student;
  const classes = classesData?.classes ?? [];

  // ── Form state ────────────────────────────────────────────────────────────
  const [className, setClassName]       = useState("");
  const [section, setSection]           = useState("");
  const [rollNumber, setRollNumber]     = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [sessionName, setSessionName]   = useState("");
  const [status, setStatus]             = useState<string>("");
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    if (student) {
      setClassName(student.class_name);
      setSection(student.section ?? "");
      setRollNumber(student.roll_number ?? "");
      setAcademicYear(student.academic_year);
      setSessionName(student.session_name ?? "");
      setStatus(student.status);
    }
  }, [student]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!className.trim() || !academicYear.trim() || !status) {
      toast.error("Class, Academic Year and Status are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name:    className.trim(),
          section:       section.trim() || null,
          roll_number:   rollNumber.trim() || null,
          academic_year: academicYear.trim(),
          session_name:  sessionName.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? "Failed to save");
      }

      toast.success("Student updated");
      qc.invalidateQueries({ queryKey: ["admin-student", id] });
      router.push(`/admin/students/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="space-y-4">
        <Link href={`/admin/students/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Profile
        </Link>
        <div className="border rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Failed to load student.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/students/${id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Edit Student</h1>
          <p className="text-sm text-muted-foreground">{student.name_en}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Academic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class */}
            <div className="space-y-1.5">
              <Label htmlFor="class_name">
                Class <span className="text-destructive">*</span>
              </Label>
              {classes.length > 0 ? (
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger id="class_name">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="class_name"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class Six"
                />
              )}
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
              />
            </div>

            {/* Roll Number */}
            <div className="space-y-1.5">
              <Label htmlFor="roll_number">Roll Number</Label>
              <Input
                id="roll_number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 42"
              />
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <Label htmlFor="academic_year">
                Academic Year <span className="text-destructive">*</span>
              </Label>
              <Input
                id="academic_year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026"
              />
            </div>

            {/* Session Name */}
            <div className="space-y-1.5">
              <Label htmlFor="session_name">Session</Label>
              <Input
                id="session_name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. January–December 2026"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/students/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="gap-1.5">
            <Save className="size-3.5" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
