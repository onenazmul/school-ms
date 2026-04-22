"use client";
// app/(teacher)/teacher/attendance/page.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Loader2, Save } from "lucide-react";

type Status = "present" | "absent" | "late";

const STUDENTS = [
  { id:"S001", name:"Rahim Uddin",   roll:"01" },
  { id:"S002", name:"Fatema Begum",  roll:"02" },
  { id:"S003", name:"Karim Hossain", roll:"03" },
  { id:"S004", name:"Nasrin Akter",  roll:"04" },
  { id:"S005", name:"Jamal Sheikh",  roll:"05" },
  { id:"S006", name:"Ruma Khatun",   roll:"06" },
  { id:"S007", name:"Arif Hossain",  roll:"07" },
  { id:"S008", name:"Mitu Begum",    roll:"08" },
];

const STATUS_CONFIG: Record<Status,{label:string;icon:any;buttonClass:string;activeClass:string}> = {
  present:{ label:"Present", icon:CheckCircle2, buttonClass:"hover:bg-green-50 hover:text-green-700 hover:border-green-300",  activeClass:"bg-green-50 text-green-700 border-green-300" },
  absent: { label:"Absent",  icon:XCircle,      buttonClass:"hover:bg-red-50 hover:text-red-700 hover:border-red-300",        activeClass:"bg-red-50 text-red-700 border-red-300" },
  late:   { label:"Late",    icon:Clock,        buttonClass:"hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300",  activeClass:"bg-amber-50 text-amber-700 border-amber-300" },
};

export default function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState("9A");
  const [attendance, setAttendance] = useState<Record<string,Status>>(
    Object.fromEntries(STUDENTS.map(s=>[s.id,"present"]))
  );
  const [saving, setSaving] = useState(false);

  function setStatus(id: string, status: Status) {
    setAttendance(prev => ({ ...prev, [id]: status }));
  }

  function markAll(status: Status) {
    setAttendance(Object.fromEntries(STUDENTS.map(s=>[s.id,status])));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r=>setTimeout(r,800));
    setSaving(false);
    toast.success("Attendance saved for " + selectedClass);
  }

  const counts = {
    present: Object.values(attendance).filter(v=>v==="present").length,
    absent:  Object.values(attendance).filter(v=>v==="absent").length,
    late:    Object.values(attendance).filter(v=>v==="late").length,
  };

  function initials(name: string) {
    return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Mark daily attendance</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Attendance
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Date</p>
              <input
                type="date"
                value={date}
                onChange={e=>setDate(e.target.value)}
                className="h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Class</p>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["9A","10A","10B"].map(c=><SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1.5 ml-auto">
              {(["present","absent","late"] as Status[]).map(s=>(
                <Button key={s} variant="outline" size="sm" className="text-xs h-8 capitalize" onClick={()=>markAll(s)}>
                  All {s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:"Present",count:counts.present,color:"text-green-600 bg-green-50"},
          {label:"Absent", count:counts.absent, color:"text-red-600 bg-red-50"},
          {label:"Late",   count:counts.late,   color:"text-amber-600 bg-amber-50"},
        ].map(s=>(
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
            <p className="text-2xl font-semibold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {STUDENTS.map(student => {
          const status = attendance[student.id];
          return (
            <div key={student.id} className="flex items-center gap-4 rounded-xl border p-3 bg-background">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="text-xs bg-slate-100 text-slate-700">{initials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{student.name}</p>
                <p className="text-xs text-muted-foreground">Roll {student.roll}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(["present","absent","late"] as Status[]).map(s=>{
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      onClick={()=>setStatus(student.id,s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? cfg.activeClass : `border-border text-muted-foreground ${cfg.buttonClass}`}`}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
