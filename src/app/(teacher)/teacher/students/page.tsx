"use client";
// app/(teacher)/teacher/students/page.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const MOCK_STUDENTS = [
  { id:"S001", name:"Rahim Uddin",   class:"9",  section:"A", roll:"01", phone:"01712345678", attendance:95, grade:"A+" },
  { id:"S002", name:"Fatema Begum",  class:"9",  section:"A", roll:"02", phone:"01712345679", attendance:88, grade:"A" },
  { id:"S003", name:"Karim Hossain", class:"10", section:"A", roll:"01", phone:"01712345680", attendance:72, grade:"B" },
  { id:"S004", name:"Nasrin Akter",  class:"10", section:"A", roll:"02", phone:"01712345681", attendance:91, grade:"A+" },
  { id:"S005", name:"Jamal Sheikh",  class:"10", section:"B", roll:"01", phone:"01712345682", attendance:85, grade:"A" },
  { id:"S006", name:"Ruma Khatun",   class:"10", section:"B", roll:"02", phone:"01712345683", attendance:78, grade:"B+" },
];

const MY_CLASSES = ["9A","10A","10B"];

function attendanceBadge(pct: number) {
  if (pct >= 90) return "bg-green-50 text-green-700 border-green-200";
  if (pct >= 80) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const filtered = MOCK_STUDENTS.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const mc = classFilter==="all" || `${s.class}${s.section}`===classFilter;
    return ms && mc;
  });

  function initials(name: string) {
    return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Students</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{MOCK_STUDENTS.length} students across {MY_CLASSES.length} classes</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search students…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {MY_CLASSES.map(c=><SelectItem key={c} value={c}>Class {c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-x-auto bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Class</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Attendance</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">{initials(s.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {s.class}{s.section} · Roll {s.roll}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{s.phone}</td>
                <td className="py-3 px-4 text-center">
                  <Badge variant="outline" className={`text-xs ${attendanceBadge(s.attendance)}`}>{s.attendance}%</Badge>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-semibold text-sm">{s.grade}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
