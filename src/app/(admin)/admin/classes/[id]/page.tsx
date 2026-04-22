"use client";
// app/(admin)/admin/classes/[id]/page.tsx

import { use, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, BookOpen, Search, Plus, Clock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MOCK_CLASS = {
  id: "C007", name: "9", section: "A", room: "401",
  classTeacher: { name: "Abdul Karim", subject: "Mathematics" },
  capacity: 55, students: 52,
};

const MOCK_STUDENTS = [
  { id:"S001", name:"Rahim Uddin",   roll:"01", gender:"Male",   guardian:"Kamal Uddin",  phone:"01712345678", status:"active" },
  { id:"S002", name:"Fatema Begum",  roll:"02", gender:"Female", guardian:"Rafiq Begum",  phone:"01712345679", status:"active" },
  { id:"S003", name:"Arif Hossain",  roll:"03", gender:"Male",   guardian:"Salam Hossain",phone:"01712345680", status:"active" },
  { id:"S004", name:"Mitu Begum",    roll:"04", gender:"Female", guardian:"Alam Begum",   phone:"01712345681", status:"active" },
  { id:"S005", name:"Rashed Khan",   roll:"05", gender:"Male",   guardian:"Selim Khan",   phone:"01712345682", status:"inactive" },
];

const MOCK_SUBJECTS = [
  { id:"SB1", name:"Mathematics",       teacher:"Abdul Karim",   periods:6 },
  { id:"SB2", name:"English",           teacher:"Rahela Khatun", periods:5 },
  { id:"SB3", name:"Bangla",            teacher:"Shirin Akter",  periods:5 },
  { id:"SB4", name:"Physics",           teacher:"Faruk Ahmed",   periods:4 },
  { id:"SB5", name:"Chemistry",         teacher:"Moinul Islam",  periods:4 },
  { id:"SB6", name:"Biology",           teacher:"Nasima Begum",  periods:3 },
  { id:"SB7", name:"ICT",               teacher:"TBA",           periods:2 },
  { id:"SB8", name:"Physical Education",teacher:"TBA",           periods:2 },
];

const MOCK_SCHEDULE = [
  { day:"Sunday",    periods:[
    { time:"8:00",  subject:"Mathematics", teacher:"Abdul Karim" },
    { time:"8:45",  subject:"English",     teacher:"Rahela Khatun" },
    { time:"9:30",  subject:"Bangla",      teacher:"Shirin Akter" },
    { time:"10:30", subject:"Physics",     teacher:"Faruk Ahmed" },
    { time:"11:15", subject:"Chemistry",   teacher:"Moinul Islam" },
  ]},
  { day:"Monday",    periods:[
    { time:"8:00",  subject:"English",     teacher:"Rahela Khatun" },
    { time:"8:45",  subject:"Mathematics", teacher:"Abdul Karim" },
    { time:"9:30",  subject:"Biology",     teacher:"Nasima Begum" },
    { time:"10:30", subject:"ICT",         teacher:"TBA" },
  ]},
  { day:"Tuesday",   periods:[
    { time:"8:00",  subject:"Bangla",      teacher:"Shirin Akter" },
    { time:"8:45",  subject:"Physics",     teacher:"Faruk Ahmed" },
    { time:"9:30",  subject:"Mathematics", teacher:"Abdul Karim" },
    { time:"10:30", subject:"Chemistry",   teacher:"Moinul Islam" },
    { time:"11:15", subject:"P.Education", teacher:"TBA" },
  ]},
];

const SUBJECT_COLORS = [
  "bg-indigo-50 text-indigo-700","bg-violet-50 text-violet-700","bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700","bg-rose-50 text-rose-700","bg-cyan-50 text-cyan-700",
  "bg-orange-50 text-orange-700","bg-teal-50 text-teal-700",
];

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cls = MOCK_CLASS;
  const [search, setSearch] = useState("");
  const occupancy = Math.round((cls.students / cls.capacity) * 100);

  const filtered = MOCK_STUDENTS.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.includes(search)
  );

  function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/classes" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />Classes
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Class {cls.name}-{cls.section}</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Pencil className="size-3.5" />Edit Class
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 flex-wrap">
        <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
          <BookOpen className="size-7 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Class {cls.name}-{cls.section}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Room {cls.room} · Class Teacher: {cls.classTeacher.name}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm">
              <Users className="size-4 text-muted-foreground" />
              {cls.students}/{cls.capacity} students
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${occupancy >= 95 ? "bg-red-500" : occupancy >= 85 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(occupancy, 100)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{occupancy}% full</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Students", value: cls.students },
            { label: "Subjects", value: MOCK_SUBJECTS.length },
            { label: "Periods/wk", value: MOCK_SUBJECTS.reduce((s,sub)=>s+sub.periods,0) },
          ].map(stat => (
            <div key={stat.label} className="bg-muted/40 rounded-xl px-4 py-3">
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Students tab */}
        <TabsContent value="students" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input className="pl-8 h-9 text-sm" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
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
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Guardian</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.roll}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">{initials(s.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{s.guardian}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{s.phone}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`text-xs ${s.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500"}`}>
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
          </div>
        </TabsContent>

        {/* Subjects tab */}
        <TabsContent value="subjects" className="mt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {MOCK_SUBJECTS.map((sub, i) => (
              <div key={sub.id} className="flex items-center gap-3 rounded-xl border p-4 bg-background hover:shadow-sm transition-shadow">
                <div className={`size-10 rounded-xl flex items-center justify-center text-xs font-bold ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}>
                  {sub.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.teacher}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-sm font-semibold">{sub.periods}</p>
                  <p className="text-xs text-muted-foreground">periods</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Schedule tab */}
        <TabsContent value="schedule" className="mt-4">
          <div className="space-y-4">
            {MOCK_SCHEDULE.map(day => (
              <div key={day.day}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{day.day}</h3>
                <div className="flex flex-wrap gap-2">
                  {day.periods.map((period, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
                      <span className="text-muted-foreground font-mono w-10 shrink-0">{period.time}</span>
                      <span className={`px-2 py-0.5 rounded-md font-medium ${SUBJECT_COLORS[MOCK_SUBJECTS.findIndex(s=>s.name.includes(period.subject.split(" ")[0])) % SUBJECT_COLORS.length] || "bg-slate-100 text-slate-600"}`}>
                        {period.subject}
                      </span>
                      <span className="text-muted-foreground">{period.teacher.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
