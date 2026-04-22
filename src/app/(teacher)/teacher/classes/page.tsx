"use client";
// app/(teacher)/teacher/classes/page.tsx

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ChevronRight, Clock } from "lucide-react";

const MOCK_CLASSES = [
  {
    id:"C007", grade:"9", section:"A", room:"401", students:52,
    schedule:[
      {day:"Sunday",   time:"8:00 AM",  duration:"45 min"},
      {day:"Tuesday",  time:"10:00 AM", duration:"45 min"},
      {day:"Thursday", time:"8:00 AM",  duration:"45 min"},
    ],
    recentAttendance: 94,
  },
  {
    id:"C009", grade:"10", section:"A", room:"501", students:55,
    schedule:[
      {day:"Monday",    time:"9:00 AM",  duration:"45 min"},
      {day:"Wednesday", time:"11:00 AM", duration:"45 min"},
      {day:"Friday",    time:"9:00 AM",  duration:"45 min"},
    ],
    recentAttendance: 91,
  },
  {
    id:"C010", grade:"10", section:"B", room:"502", students:53,
    schedule:[
      {day:"Monday",    time:"11:00 AM", duration:"45 min"},
      {day:"Wednesday", time:"9:00 AM",  duration:"45 min"},
      {day:"Saturday",  time:"10:00 AM", duration:"45 min"},
    ],
    recentAttendance: 88,
  },
];

const TODAY = new Date().toLocaleDateString("en-US",{weekday:"long"});

export default function TeacherClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {MOCK_CLASSES.length} classes · {MOCK_CLASSES.reduce((s,c)=>s+c.students,0)} total students
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_CLASSES.map(cls => {
          const todayClass = cls.schedule.find(s=>s.day===TODAY);
          return (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <BookOpen className="size-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Class {cls.grade}-{cls.section}</h3>
                      <p className="text-sm text-muted-foreground">Room {cls.room} · Mathematics</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" />{cls.students} students
                        </span>
                        <span className={`text-xs font-medium ${cls.recentAttendance >= 90 ? "text-green-600" : cls.recentAttendance >= 80 ? "text-amber-600" : "text-red-600"}`}>
                          {cls.recentAttendance}% attendance
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {todayClass && (
                      <Badge className="bg-indigo-600 text-white text-xs gap-1">
                        <Clock className="size-3" />Today {todayClass.time}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/teacher/classes/${cls.id}`}>
                        View <ChevronRight className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Weekly Schedule</p>
                  <div className="flex flex-wrap gap-2">
                    {cls.schedule.map(s => (
                      <div key={s.day} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${s.day===TODAY ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-muted/30"}`}>
                        <span className="font-medium">{s.day.slice(0,3)}</span>
                        <span className="text-muted-foreground">{s.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
