"use client";
// app/(student)/student/results/page.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth/client";
import {
  FileText, Download, ChevronDown, ChevronUp, Trophy,
  BookOpen, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubjectRow = {
  subject: string;
  subject_code: string | null;
  full_marks: number;
  obtained_marks: number;
  grade: string;
  remarks: string;
};

type ResultRow = {
  id: string;
  exam_id: string;
  exam_name: string;
  academic_year: string;
  subjects: SubjectRow[];
  total_obtained: number;
  total_max: number;
  gpa: number;
  position: number | null;
  total_students: number | null;
  pass: boolean | null;
  teacher_remarks: string | null;
  published_at: string;
};

function gpaColor(gpa: number) {
  if (gpa >= 5.0) return "text-green-700 bg-green-50 border-green-200";
  if (gpa >= 4.0) return "text-blue-700 bg-blue-50 border-blue-200";
  if (gpa >= 3.0) return "text-indigo-700 bg-indigo-50 border-indigo-200";
  if (gpa >= 2.0) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function subjectGPA(obtained: number, max: number): string {
  if (max === 0) return "—";
  const pct = (obtained / max) * 100;
  if (pct >= 80) return "5.00";
  if (pct >= 70) return "4.00";
  if (pct >= 60) return "3.50";
  if (pct >= 50) return "3.00";
  if (pct >= 40) return "2.00";
  if (pct >= 33) return "1.00";
  return "0.00";
}

function ResultCard({ result, studentId }: { result: ResultRow; studentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/documents/result-card/${studentId}?examId=${result.exam_id}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `result-card-${result.exam_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // swallow; user can retry
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-center gap-3 p-4">
          <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <BookOpen className="size-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{result.exam_name}</p>
            <p className="text-xs text-muted-foreground">{result.academic_year}</p>
          </div>

          {/* GPA badge */}
          <span className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-lg border",
            gpaColor(result.gpa)
          )}>
            GPA {result.gpa.toFixed(2)}
          </span>

          {/* Pass/Fail */}
          {result.pass !== null && (
            result.pass
              ? <CheckCircle2 className="size-4 text-green-600 shrink-0" />
              : <XCircle className="size-4 text-red-600 shrink-0" />
          )}
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-4 px-4 pb-3 text-xs text-muted-foreground border-b">
          <span>
            <span className="font-semibold text-foreground">{result.total_obtained}</span>
            {" / "}{result.total_max} marks
          </span>
          {result.position && result.total_students && (
            <span className="flex items-center gap-1">
              <Trophy className="size-3 text-amber-500" />
              Rank {result.position} of {result.total_students}
            </span>
          )}
          <span className="ml-auto">
            {new Date(result.published_at).toLocaleDateString("en-BD", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>
        </div>

        {/* Expanded subject table */}
        {expanded && result.subjects.length > 0 && (
          <div className="border-b overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Subject</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Full</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Obtained</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">GPA</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.subjects.map((s, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-2 font-medium">
                      {s.subject_code ? `${s.subject_code} — ` : ""}{s.subject}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{s.full_marks}</td>
                    <td className="px-3 py-2 text-right font-semibold">{s.obtained_marks}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-mono font-semibold text-indigo-700">{subjectGPA(s.obtained_marks, s.full_marks)}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground hidden sm:table-cell">
                      {s.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teacher remarks */}
        {expanded && result.teacher_remarks && (
          <div className="px-4 py-3 text-xs text-muted-foreground border-b bg-amber-50/40">
            <span className="font-semibold text-amber-800">Teacher's Remarks: </span>
            {result.teacher_remarks}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? "Hide details" : "Show details"}
          </button>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5 text-xs h-8"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? "Downloading…"
              : <><Download className="size-3.5" />Download PDF</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentResultsPage() {
  const { data: sessionData } = useSession();
  const userId = (sessionData?.user as any)?.id;

  const { data, isLoading } = useQuery<{ results: ResultRow[] }>({
    queryKey: ["student-results"],
    queryFn: () => fetch("/api/v1/student/me/results").then((r) => r.json()),
    enabled: !!userId,
  });

  const results = data?.results ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="size-5 text-indigo-600" />
            My Results
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Published exam results and report cards
          </p>
        </div>
        {results.length > 0 && (
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No published results yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Results will appear here once your teacher publishes them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <ResultCard key={r.id} result={r} studentId={userId ?? ""} />
          ))}
        </div>
      )}
    </div>
  );
}
