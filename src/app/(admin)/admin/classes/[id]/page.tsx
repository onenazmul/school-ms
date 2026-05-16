"use client";
// app/(admin)/admin/classes/[id]/page.tsx

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, BookOpen, Search, Plus } from "lucide-react";

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

// Keep static mock data for tabs not yet backed by an API
const SUBJECT_COLORS = [
  "bg-indigo-50 text-indigo-700","bg-violet-50 text-violet-700","bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700","bg-rose-50 text-rose-700","bg-cyan-50 text-cyan-700",
  "bg-orange-50 text-orange-700","bg-teal-50 text-teal-700",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
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

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Subjects tab — placeholder */}
        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
              Subject assignments coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
