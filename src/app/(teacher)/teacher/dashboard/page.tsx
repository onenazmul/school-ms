"use client";
// app/(teacher)/teacher/dashboard/page.tsx

import { useSession } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, CheckSquare, TrendingUp } from "lucide-react";

const MOCK = {
  classes: [
    { name: "Class 9A", subject: "Mathematics", students: 42, nextClass: "Tomorrow 9:00 AM" },
    { name: "Class 10B", subject: "Mathematics", students: 38, nextClass: "Today 2:00 PM" },
    { name: "Class 8C", subject: "Mathematics", students: 45, nextClass: "Wednesday 10:00 AM" },
  ],
  todaySchedule: [
    { time: "8:00 AM", class: "9A", subject: "Mathematics", room: "Room 201" },
    { time: "10:00 AM", class: "10B", subject: "Mathematics", room: "Room 305" },
    { time: "2:00 PM", class: "8C", subject: "Mathematics", room: "Room 102" },
  ],
};

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Teacher";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Good morning, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "My Classes", value: 3, icon: BookOpen, color: "indigo" },
          { label: "Total Students", value: 125, icon: Users, color: "blue" },
          { label: "Today's Classes", value: 3, icon: CheckSquare, color: "green" },
          { label: "Avg. Attendance", value: "92%", icon: TrendingUp, color: "amber" },
        ].map((s) => {
          const Icon = s.icon;
          const colors: Record<string, string> = {
            indigo: "bg-indigo-50 text-indigo-600",
            blue: "bg-blue-50 text-blue-600",
            green: "bg-green-50 text-green-600",
            amber: "bg-amber-50 text-amber-600",
          };
          return (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-semibold mt-0.5">{s.value}</p>
                  </div>
                  <div className={`size-9 rounded-xl flex items-center justify-center ${colors[s.color]}`}>
                    <Icon className="size-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK.todaySchedule.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="text-center shrink-0 w-16">
                  <p className="text-xs font-semibold text-indigo-600">{s.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Class {s.class} · {s.room}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  Class {s.class}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My classes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK.classes.map((c, i) => (
              <a
                key={i}
                href={`/teacher/classes/${c.name.replace(" ", "-").toLowerCase()}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="size-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <BookOpen className="size-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.students} students · Next: {c.nextClass}
                  </p>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
