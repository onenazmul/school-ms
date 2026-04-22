"use client";
// app/(teacher)/teacher/classes/[id]/page.tsx

import { use, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, TrendingUp, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

const MOCK_CLASS = { grade:"9", section:"A", room:"401", students:52, subject:"Mathematics" };

const MOCK_STUDENTS = [
  { id:"S001", name:"Rahim Uddin",   roll:"01", attendance:95, lastAbsent:"2025-05-10" },
  { id:"S002", name:"Fatema Begum",  roll:"02", attendance:88, lastAbsent:"2025-05-14" },
  { id:"S003", name:"Arif Hossain",  roll:"03", attendance:72, lastAbsent:"2025-05-17" },
  { id:"S004", name:"Mitu Begum",    roll:"04", attendance:98, lastAbsent:"2025-04-22" },
  { id:"S005", name:"Rashed Khan",   roll:"05", attendance:65, lastAbsent:"2025-05-18" },
  { id:"S006", name:"Sumaiya Islam", roll:"06", attendance:91, lastAbsent:"2025-05-08" },
  { id:"S007", name:"Kabir Ahmed",   roll:"07", attendance:83, lastAbsent:"2025-05-12" },
  { id:"S008", name:"Nusrat Jahan",  roll:"08", attendance:96, lastAbsent:"2025-04-30" },
];

const ATTENDANCE_HISTORY = [
  { date:"2025-05-18", present:49, absent:3, late:0 },
  { date:"2025-05-17", present:47, absent:4, late:1 },
  { date:"2025-05-16", present:51, absent:1, late:0 },
  { date:"2025-05-15", present:50, absent:2, late:0 },
  { date:"2025-05-14", present:48, absent:3, late:1 },
  { date:"2025-05-13", present:52, absent:0, late:0 },
  { date:"2025-05-12", present:49, absent:2, late:1 },
];

export default function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  function initials(name: string) {
    return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  }

  const avgAttendance = Math.round(MOCK_STUDENTS.reduce((s,st)=>s+st.attendance,0) / MOCK_STUDENTS.length);
  const lowAttendance = MOCK_STUDENTS.filter(s=>s.attendance < 75);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/classes" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />My Classes
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Class {MOCK_CLASS.grade}-{MOCK_CLASS.section}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">Class {MOCK_CLASS.grade}-{MOCK_CLASS.section} — {MOCK_CLASS.subject}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Room {MOCK_CLASS.room} · {MOCK_CLASS.students} students</p>
        </div>
        <Button asChild>
          <Link href="/teacher/attendance">Take Attendance</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Students",      value:MOCK_CLASS.students,            icon:Users,      color:"bg-indigo-50 text-indigo-600" },
          { label:"Avg Attendance",value:`${avgAttendance}%`,            icon:TrendingUp, color:"bg-green-50 text-green-600"   },
          { label:"Low Attendance",value:`${lowAttendance.length} students`, icon:XCircle,color:"bg-red-50 text-red-600"       },
          { label:"Classes This Month",value:"18",                       icon:Calendar,  color:"bg-amber-50 text-amber-600"    },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`size-9 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-semibold text-sm">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Low attendance alert */}
      {lowAttendance.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800 mb-2">
            ⚠️ {lowAttendance.length} student(s) with attendance below 75%
          </p>
          <div className="flex flex-wrap gap-2">
            {lowAttendance.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-red-200 text-xs">
                <span className="font-medium text-red-700">{s.name}</span>
                <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50 px-1.5">{s.attendance}%</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <div className="rounded-xl border overflow-x-auto bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Roll</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-48">Attendance</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MOCK_STUDENTS.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.roll}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-xs bg-slate-100">{initials(s.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.attendance >= 90 ? "bg-green-500" : s.attendance >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                               style={{ width: `${s.attendance}%` }} />
                        </div>
                        <span className={`text-xs font-medium w-8 ${s.attendance >= 90 ? "text-green-600" : s.attendance >= 75 ? "text-amber-600" : "text-red-600"}`}>
                          {s.attendance}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(s.lastAbsent).toLocaleDateString("en-BD",{day:"2-digit",month:"short"})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="rounded-xl border overflow-x-auto bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Present</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Absent</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Late</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-40">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ATTENDANCE_HISTORY.map(day => {
                  const total = day.present + day.absent + day.late;
                  const rate = Math.round((day.present / total) * 100);
                  return (
                    <tr key={day.date} className="hover:bg-muted/30">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(day.date).toLocaleDateString("en-BD",{weekday:"short",day:"2-digit",month:"short"})}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle2 className="size-3.5" />{day.present}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-red-600">
                          <XCircle className="size-3.5" />{day.absent}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-amber-600">
                          <Clock className="size-3.5" />{day.late}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rate >= 90 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs font-medium">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
