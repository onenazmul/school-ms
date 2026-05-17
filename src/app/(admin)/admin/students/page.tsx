"use client";
// app/(admin)/admin/students/page.tsx

import { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function resolvePhotoUrl(p: string | null | undefined): string | null {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `/api/v1/uploads/${p}`;
}
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, MoreVertical, Eye, Download, Users, RefreshCw,
  ChevronLeft, ChevronRight, Settings2, GraduationCap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  admission_id: number;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  academic_year: string;
  session_name: string | null;
  status: string;
  enrolled_at: string;
  username: string | null;
  name_en: string;
  name_bn: string | null;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  guardian_name: string | null;
  guardian_mobile: string | null;
  guardian_relation: string | null;
  father_name: string | null;
  father_mobile: string | null;
  mother_name: string | null;
  mother_mobile: string | null;
  photo: string | null;
  present_zilla: string | null;
  present_upazilla: string | null;
};

type StudentsResponse = {
  students: Student[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

type SchoolClass = { id: string; name: string; isActive: boolean };

// ── Optional column definitions ───────────────────────────────────────────────

const OPTIONAL_COLS = [
  { key: "section",      label: "Section" },
  { key: "roll",         label: "Roll No" },
  { key: "academic",     label: "Academic Year" },
  { key: "session",      label: "Session" },
  { key: "dob",          label: "Date of Birth" },
  { key: "blood",        label: "Blood Group" },
  { key: "location",     label: "Location" },
  { key: "father",       label: "Father" },
  { key: "mother",       label: "Mother" },
] as const;

type OptColKey = (typeof OPTIONAL_COLS)[number]["key"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtAge(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age}y`;
}

function statusClass(s: string) {
  switch (s) {
    case "Active":      return "bg-green-50 text-green-700 border-green-200";
    case "Inactive":    return "bg-slate-50 text-slate-500 border-slate-200";
    case "Graduated":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "Transferred": return "bg-orange-50 text-orange-700 border-orange-200";
    default:            return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function exportCSV(students: Student[]) {
  const headers = [
    "ID", "Username", "Name (EN)", "Name (BN)", "Class", "Section", "Roll",
    "Academic Year", "Gender", "DOB", "Blood Group", "Guardian", "Guardian Mobile",
    "Father", "Father Mobile", "Mother", "Status", "Enrolled",
  ];
  const rows = students.map((s) => [
    s.id, s.username ?? "", s.name_en, s.name_bn ?? "", s.class_name,
    s.section ?? "", s.roll_number ?? "", s.academic_year, s.gender ?? "",
    s.dob ? fmtDate(s.dob) : "", s.blood_group ?? "",
    s.guardian_name ?? "", s.guardian_mobile ?? "",
    s.father_name ?? "", s.father_mobile ?? "",
    s.mother_name ?? "", s.status, fmtDate(s.enrolled_at),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function RowSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-b">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <Skeleton className="h-4 w-full max-w-24" />
            </td>
          ))}
          <td className="py-3 px-4"><Skeleton className="size-6 rounded" /></td>
        </tr>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUSES = ["Active", "Inactive", "Graduated", "Transferred"];

export default function StudentsPage() {
  const [search, setSearch]       = useState("");
  const [draftSearch, setDraft]   = useState("");
  const [classFilter, setClass]   = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [page, setPage]           = useState(1);
  const [visibleCols, setVisible] = useState<Set<OptColKey>>(new Set(["section", "roll"]));

  const commitSearch = useCallback(() => {
    setSearch(draftSearch);
    setPage(1);
  }, [draftSearch]);

  // ── classes (active only) ──────────────────────────────────────────────────
  const { data: classData } = useQuery<{ classes: SchoolClass[] }>({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/classes");
      if (!res.ok) throw new Error("Failed to load classes");
      return res.json();
    },
    staleTime: 60_000,
  });
  const activeClasses = (classData?.classes ?? []).filter((c) => c.isActive);

  // ── students ───────────────────────────────────────────────────────────────
  const buildQuery = () => {
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (classFilter !== "all") p.set("class", classFilter);
    if (statusFilter !== "all") p.set("status", statusFilter);
    p.set("page", String(page));
    p.set("limit", "20");
    return p.toString();
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery<StudentsResponse>({
    queryKey: ["admin-students", search, classFilter, statusFilter, page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/students?${buildQuery()}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    staleTime: 30_000,
  });

  const students   = data?.students ?? [];
  const pagination = data?.pagination;
  const loading    = isLoading || isFetching;

  function handleClassChange(v: string) { setClass(v); setPage(1); }
  function handleStatusChange(v: string) { setStatus(v); setPage(1); }

  function toggleCol(key: OptColKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // fixed cols count: Student + Class + Guardian/Phone + Status + Enrolled = 5
  // + each visible optional col
  const totalCols = 5 + visibleCols.size + 1; // +1 for actions

  const hasFilters = search || classFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="size-5 text-indigo-600" />
            Students
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination
              ? `${pagination.total.toLocaleString()} total students`
              : "Enrolled student records"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => exportCSV(students)}
          disabled={students.length === 0}
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Name, username, phone…"
                value={draftSearch}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitSearch()}
              />
            </div>

            {/* Class */}
            <Select value={classFilter} onValueChange={handleClassChange}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {activeClasses.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setDraft(""); setSearch(""); setClass("all");
                  setStatus("all"); setPage(1);
                }}
              >
                Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* Refresh */}
              <Button variant="ghost" size="icon" className="size-8" onClick={() => refetch()}>
                <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </Button>

              {/* Column toggle */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Settings2 className="size-3.5" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-44 p-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Optional columns
                  </p>
                  {OPTIONAL_COLS.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={visibleCols.has(key)}
                        onCheckedChange={() => toggleCol(key)}
                        className="size-3.5"
                      />
                      {label}
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {isError && (
        <div className="border rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Failed to load students.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <div className="rounded-xl border overflow-x-auto bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground font-medium">
                <th className="text-left py-2.5 px-4 whitespace-nowrap">Student</th>
                <th className="text-left py-2.5 px-4 whitespace-nowrap">Class</th>
                {visibleCols.has("section")  && <th className="text-left py-2.5 px-4">Section</th>}
                {visibleCols.has("roll")     && <th className="text-left py-2.5 px-4 whitespace-nowrap">Roll No</th>}
                {visibleCols.has("academic") && <th className="text-left py-2.5 px-4 whitespace-nowrap">Academic Year</th>}
                {visibleCols.has("session")  && <th className="text-left py-2.5 px-4">Session</th>}
                {visibleCols.has("dob")      && <th className="text-left py-2.5 px-4 whitespace-nowrap">Date of Birth</th>}
                {visibleCols.has("blood")    && <th className="text-left py-2.5 px-4 whitespace-nowrap">Blood</th>}
                {visibleCols.has("location") && <th className="text-left py-2.5 px-4">Location</th>}
                <th className="text-left py-2.5 px-4 whitespace-nowrap">Guardian</th>
                {visibleCols.has("father")   && <th className="text-left py-2.5 px-4">Father</th>}
                {visibleCols.has("mother")   && <th className="text-left py-2.5 px-4">Mother</th>}
                <th className="text-left py-2.5 px-4">Status</th>
                <th className="text-left py-2.5 px-4 whitespace-nowrap">Enrolled</th>
                <th className="py-2.5 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <RowSkeleton cols={totalCols - 1} />
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="py-16 text-center text-sm text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-30" />
                    <p>{hasFilters ? "No students match your filters." : "No enrolled students yet."}</p>
                    {hasFilters && (
                      <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                    )}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors group">
                    {/* Student name + avatar */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-8 shrink-0">
                          {resolvePhotoUrl(s.photo) && (
                            <AvatarImage src={resolvePhotoUrl(s.photo)!} alt={s.name_en} />
                          )}
                          <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                            {initials(s.name_en)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link href={`/admin/students/${s.id}`} className="font-medium truncate max-w-40 hover:text-indigo-600 hover:underline block">
                            {s.name_en}
                          </Link>
                          {s.name_bn && (
                            <p className="text-xs text-muted-foreground truncate max-w-40">{s.name_bn}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono">
                            {s.username ?? s.id}
                            {s.gender && (
                              <span className="ml-1 capitalize">· {s.gender}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-2.5 px-4">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {s.class_name}
                      </span>
                    </td>

                    {visibleCols.has("section") && (
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        {s.section ?? "—"}
                      </td>
                    )}
                    {visibleCols.has("roll") && (
                      <td className="py-2.5 px-4 text-xs font-mono text-muted-foreground">
                        {s.roll_number ?? "—"}
                      </td>
                    )}
                    {visibleCols.has("academic") && (
                      <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {s.academic_year}
                      </td>
                    )}
                    {visibleCols.has("session") && (
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        {s.session_name ?? "—"}
                      </td>
                    )}
                    {visibleCols.has("dob") && (
                      <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {s.dob ? (
                          <>
                            {fmtDate(s.dob)}
                            <span className="ml-1 text-xs opacity-60">{fmtAge(s.dob)}</span>
                          </>
                        ) : "—"}
                      </td>
                    )}
                    {visibleCols.has("blood") && (
                      <td className="py-2.5 px-4">
                        {s.blood_group ? (
                          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                            {s.blood_group}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    )}
                    {visibleCols.has("location") && (
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        {[s.present_upazilla, s.present_zilla].filter(Boolean).join(", ") || "—"}
                      </td>
                    )}

                    {/* Guardian */}
                    <td className="py-2.5 px-4 text-xs">
                      <div>{s.guardian_name ?? s.father_name ?? "—"}</div>
                      {(s.guardian_mobile ?? s.father_mobile) && (
                        <div className="text-muted-foreground">{s.guardian_mobile ?? s.father_mobile}</div>
                      )}
                    </td>

                    {visibleCols.has("father") && (
                      <td className="py-2.5 px-4 text-xs">
                        <div>{s.father_name ?? "—"}</div>
                        {s.father_mobile && <div className="text-muted-foreground">{s.father_mobile}</div>}
                      </td>
                    )}
                    {visibleCols.has("mother") && (
                      <td className="py-2.5 px-4 text-xs">
                        <div>{s.mother_name ?? "—"}</div>
                        {s.mother_mobile && <div className="text-muted-foreground">{s.mother_mobile}</div>}
                      </td>
                    )}

                    {/* Status */}
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className={`text-xs ${statusClass(s.status)}`}>
                        {s.status}
                      </Badge>
                    </td>

                    {/* Enrolled */}
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(s.enrolled_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            className="size-7 opacity-60 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/students/${s.id}`} className="gap-2 flex items-center">
                              <Eye className="size-3.5" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/admissions/${s.admission_id}`} className="gap-2 flex items-center text-muted-foreground">
                              <Eye className="size-3.5" /> View Admission
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
            {" · "}
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
