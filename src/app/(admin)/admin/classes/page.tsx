"use client";
// app/(admin)/admin/classes/page.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Users, BookOpen, ChevronRight, Loader2 } from "lucide-react";

const classSchema = z.object({
  name: z.string().min(1, "Class name required"),
  section: z.string().min(1, "Section required"),
  classTeacherId: z.string().min(1, "Assign a class teacher"),
  capacity: z.coerce.number().min(10).max(60),
  room: z.string().optional(),
});
type ClassInput = z.infer<typeof classSchema>;

const MOCK_CLASSES = [
  { id:"C001", name:"6", section:"A", classTeacher:"Shirin Akter",     students:42, capacity:45, room:"101", subjects:5 },
  { id:"C002", name:"6", section:"B", classTeacher:"Rahela Khatun",    students:38, capacity:45, room:"102", subjects:5 },
  { id:"C003", name:"7", section:"A", classTeacher:"Abdul Karim",      students:45, capacity:45, room:"201", subjects:6 },
  { id:"C004", name:"7", section:"B", classTeacher:"Shirin Akter",     students:41, capacity:45, room:"202", subjects:6 },
  { id:"C005", name:"8", section:"A", classTeacher:"Nasima Begum",     students:44, capacity:45, room:"301", subjects:7 },
  { id:"C006", name:"8", section:"B", classTeacher:"Faruk Ahmed",      students:39, capacity:45, room:"302", subjects:7 },
  { id:"C007", name:"9", section:"A", classTeacher:"Abdul Karim",      students:52, capacity:55, room:"401", subjects:8 },
  { id:"C008", name:"9", section:"B", classTeacher:"Moinul Islam",     students:48, capacity:55, room:"402", subjects:8 },
  { id:"C009", name:"10", section:"A", classTeacher:"Rahela Khatun",  students:55, capacity:55, room:"501", subjects:8 },
  { id:"C010", name:"10", section:"B", classTeacher:"Abdul Karim",    students:53, capacity:55, room:"502", subjects:8 },
];

const MOCK_TEACHERS = ["Abdul Karim","Rahela Khatun","Faruk Ahmed","Shirin Akter","Moinul Islam","Nasima Begum"];

const classGroups: Record<string, typeof MOCK_CLASSES> = {};
MOCK_CLASSES.forEach(c => {
  if (!classGroups[c.name]) classGroups[c.name] = [];
  classGroups[c.name].push(c);
});

function occupancyColor(students: number, capacity: number) {
  const pct = students / capacity;
  if (pct >= 1) return "text-red-600 bg-red-50";
  if (pct >= 0.9) return "text-amber-600 bg-amber-50";
  return "text-green-600 bg-green-50";
}

export default function ClassesPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const form = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: { name:"", section:"A", classTeacherId:"", capacity:45, room:"" },
  });

  async function onSubmit(values: ClassInput) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false); setOpen(false);
    toast.success(`Class ${values.name}-${values.section} created`);
  }

  const totalStudents = MOCK_CLASSES.reduce((s,c) => s + c.students, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Classes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MOCK_CLASSES.length} sections · {totalStudents} students
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="size-4" />New Class</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger></FormControl>
                        <SelectContent>{["1","2","3","4","5","6","7","8","9","10"].map(c=><SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="section" render={({ field }) => (
                    <FormItem><FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{["A","B","C","D"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="classTeacherId" render={({ field }) => (
                  <FormItem><FormLabel>Class Teacher</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger></FormControl>
                      <SelectContent>{MOCK_TEACHERS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="capacity" render={({ field }) => (
                    <FormItem><FormLabel>Capacity</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="room" render={({ field }) => (
                    <FormItem><FormLabel>Room No.</FormLabel>
                      <FormControl><Input placeholder="e.g. 201" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 mr-2 animate-spin" />}Create Class
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class groups */}
      <div className="space-y-6">
        {Object.entries(classGroups).map(([grade, sections]) => (
          <div key={grade}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Class {grade}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.map(cls => {
                const pct = Math.round((cls.students / cls.capacity) * 100);
                return (
                  <a
                    key={cls.id}
                    href={`/admin/classes/${cls.id}`}
                    className="block rounded-xl border bg-background p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="size-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <BookOpen className="size-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold">Class {cls.name}-{cls.section}</p>
                            <p className="text-xs text-muted-foreground">Room {cls.room}</p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="size-3" />{cls.students}/{cls.capacity} students
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${occupancyColor(cls.students, cls.capacity)}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 90 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>CT: {cls.classTeacher.split(" ")[0]}</span>
                      <span>{cls.subjects} subjects</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
