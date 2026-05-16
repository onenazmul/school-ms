"use client";
// app/(admin)/admin/students/new/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, CheckCircle2, Copy, Check, Printer, Eye, EyeOff, GraduationCap,
} from "lucide-react";

// ── Types / constants ─────────────────────────────────────────────────────────

type ClassItem = { id: number; name: string; sections: { id: number; name: string }[] };
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DIVISIONS = ["আবাসিক", "অনবাসিক", "ক্যাডেট", "হিফজুল কুরআন"];

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  // Student
  name_en:   z.string().min(2, "Full name required"),
  name_bn:   z.string().optional(),
  name_ar:   z.string().optional(),
  dob:       z.string().min(1, "Date of birth required"),
  gender:    z.enum(["Male", "Female"], { required_error: "Select gender" }),
  age:       z.string().optional(),
  blood_group:       z.string().optional(),
  nationality:       z.string().optional(),
  height:            z.string().optional(),
  weight:            z.string().optional(),
  birth_certificate_no: z.string().optional(),
  identify_sign:     z.string().optional(),
  // Academic
  class_name:    z.string().min(1, "Select a class"),
  section:       z.string().optional(),
  roll_number:   z.string().optional(),
  academic_year: z.string().min(4, "Academic year required"),
  session_name:  z.string().optional(),
  division:      z.string().optional(),
  previous_institute_name: z.string().optional(),
  sibling_details:         z.string().optional(),
  // Present address
  present_village:   z.string().min(1, "Village/Moholla required"),
  present_post:      z.string().optional(),
  present_post_code: z.string().optional(),
  present_upazilla:  z.string().min(1, "Upazilla required"),
  present_zilla:     z.string().min(1, "District required"),
  // Permanent address
  permanent_village:   z.string().optional(),
  permanent_post:      z.string().optional(),
  permanent_post_code: z.string().optional(),
  permanent_upazilla:  z.string().optional(),
  permanent_zilla:     z.string().optional(),
  // Father
  father_name_en: z.string().optional(),
  father_name_bn: z.string().optional(),
  father_mobile_no:       z.string().optional(),
  father_nid_no:          z.string().optional(),
  father_dob:             z.string().optional(),
  father_education:       z.string().optional(),
  father_occupation:      z.string().optional(),
  father_monthly_earning: z.string().optional(),
  // Mother
  mother_name_en: z.string().optional(),
  mother_name_bn: z.string().optional(),
  mother_mobile_no:       z.string().optional(),
  mother_nid_no:          z.string().optional(),
  mother_dob:             z.string().optional(),
  mother_education:       z.string().optional(),
  mother_occupation:      z.string().optional(),
  mother_monthly_earning: z.string().optional(),
  // Guardian
  guardian_name:             z.string().min(1, "Guardian name required"),
  guardian_student_relation: z.string().optional(),
  guardian_mobile_no:        z.string().min(1, "Guardian phone required"),
  guardian_nid_no:           z.string().optional(),
  guardian_dob:              z.string().optional(),
  guardian_education:        z.string().optional(),
  guardian_occupation:       z.string().optional(),
  guardian_monthly_earning:  z.string().optional(),
  guardian_present_address:  z.string().optional(),
  guardian_permanent_address:z.string().optional(),
  // Password
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormInput = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Sec({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 whitespace-nowrap">
        {title}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={show ? "text" : "password"} className="pr-10" {...props} />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono font-semibold mt-0.5">{value}</p>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="p-1.5 rounded-md hover:bg-white/60 transition-colors text-indigo-600"
      >
        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

// ── Success panel ─────────────────────────────────────────────────────────────

type CreatedStudent = {
  id: string; username: string; name_en: string;
  class_name: string; section: string | null;
  academic_year: string; roll_number: string | null;
};

function SuccessPanel({ student, password }: { student: CreatedStudent; password: string }) {
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="size-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-2">
          <GraduationCap className="size-6" />
        </div>
        <h2 className="font-bold text-lg">Student Added Successfully</h2>
      </div>

      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <CheckCircle2 className="size-10 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-800">{student.name_en} has been enrolled</p>
        <p className="text-sm text-green-700 mt-1">
          Class {student.class_name}{student.section ? `-${student.section}` : ""} · {student.academic_year}
        </p>
      </div>

      {/* Credentials */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Login Credentials</p>
        <div className="divide-y divide-indigo-100">
          <CopyField label="Username" value={student.username} />
          <CopyField label="Password" value={password} />
        </div>
        <p className="text-[11px] text-indigo-600 pt-2">
          Share these with the student — the password cannot be viewed again after leaving this page.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-background p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Enrollment Summary</p>
        {[
          ["Student ID",     student.id],
          ["Student Name",   student.name_en],
          ["Class",          `${student.class_name}${student.section ? `-${student.section}` : ""}`],
          ["Roll Number",    student.roll_number ?? "—"],
          ["Academic Year",  student.academic_year],
          ["Username",       student.username],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium font-mono text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
          <Printer className="size-4" />Print
        </Button>
        <Link href="/admin/students" className="flex-1 inline-flex items-center justify-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
          Back to Students →
        </Link>
      </div>
      <div className="text-center">
        <Link href="/admin/students/new" className="text-sm text-indigo-600 hover:underline" onClick={() => window.location.reload()}>
          Add another student
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewStudentPage() {
  const [created, setCreated] = useState<{ student: CreatedStudent; password: string } | null>(null);
  const [samePerm, setSamePerm] = useState(false);

  const { data: classesData } = useQuery<{ classes: ClassItem[] }>({
    queryKey: ["classes-list"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const classes = classesData?.classes ?? [];

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name_en: "", name_bn: "", name_ar: "",
      dob: "", gender: undefined, age: "",
      blood_group: "", nationality: "Bangladeshi",
      height: "", weight: "", birth_certificate_no: "", identify_sign: "",
      class_name: "", section: "", roll_number: "",
      academic_year: String(new Date().getFullYear()),
      session_name: "", division: "",
      previous_institute_name: "", sibling_details: "",
      present_village: "", present_post: "", present_post_code: "",
      present_upazilla: "", present_zilla: "",
      permanent_village: "", permanent_post: "", permanent_post_code: "",
      permanent_upazilla: "", permanent_zilla: "",
      father_name_en: "", father_name_bn: "", father_mobile_no: "",
      father_nid_no: "", father_dob: "", father_education: "",
      father_occupation: "", father_monthly_earning: "",
      mother_name_en: "", mother_name_bn: "", mother_mobile_no: "",
      mother_nid_no: "", mother_dob: "", mother_education: "",
      mother_occupation: "", mother_monthly_earning: "",
      guardian_name: "", guardian_student_relation: "", guardian_mobile_no: "",
      guardian_nid_no: "", guardian_dob: "", guardian_education: "",
      guardian_occupation: "", guardian_monthly_earning: "",
      guardian_present_address: "", guardian_permanent_address: "",
      password: "",
    },
  });

  const watchedClassName = form.watch("class_name");
  const selectedClass = classes.find((c) => c.name === watchedClassName);
  const availableSections = selectedClass?.sections ?? [];

  function handleSamePerm(checked: boolean) {
    setSamePerm(checked);
    if (checked) {
      const v = form.getValues();
      form.setValue("permanent_village",   v.present_village   ?? "");
      form.setValue("permanent_post",      v.present_post      ?? "");
      form.setValue("permanent_upazilla",  v.present_upazilla  ?? "");
      form.setValue("permanent_zilla",     v.present_zilla     ?? "");
      form.setValue("permanent_post_code", v.present_post_code ?? "");
    }
  }

  const mutation = useMutation({
    mutationFn: (values: FormInput) =>
      fetch("/api/v1/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message ?? "Failed to create student");
        return data;
      }),
    onSuccess: (data, values) => {
      setCreated({ student: data.student, password: values.password });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (created) {
    return (
      <div className="py-6">
        <SuccessPanel student={created.student} password={created.password} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/students" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />Back
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-xl font-semibold">Add New Student</h1>
      </div>

      <div className="rounded-xl border bg-background p-5 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5">

            {/* ── Student Information ─────────────────────────────────── */}
            <Sec title="Student Information" />
            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="name_en" render={({ field }) => (
                <FormItem className="col-span-3 sm:col-span-1">
                  <FormLabel>Name (English) <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name_bn" render={({ field }) => (
                <FormItem className="col-span-3 sm:col-span-1">
                  <FormLabel>Name (Bengali)</FormLabel>
                  <FormControl><Input placeholder="বাংলায় নাম" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="name_ar" render={({ field }) => (
                <FormItem className="col-span-3 sm:col-span-1">
                  <FormLabel>Name (Arabic)</FormLabel>
                  <FormControl><Input placeholder="الاسم" dir="rtl" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g. 12" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="blood_group" render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField control={form.control} name="nationality" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality</FormLabel>
                  <FormControl><Input placeholder="Bangladeshi" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="height" render={({ field }) => (
                <FormItem>
                  <FormLabel>Height</FormLabel>
                  <FormControl><Input placeholder="e.g. 4ft 5in" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <FormControl><Input placeholder="e.g. 45 kg" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="birth_certificate_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Cert. No.</FormLabel>
                  <FormControl><Input placeholder="Certificate no." {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="identify_sign" render={({ field }) => (
              <FormItem>
                <FormLabel>Identifying Sign</FormLabel>
                <FormControl><Input placeholder="e.g. mole on left cheek" {...field} /></FormControl>
              </FormItem>
            )} />

            {/* ── Academic Details ────────────────────────────────────── */}
            <Sec title="Academic Details" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="class_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("section", "");
                    }}
                    value={field.value}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={c.name}>Class {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="section" render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  {availableSections.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableSections.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl><Input placeholder="e.g. A, B, Science" {...field} /></FormControl>
                  )}
                </FormItem>
              )} />
              <FormField control={form.control} name="roll_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number</FormLabel>
                  <FormControl><Input placeholder="e.g. 01" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="academic_year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="2025" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="session_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Session</FormLabel>
                  <FormControl><Input placeholder="e.g. 2025–26" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="division" render={({ field }) => (
                <FormItem>
                  <FormLabel>Division</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="previous_institute_name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Previous Institute</FormLabel>
                  <FormControl><Input placeholder="Previous school name" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="sibling_details" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sibling Details</FormLabel>
                  <FormControl><Input placeholder="e.g. 1 sibling in Class 5" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* ── Present Address ─────────────────────────────────────── */}
            <Sec title="Present Address" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="present_village" render={({ field }) => (
                <FormItem>
                  <FormLabel>Village/Moholla <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Village" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="present_post" render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Office</FormLabel>
                  <FormControl><Input placeholder="Post office" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="present_post_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Code</FormLabel>
                  <FormControl><Input placeholder="e.g. 6400" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="present_upazilla" render={({ field }) => (
                <FormItem>
                  <FormLabel>Upazilla <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Upazilla" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="present_zilla" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Zilla (District) <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="District" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ── Permanent Address ───────────────────────────────────── */}
            <Sec title="Permanent Address" />
            <div className="flex items-center gap-2">
              <Checkbox
                id="same-perm"
                checked={samePerm}
                onCheckedChange={(v) => handleSamePerm(Boolean(v))}
              />
              <label htmlFor="same-perm" className="text-sm text-muted-foreground cursor-pointer select-none">
                Same as present address
              </label>
            </div>
            {!samePerm && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField control={form.control} name="permanent_village" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village/Moholla</FormLabel>
                    <FormControl><Input placeholder="Village" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="permanent_post" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Office</FormLabel>
                    <FormControl><Input placeholder="Post office" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="permanent_post_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Code</FormLabel>
                    <FormControl><Input placeholder="e.g. 6400" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="permanent_upazilla" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upazilla</FormLabel>
                    <FormControl><Input placeholder="Upazilla" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="permanent_zilla" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Zilla (District)</FormLabel>
                    <FormControl><Input placeholder="District" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            )}

            {/* ── Father's Information ────────────────────────────────── */}
            <Sec title="Father's Information" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="father_name_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (English)</FormLabel>
                  <FormControl><Input placeholder="Father's name" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_name_bn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Bengali)</FormLabel>
                  <FormControl><Input placeholder="বাংলায় নাম" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_mobile_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No.</FormLabel>
                  <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_nid_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>NID No.</FormLabel>
                  <FormControl><Input placeholder="National ID" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_dob" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_education" render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl><Input placeholder="e.g. B.Sc" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_occupation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl><Input placeholder="e.g. Farmer" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="father_monthly_earning" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Monthly Earning (৳)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g. 20000" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* ── Mother's Information ────────────────────────────────── */}
            <Sec title="Mother's Information" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="mother_name_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (English)</FormLabel>
                  <FormControl><Input placeholder="Mother's name" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_name_bn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Bengali)</FormLabel>
                  <FormControl><Input placeholder="বাংলায় নাম" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_mobile_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No.</FormLabel>
                  <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_nid_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>NID No.</FormLabel>
                  <FormControl><Input placeholder="National ID" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_dob" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_education" render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl><Input placeholder="e.g. B.A" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_occupation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl><Input placeholder="e.g. Homemaker" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_monthly_earning" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Monthly Earning (৳)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g. 15000" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* ── Guardian Information ────────────────────────────────── */}
            <Sec title="Guardian Information" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="guardian_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_student_relation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation to Student</FormLabel>
                  <FormControl><Input placeholder="e.g. Father" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_mobile_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No. <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_nid_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>NID No.</FormLabel>
                  <FormControl><Input placeholder="National ID" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_dob" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_education" render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl><Input placeholder="e.g. Graduate" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_occupation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl><Input placeholder="Occupation" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_monthly_earning" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Earning (৳)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g. 25000" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_present_address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Present Address</FormLabel>
                  <FormControl><Input placeholder="Present address" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_permanent_address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanent Address</FormLabel>
                  <FormControl><Input placeholder="Permanent address" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* ── Login Credentials ───────────────────────────────────── */}
            <Sec title="Login Credentials" />
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-700">
              The username will be auto-generated as <strong>STU-{new Date().getFullYear()}-XXXXX</strong> after submission. Share it with the student along with the password below.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Min. 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/students" className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
                Cancel
              </Link>
              <Button type="submit" className="flex-1 h-10" disabled={mutation.isPending}>
                {mutation.isPending
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Enrolling…</>
                  : "Enroll Student"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
