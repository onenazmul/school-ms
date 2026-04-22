"use client";
// app/(admin)/admin/teachers/[id]/page.tsx

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, BookOpen, Calendar, Pencil } from "lucide-react";

const MOCK_TEACHER = {
  id: "T001", name: "Abdul Karim", email: "akarim@school.edu", phone: "01711000001",
  subject: "Mathematics", designation: "Senior Teacher", qualification: "M.Sc. Mathematics, B.Ed.",
  joiningDate: "2018-03-01", status: "active",
  classes: [
    { id:"C007", name:"9", section:"A", students:52 },
    { id:"C009", name:"10", section:"A", students:55 },
    { id:"C010", name:"10", section:"B", students:53 },
  ],
  schedule: [
    { day:"Sunday",   time:"8:00 AM",  class:"9A",  room:"401" },
    { day:"Sunday",   time:"10:00 AM", class:"10A", room:"501" },
    { day:"Monday",   time:"8:45 AM",  class:"10B", room:"502" },
    { day:"Monday",   time:"10:30 AM", class:"9A",  room:"401" },
    { day:"Tuesday",  time:"9:30 AM",  class:"10A", room:"501" },
    { day:"Wednesday",time:"8:00 AM",  class:"9A",  room:"401" },
    { day:"Thursday", time:"9:00 AM",  class:"10B", room:"502" },
  ],
  stats: { totalStudents: 160, totalClasses: 3, weeklyPeriods: 18, avgAttendance: 91 },
};

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = MOCK_TEACHER;

  function initials(name: string) {
    return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  }

  const days = [...new Set(t.schedule.map(s=>s.day))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/teachers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />Teachers
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{t.name}</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Pencil className="size-3.5" />Edit
        </Button>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 flex-wrap">
        <Avatar className="size-16">
          <AvatarFallback className="text-xl font-semibold bg-violet-50 text-violet-700">{initials(t.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{t.name}</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{t.designation} · {t.subject}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="size-3" />{t.email}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{t.phone}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />Since {new Date(t.joiningDate).getFullYear()}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Students", value: t.stats.totalStudents },
            { label: "Classes", value: t.stats.totalClasses },
            { label: "Periods/wk", value: t.stats.weeklyPeriods },
            { label: "Avg Attend.", value: t.stats.avgAttendance + "%" },
          ].map(s => (
            <div key={s.label} className="bg-muted/40 rounded-xl px-3 py-3">
              <p className="text-lg font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            {t.classes.map(cls => (
              <Link key={cls.id} href={`/admin/classes/${cls.id}`} className="block rounded-xl border p-4 hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BookOpen className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Class {cls.name}-{cls.section}</p>
                    <p className="text-xs text-muted-foreground">{cls.students} students</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <div className="space-y-4">
            {days.map(day => {
              const periods = t.schedule.filter(s=>s.day===day);
              return (
                <div key={day}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{day}</h3>
                  <div className="flex flex-wrap gap-2">
                    {periods.map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm">
                        <span className="font-mono text-xs text-muted-foreground w-16">{p.time}</span>
                        <span className="font-medium">Class {p.class}</span>
                        <span className="text-xs text-muted-foreground">Room {p.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-5 space-y-1">
              {[
                ["Full Name",      t.name],
                ["Subject",        t.subject],
                ["Designation",    t.designation],
                ["Qualification",  t.qualification],
                ["Email",          t.email],
                ["Phone",          t.phone],
                ["Joining Date",   new Date(t.joiningDate).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})],
                ["Employee ID",    t.id],
              ].map(([k,v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-dashed last:border-0 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
