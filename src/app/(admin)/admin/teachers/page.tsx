"use client";
// app/(admin)/admin/teachers/page.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, MoreVertical, Eye, Pencil, Trash2, Mail, Phone, Loader2 } from "lucide-react";

const SUBJECTS = ["Mathematics","English","Bangla","Physics","Chemistry","Biology","History","Geography","ICT","Physical Education"];

const teacherSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  subject: z.string().min(1, "Subject required"),
  designation: z.string().min(1, "Designation required"),
  qualification: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date required"),
});
type TeacherInput = z.infer<typeof teacherSchema>;

const MOCK_TEACHERS = [
  { id:"T001", name:"Abdul Karim",    email:"akarim@school.edu",   phone:"01711000001", subject:"Mathematics",  designation:"Senior Teacher",  qualification:"M.Sc.",  joiningDate:"2018-03-01", classes:["9A","10A","10B"], status:"active" },
  { id:"T002", name:"Rahela Khatun",  email:"rkhatun@school.edu",  phone:"01711000002", subject:"English",       designation:"Head of Dept.",   qualification:"M.A.",   joiningDate:"2015-07-15", classes:["7A","8A","8B"],  status:"active" },
  { id:"T003", name:"Faruk Ahmed",    email:"fahmed@school.edu",   phone:"01711000003", subject:"Physics",       designation:"Teacher",         qualification:"B.Sc.",  joiningDate:"2021-01-10", classes:["9B","9C"],        status:"active" },
  { id:"T004", name:"Shirin Akter",   email:"sakter@school.edu",   phone:"01711000004", subject:"Bangla",        designation:"Senior Teacher",  qualification:"M.A.",   joiningDate:"2017-06-01", classes:["6A","6B","7B"],   status:"active" },
  { id:"T005", name:"Moinul Islam",   email:"mislam@school.edu",   phone:"01711000005", subject:"Chemistry",     designation:"Teacher",         qualification:"M.Sc.",  joiningDate:"2022-03-15", classes:["9A","10C"],       status:"inactive" },
  { id:"T006", name:"Nasima Begum",   email:"nbegum@school.edu",   phone:"01711000006", subject:"Biology",       designation:"Teacher",         qualification:"M.Sc.",  joiningDate:"2020-08-01", classes:["8C","9B"],        status:"active" },
];

function TeacherForm({ onSubmit, loading, defaultValues }: {
  onSubmit: (v: TeacherInput) => void;
  loading: boolean;
  defaultValues?: Partial<TeacherInput>;
}) {
  const form = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name:"", email:"", phone:"", subject:"", designation:"Teacher", qualification:"", joiningDate:"", ...defaultValues },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="Abdul Karim" {...field} /></FormControl>
              <FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone</FormLabel>
              <FormControl><Input placeholder="01XXXXXXXXX" {...field} /></FormControl>
              <FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel>
            <FormControl><Input type="email" placeholder="teacher@school.edu" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem><FormLabel>Subject</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="designation" render={({ field }) => (
            <FormItem><FormLabel>Designation</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["Teacher","Senior Teacher","Head of Dept.","Assistant Head","Principal"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="qualification" render={({ field }) => (
            <FormItem><FormLabel>Qualification</FormLabel>
              <FormControl><Input placeholder="M.Sc., B.Ed." {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="joiningDate" render={({ field }) => (
            <FormItem><FormLabel>Joining Date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full mt-1" disabled={loading}>
          {loading && <Loader2 className="size-4 mr-2 animate-spin" />} Save Teacher
        </Button>
      </form>
    </Form>
  );
}

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = MOCK_TEACHERS.filter(t => {
    const m = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
    const s = subjectFilter === "all" || t.subject === subjectFilter;
    return m && s;
  });

  async function handleCreate(values: TeacherInput) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setOpen(false);
    toast.success(`${values.name} added as teacher`);
  }

  function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  }

  const colors = ["bg-indigo-50 text-indigo-700","bg-violet-50 text-violet-700","bg-emerald-50 text-emerald-700","bg-amber-50 text-amber-700","bg-rose-50 text-rose-700","bg-cyan-50 text-cyan-700"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Teachers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{MOCK_TEACHERS.length} total teachers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="size-4" />Add Teacher</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Teacher</DialogTitle></DialogHeader>
            <TeacherForm onSubmit={handleCreate} loading={loading} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search teachers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((teacher, i) => (
          <Card key={teacher.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className={`text-sm font-medium ${colors[i % colors.length]}`}>{initials(teacher.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.designation}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 -mr-1"><MoreVertical className="size-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Eye className="size-3.5" />View Profile</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><Pencil className="size-3.5" />Edit</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="size-3.5" />Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3" />{teacher.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3" />{teacher.phone}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">{teacher.subject}</Badge>
                <span className="text-xs text-muted-foreground">{teacher.qualification}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {teacher.classes.map(c => (
                  <span key={c} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{c}</span>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className={`text-xs font-medium ${teacher.status === "active" ? "text-green-600" : "text-slate-400"}`}>
                  ● {teacher.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Since {new Date(teacher.joiningDate).getFullYear()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
