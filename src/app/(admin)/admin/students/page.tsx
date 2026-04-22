"use client";
// app/(admin)/admin/students/page.tsx

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Eye, Pencil, Trash2, Download } from "lucide-react";

const MOCK_STUDENTS = [
  { id: "S001", name: "Rahim Uddin", email: "rahim@student.edu", class: "9", section: "A", roll: "01", status: "active", joinedAt: "2024-01-15" },
  { id: "S002", name: "Fatema Begum", email: "fatema@student.edu", class: "6", section: "B", roll: "08", status: "active", joinedAt: "2024-01-20" },
  { id: "S003", name: "Karim Hossain", email: "karim@student.edu", class: "10", section: "C", roll: "14", status: "active", joinedAt: "2023-01-10" },
  { id: "S004", name: "Nasrin Akter", email: "nasrin@student.edu", class: "8", section: "A", roll: "05", status: "active", joinedAt: "2023-02-01" },
  { id: "S005", name: "Jamal Sheikh", email: "jamal@student.edu", class: "7", section: "B", roll: "11", status: "inactive", joinedAt: "2023-01-15" },
  { id: "S006", name: "Ruma Khatun", email: "ruma@student.edu", class: "5", section: "A", roll: "03", status: "active", joinedAt: "2024-03-05" },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || s.class === classFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MOCK_STUDENTS.length} total students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-4" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/admin/students/new">
              <Plus className="size-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search by name, ID, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {["1","2","3","4","5","6","7","8","9","10"].map((c) => (
              <SelectItem key={c} value={c}>Class {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Class</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                        {initials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                  {student.id}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                    Class {student.class}{student.section} · Roll {student.roll}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs">
                  {new Date(student.joinedAt).toLocaleDateString("en-BD", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant="outline"
                    className={student.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200 text-xs"
                      : "bg-slate-50 text-slate-500 border-slate-200 text-xs"}
                  >
                    {student.status}
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
                        <Link href={`/admin/students/${student.id}`} className="gap-2">
                          <Eye className="size-3.5" />View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/students/${student.id}/edit`} className="gap-2">
                          <Pencil className="size-3.5" />Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/finance/ledger?student=${student.id}`} className="gap-2">
                          <Eye className="size-3.5" />View Ledger
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="size-3.5" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No students match your search.
          </div>
        )}
      </div>
    </div>
  );
}
