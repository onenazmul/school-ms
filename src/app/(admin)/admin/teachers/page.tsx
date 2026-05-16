"use client";
// app/(admin)/admin/teachers/page.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, MoreVertical, Pencil, Trash2, Mail, Phone, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  designation: string;
  qualification: string | null;
  joiningDate: string | null;
  classes: string[];
  status: string;
};

const SUBJECTS = ["Mathematics","English","Bangla","Physics","Chemistry","Biology","History","Geography","ICT","Physical Education"];

const teacherSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  subject: z.string().optional(),
  designation: z.string().min(1, "Designation required"),
  qualification: z.string().optional(),
  joiningDate: z.string().optional(),
});
type TeacherInput = z.infer<typeof teacherSchema>;

const colors = [
  "bg-indigo-50 text-indigo-700","bg-violet-50 text-violet-700","bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700","bg-rose-50 text-rose-700","bg-cyan-50 text-cyan-700",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Form ───────────────────────────────────────────────────────────────────────

function TeacherForm({ onSubmit, loading, defaultValues }: {
  onSubmit: (v: TeacherInput) => void;
  loading: boolean;
  defaultValues?: Partial<TeacherInput>;
}) {
  const form = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", designation: "Teacher", qualification: "", joiningDate: "", ...defaultValues },
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
              <FormControl><Input placeholder="01XXXXXXXXX" {...field} /></FormControl></FormItem>
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
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select></FormItem>
          )} />
          <FormField control={form.control} name="designation" render={({ field }) => (
            <FormItem><FormLabel>Designation</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["Teacher","Senior Teacher","Head of Dept.","Assistant Head","Principal"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
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
              <FormControl><Input type="date" {...field} /></FormControl></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full mt-1" disabled={loading}>
          {loading && <Loader2 className="size-4 mr-2 animate-spin" />} Save Teacher
        </Button>
      </form>
    </Form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<Teacher | null>(null);

  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (subjectFilter !== "all") params.set("subject", subjectFilter);

  const { data, isLoading } = useQuery<{ teachers: Teacher[] }>({
    queryKey: ["teachers", search, subjectFilter],
    queryFn: () => fetch(`/api/v1/admin/teachers?${params}`).then((r) => r.json()),
  });

  const teachers = data?.teachers ?? [];

  const createMutation = useMutation({
    mutationFn: (values: TeacherInput) =>
      fetch("/api/v1/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
        return r.json();
      }),
    onSuccess: (_, values) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setAddOpen(false);
      toast.success(`${values.name} added`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: (values: TeacherInput) =>
      fetch(`/api/v1/admin/teachers/${editTeacher!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setEditTeacher(null);
      toast.success("Teacher updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/admin/teachers/${id}`, { method: "DELETE" }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setDeleteTeacher(null);
      toast.success("Teacher removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Teachers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${teachers.length} teachers`}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="size-4" />Add Teacher</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Teacher</DialogTitle></DialogHeader>
            <TeacherForm onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search teachers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
            ))
          : teachers.map((teacher, i) => (
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
                        <DropdownMenuItem className="gap-2" onSelect={() => setEditTeacher(teacher)}>
                          <Pencil className="size-3.5" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => setDeleteTeacher(teacher)}>
                          <Trash2 className="size-3.5" />Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {teacher.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="size-3" />{teacher.email}
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="size-3" />{teacher.phone}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {teacher.subject && <Badge variant="secondary" className="text-xs">{teacher.subject}</Badge>}
                    {teacher.qualification && <span className="text-xs text-muted-foreground">{teacher.qualification}</span>}
                  </div>

                  {teacher.classes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {teacher.classes.map((c) => (
                        <span key={c} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{c}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className={`text-xs font-medium ${teacher.status === "active" ? "text-green-600" : "text-slate-400"}`}>
                      ● {teacher.status}
                    </span>
                    {teacher.joiningDate && (
                      <span className="text-xs text-muted-foreground">
                        Since {new Date(teacher.joiningDate).getFullYear()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && teachers.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No teachers found. Add one to get started.
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTeacher} onOpenChange={(open) => !open && setEditTeacher(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
          {editTeacher && (
            <TeacherForm
              onSubmit={(v) => editMutation.mutate(v)}
              loading={editMutation.isPending}
              defaultValues={{
                name: editTeacher.name,
                email: editTeacher.email ?? "",
                phone: editTeacher.phone ?? "",
                subject: editTeacher.subject ?? "",
                designation: editTeacher.designation,
                qualification: editTeacher.qualification ?? "",
                joiningDate: editTeacher.joiningDate ? editTeacher.joiningDate.split("T")[0] : "",
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTeacher} onOpenChange={(open) => !open && setDeleteTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTeacher?.name} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTeacher && deleteMutation.mutate(deleteTeacher.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
