"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { admissionApplySchema, type AdmissionApplyInput } from "@/lib/schemas";
import { submitAdmission, type AdmissionRecord } from "@/lib/actions/admission";
import { studentSignInFromAdmission } from "@/lib/auth/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle2, Loader2, Copy, Check, Printer, CreditCard,
  GraduationCap, Eye, EyeOff, Upload,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_NAME     = "Markazul Hifz International Cadet Madrasah";
const SCHOOL_CONTACT  = "01XXXXXXXXX";
const APPLICATION_FEE = 100;

const CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DIVISIONS = [
  "আবাসিক", "অনবাসিক", "ক্যাডেট", "হিফজুল কুরআন"
];

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

// ── FileUpload ────────────────────────────────────────────────────────────────

function FileUpload({
  label, value, onChange,
}: { label: string; value: File | null; onChange: (f: File | null) => void }) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handle(files: FileList | null) {
    const f = files?.[0] ?? null;
    if (f) onChange(f);
  }

  return (
    <div>
      <p className="text-sm font-medium mb-1.5">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[110px] ${
          drag ? "border-indigo-400 bg-indigo-50" : "border-border hover:border-indigo-300 bg-muted/30"
        }`}
      >
        {preview ? (
          <img src={preview} alt={label} className="max-h-24 max-w-full object-contain rounded-lg p-1" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground p-3">
            <Upload className="size-5" />
            <p className="text-xs text-center">Drag & drop or click</p>
            <p className="text-[11px]">JPG, PNG, PDF</p>
          </div>
        )}
      </div>
      {value && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground truncate max-w-[80%]">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-[11px] text-destructive hover:underline">
            Remove
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handle(e.target.files)} />
    </div>
  );
}

// ── PasswordInput ─────────────────────────────────────────────────────────────

const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={`pr-10 ${className ?? ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// ── CopyField ─────────────────────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono font-semibold mt-0.5">{value}</p>
      </div>
      <button onClick={copy} className="p-1.5 rounded-md hover:bg-white/60 transition-colors text-indigo-600">
        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

// ── SuccessPage ───────────────────────────────────────────────────────────────

function SuccessPage({ admission, onPayNow }: { admission: AdmissionRecord; onPayNow: () => void }) {
  const name = admission.name_en ?? admission.name ?? "—";
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="text-center space-y-1 print:mb-6">
        <div className="size-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-2">
          <GraduationCap className="size-6" />
        </div>
        <h2 className="font-bold text-lg">{SCHOOL_NAME}</h2>
        <p className="text-xs text-muted-foreground">Contact: {SCHOOL_CONTACT}</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-green-800">Application Received!</h1>
        <p className="text-sm text-green-700 mt-1">
          Your application has been submitted. Please save your login credentials below.
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Your Login Credentials</p>
        <div className="divide-y divide-indigo-100">
          <CopyField label="Username" value={admission.username} />
          <div className="py-2">
            <p className="text-xs text-muted-foreground">Password</p>
            <p className="text-sm font-medium mt-0.5 text-indigo-700">Your chosen password</p>
          </div>
        </div>
        <p className="text-[11px] text-indigo-600 pt-2">
          Use these to log in to the Admission Portal. Please keep them safe.
        </p>
      </div>

      <div className="rounded-xl border bg-background p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Application Summary</p>
        {[
          ["Application ID", admission.username],
          ["Student Name",   name],
          ["Applied Class",  admission.class_name],
          ["Gender",         admission.gender],
          ["Date of Birth",  admission.dob],
          ["Guardian",       admission.guardian_name ?? "—"],
          ["Guardian Phone", admission.guardian_mobile_no ?? admission.guardian_phone ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right max-w-[55%]">{value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 print:hidden">
        <Button
          onClick={onPayNow}
          className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold"
        >
          <CreditCard className="size-5" />
          Pay Application Fee — ৳{APPLICATION_FEE}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
            <Printer className="size-4" />Print
          </Button>
          <a
            href="/admission/dashboard"
            className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Pay Later →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const [submitting, setSubmitting] = useState(false);
  const [admission, setAdmission]   = useState<AdmissionRecord | null>(null);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [sigFile,   setSigFile]     = useState<File | null>(null);
  const [samePerm,  setSamePerm]    = useState(false);
  const router = useRouter();

  const form = useForm<AdmissionApplyInput>({
    resolver: zodResolver(admissionApplySchema),
    mode: "onTouched",
    defaultValues: {
      name_en: "", name_bn: "", name_ar: "",
      dob: "", birth_certificate_no: "",
      gender: undefined,
      height: "", weight: "", age: "", nationality: "Bangladeshi",
      blood_group: "", identify_sign: "",
      present_village: "", present_post: "", present_upazilla: "",
      present_post_code: "", present_zilla: "",
      permanent_village: "", permanent_post: "", permanent_upazilla: "",
      permanent_zilla: "", permanent_post_code: "",
      father_name_en: "", father_name_bn: "", father_education: "",
      father_occupation: "", father_monthly_earning: "",
      father_mobile_no: "", father_nid_no: "", father_dob: "",
      mother_name_en: "", mother_name_bn: "", mother_education: "",
      mother_occupation: "", mother_monthly_earning: "",
      mother_mobile_no: "", mother_nid_no: "", mother_dob: "",
      guardian_name: "", guardian_student_relation: "",
      guardian_present_address: "", guardian_permanent_address: "",
      guardian_education: "", guardian_occupation: "",
      guardian_monthly_earning: "", guardian_mobile_no: "",
      guardian_nid_no: "", guardian_dob: "",
      class_name: "", session_name: "", division: "",
      previous_institute_name: "", sibling_details: "",
      password: "", confirm_password: "",
    },
  });

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

  async function onSubmit(values: AdmissionApplyInput) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(values)) {
        if (k === "confirm_password") continue;
        if (v !== undefined && v !== "") fd.append(k, v as string);
      }
      if (photoFile) fd.append("student_photo",     photoFile);
      if (sigFile)   fd.append("student_signature", sigFile);
      fd.set("application_fee", String(APPLICATION_FEE));

      const result = await submitAdmission(fd);
      if (!result.success) { toast.error(result.message); return; }
      if (!result.admission?.id || !result.admission?.username) {
        toast.error("Application submitted but response was incomplete. Please contact the school.");
        return;
      }
      await studentSignInFromAdmission(result.admission, result.token);
      setAdmission(result.admission);
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (admission) {
    return (
      <div className="min-h-screen bg-muted/20 py-10 px-4">
        <SuccessPage admission={admission} onPayNow={() => router.push("/admission/application")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3">
            <GraduationCap className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">{SCHOOL_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">Online Admission Form — Academic Year 2026</p>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border p-5 md:p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* ── Student Information ───────────────────────────────── */}
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
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name_ar" render={({ field }) => (
                  <FormItem className="col-span-3 sm:col-span-1">
                    <FormLabel>Name (Arabic)</FormLabel>
                    <FormControl><Input placeholder="الاسم" dir="rtl" {...field} /></FormControl>
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="blood_group" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl><Input placeholder="Bangladeshi" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height</FormLabel>
                    <FormControl><Input placeholder="e.g. 4ft 5in" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl><Input placeholder="e.g. 45 kg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="birth_certificate_no" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Cert. No.</FormLabel>
                    <FormControl><Input placeholder="Certificate no." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="identify_sign" render={({ field }) => (
                <FormItem>
                  <FormLabel>Identifying Sign</FormLabel>
                  <FormControl><Input placeholder="e.g. mole on left cheek" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* ── Academic Details ──────────────────────────────────── */}
              <Sec title="Academic Details" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField control={form.control} name="class_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applying for Class <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                      <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="session_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <FormControl><Input placeholder="e.g. 2025–26" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="division" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="previous_institute_name" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Previous Institute</FormLabel>
                    <FormControl><Input placeholder="Previous school name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sibling_details" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sibling Details</FormLabel>
                    <FormControl><Input placeholder="e.g. 1 sibling in Class 5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ── Present Address ───────────────────────────────────── */}
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
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="present_post_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Code</FormLabel>
                    <FormControl><Input placeholder="e.g. 6400" {...field} /></FormControl>
                    <FormMessage />
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

              {/* ── Permanent Address ─────────────────────────────────── */}
              <Sec title="Permanent Address" />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="same-perm"
                  checked={samePerm}
                  onCheckedChange={v => handleSamePerm(Boolean(v))}
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
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="permanent_post" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Office</FormLabel>
                      <FormControl><Input placeholder="Post office" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="permanent_post_code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Code</FormLabel>
                      <FormControl><Input placeholder="e.g. 6400" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="permanent_upazilla" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upazilla</FormLabel>
                      <FormControl><Input placeholder="Upazilla" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="permanent_zilla" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Zilla (District)</FormLabel>
                      <FormControl><Input placeholder="District" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* ── Father's Information ──────────────────────────────── */}
              <Sec title="Father's Information" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField control={form.control} name="father_name_en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English)</FormLabel>
                    <FormControl><Input placeholder="Father's name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_name_bn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Bengali)</FormLabel>
                    <FormControl><Input placeholder="বাংলায় নাম" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_mobile_no" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile No.</FormLabel>
                    <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_nid_no" render={({ field }) => (
                  <FormItem>
                    <FormLabel>NID No.</FormLabel>
                    <FormControl><Input placeholder="National ID" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_dob" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_education" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education</FormLabel>
                    <FormControl><Input placeholder="e.g. B.Sc" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_occupation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl><Input placeholder="e.g. Farmer" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="father_monthly_earning" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Monthly Earning (৳)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g. 20000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ── Mother's Information ──────────────────────────────── */}
              <Sec title="Mother's Information" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField control={form.control} name="mother_name_en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English)</FormLabel>
                    <FormControl><Input placeholder="Mother's name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_name_bn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Bengali)</FormLabel>
                    <FormControl><Input placeholder="বাংলায় নাম" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_mobile_no" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile No.</FormLabel>
                    <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_nid_no" render={({ field }) => (
                  <FormItem>
                    <FormLabel>NID No.</FormLabel>
                    <FormControl><Input placeholder="National ID" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_dob" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_education" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education</FormLabel>
                    <FormControl><Input placeholder="e.g. B.A" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_occupation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl><Input placeholder="e.g. Homemaker" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mother_monthly_earning" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Monthly Earning (৳)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g. 15000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ── Guardian Information ──────────────────────────────── */}
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_dob" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_education" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education</FormLabel>
                    <FormControl><Input placeholder="e.g. Graduate" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_occupation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl><Input placeholder="Occupation" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_monthly_earning" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Earning (৳)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g. 25000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_present_address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Present Address</FormLabel>
                    <FormControl><Input placeholder="Present address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_permanent_address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address</FormLabel>
                    <FormControl><Input placeholder="Permanent address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ── Attachments ───────────────────────────────────────── */}
              <Sec title="Attachments" />
              <div className="grid grid-cols-2 gap-4">
                <FileUpload label="Student Photo" value={photoFile} onChange={setPhotoFile} />
                <FileUpload label="Student Signature" value={sigFile} onChange={setSigFile} />
              </div>

              {/* ── Login Details ─────────────────────────────────────── */}
              <Sec title="Login Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Min. 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirm_password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Repeat password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-semibold mt-2"
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting…</>
                  : "Submit Application"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already applied?{" "}
          <a href="/apply/login" className="text-indigo-600 font-medium hover:underline">
            Sign in to check status
          </a>
        </p>
      </div>
    </div>
  );
}
