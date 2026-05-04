"use client";
// app/(admin)/admin/students/page.tsx

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/admin-client";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, MoreVertical, Eye, Pencil, Download, Users, AlertTriangle, RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Student = {
  id: number;
  school_id: number;
  user_id: number | null;
  name_en: string;
  name_bn: string | null;
  name_ar: string | null;
  dob: string | null;
  birth_certificate_no: string | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  age: string | null;
  nationality: string | null;
  blood_group: string | null;
  identify_sign: string | null;
  present_village: string | null;
  present_post: string | null;
  present_upazilla: string | null;
  present_post_code: string | null;
  present_zilla: string | null;
  permanent_village: string | null;
  permanent_post: string | null;
  permanent_upazilla: string | null;
  permanent_zilla: string | null;
  permanent_post_code: string | null;
  father_name_en: string | null;
  father_name_bn: string | null;
  father_mobile_no: string | null;
  mother_name_en: string | null;
  mother_name_bn: string | null;
  mother_mobile_no: string | null;
  guardian_name: string | null;
  guardian_student_relation: string | null;
  guardian_mobile_no: string | null;
  guardian_occupation: string | null;
  class_name: string | null;
  session_name: string | null;
  division: string | null;
  previous_institute_name: string | null;
  sibling_details: string | null;
  student_photo: string | null;
  student_signature: string | null;
  status: string | null;
  application_fee: string;
  payment_tracking_id: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
};

type StudentsResponse = {
  students: {
    current_page: number;
    data: Student[];
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://sms-api.chalanbeel.com/api";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function resolvePhotoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE.replace("/api", "")}${path}`;
}

function statusBadgeClass(status: string | null) {
  switch (status) {
    case "Paid":    return "bg-green-50 text-green-700 border-green-200";
    case "Enrolled": return "bg-green-50 text-green-700 border-green-200";
    case null:
    default:        return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function exportCSV(list: Student[]) {
  const headers = [
    "Username", "Name (EN)", "Name (BN)", "Class", "Session", "Division",
    "Gender", "Blood Group", "Guardian", "Guardian Phone", "Joined",
  ];
  const rows = list.map((s) => [
    s.username ?? s.id,
    s.name_en,
    s.name_bn ?? "",
    s.class_name ?? "",
    s.session_name ?? "",
    s.division ?? "",
    s.gender ?? "",
    s.blood_group ?? "",
    s.guardian_name ?? "",
    s.guardian_mobile_no ?? "",
    fmtDate(s.created_at),
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

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-16" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-24" /></td>
          <td className="py-3 px-4"><Skeleton className="h-3.5 w-16" /></td>
          <td className="py-3 px-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
          <td className="py-3 px-4"><Skeleton className="size-6" /></td>
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.laravelToken as string | undefined;

  const [search, setSearch]           = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery<StudentsResponse>({
    queryKey: ["admin-students", token ?? ""],
    queryFn: () => api.get<StudentsResponse>(EP.ADMIN_STUDENTS, token, { per_page: 500 }),
    staleTime: 30_000,
  });

  const allStudents = data?.students?.data ?? [];

  const filtered = useMemo(() => {
    let list = allStudents;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s) =>
        s.name_en.toLowerCase().includes(q) ||
        (s.name_bn ?? "").toLowerCase().includes(q) ||
        (s.username ?? "").toLowerCase().includes(q) ||
        (s.guardian_name ?? "").toLowerCase().includes(q) ||
        (s.guardian_mobile_no ?? "").includes(q) ||
        String(s.id).includes(q)
      );
    }

    if (classFilter !== "all") {
      list = list.filter((s) =>
        (s.class_name ?? "").toLowerCase() === classFilter.toLowerCase()
      );
    }

    if (genderFilter !== "all") {
      list = list.filter((s) =>
        (s.gender ?? "").toLowerCase() === genderFilter.toLowerCase()
      );
    }

    return list;
  }, [allStudents, search, classFilter, genderFilter]);

  // Derive unique class names from the data for the filter dropdown
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach((s) => { if (s.class_name) set.add(s.class_name); });
    return Array.from(set).sort();
  }, [allStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="size-5 text-indigo-600" />
            Students
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading students…"
              : `${filtered.length} of ${allStudents.length} students`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search by name, ID, username, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-28 h-9 text-sm">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {isError && (
        <div className="border rounded-xl p-10 text-center space-y-3">
          <AlertTriangle className="size-9 text-amber-500 mx-auto" />
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
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Username</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Class</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Division</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Guardian</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                    {allStudents.length === 0
                      ? "No students found."
                      : "No students match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  const photoUrl = resolvePhotoUrl(student.student_photo);
                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            {photoUrl && <AvatarImage src={photoUrl} alt={student.name_en} />}
                            <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                              {initials(student.name_en)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-36">{student.name_en}</p>
                            {student.name_bn && (
                              <p className="text-xs text-muted-foreground truncate max-w-36">{student.name_bn}</p>
                            )}
                            {student.gender && (
                              <p className="text-xs text-muted-foreground capitalize">{student.gender}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {student.username ?? `#${student.id}`}
                      </td>
                      <td className="py-3 px-4">
                        {student.class_name ? (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {student.class_name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {student.division ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground truncate max-w-28">
                            {student.guardian_name ?? student.father_name_en ?? "—"}
                          </p>
                          {student.guardian_mobile_no && (
                            <p className="text-xs text-muted-foreground">{student.guardian_mobile_no}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(student.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClass(student.status)}`}
                        >
                          {student.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/students/${student.id}`} className="gap-2 flex items-center">
                                <Eye className="size-3.5" /> View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/students/${student.id}/edit`} className="gap-2 flex items-center">
                                <Pencil className="size-3.5" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/finance/ledger?student=${student.id}`} className="gap-2 flex items-center">
                                <Eye className="size-3.5" /> View Ledger
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
