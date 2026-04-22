"use client";
// app/(public)/apply/page.tsx

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { admissionSchema, type AdmissionInput } from "@/lib/schemas";
import { submitAdmission, type AdmissionRecord } from "@/lib/actions/admission";
import { studentSignInFromAdmission } from "@/lib/auth/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Loader2, Copy, Check,
  Printer, CreditCard, GraduationCap, User, Home, Users,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_NAME     = "Bright Future School";
const SCHOOL_CONTACT  = "01XXXXXXXXX";
const APPLICATION_FEE = 100;

const CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

const STEPS = [
  { id: 1, label: "Student", icon: User  },
  { id: 2, label: "Address", icon: Home  },
  { id: 3, label: "Family",  icon: Users },
];

const STEP_FIELDS: Record<number, (keyof AdmissionInput)[]> = {
  1: ["name", "class_name", "gender", "dob", "stay_type"],
  2: ["village_moholla", "ward", "union_pourosova", "upozilla"],
  3: ["father_name", "mother_name", "guardian_name", "guardian_phone"],
};

// ── Step progress ─────────────────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {STEPS.map((step) => {
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-1.5 flex-1">
            <div className="relative flex items-center justify-center">
              <div className={`size-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                step.id < current
                  ? "bg-indigo-600 text-white"
                  : step.id === current
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step.id < current ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
              </div>
              <span className={`absolute -bottom-5 text-[10px] whitespace-nowrap font-medium ${
                step.id === current ? "text-indigo-600" : "text-muted-foreground"
              }`}>{step.label}</span>
            </div>
            {step.id < total && (
              <div className={`h-px flex-1 transition-colors duration-300 ${step.id < current ? "bg-indigo-600" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Step1({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Full Name</FormLabel>
          <FormControl><Input placeholder="e.g. Rahim Uddin" {...field} /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="class_name" render={({ field }) => (
          <FormItem><FormLabel>Applying for Class</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
              <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="gender" render={({ field }) => (
          <FormItem><FormLabel>Gender</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="dob" render={({ field }) => (
          <FormItem><FormLabel>Date of Birth</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="stay_type" render={({ field }) => (
          <FormItem><FormLabel>Stay Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Home">Home (Day Scholar)</SelectItem>
                <SelectItem value="Hostel">Hostel (Boarding)</SelectItem>
              </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
      </div>
    </div>
  );
}

function Step2({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="village_moholla" render={({ field }) => (
          <FormItem><FormLabel>Village / Moholla</FormLabel>
            <FormControl><Input placeholder="e.g. Chanchkoir" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="ward" render={({ field }) => (
          <FormItem><FormLabel>Ward No.</FormLabel>
            <FormControl><Input placeholder="e.g. 06" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="union_pourosova" render={({ field }) => (
        <FormItem><FormLabel>Union / Pouroshova</FormLabel>
          <FormControl><Input placeholder="Pouroshova" {...field} /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="upozilla" render={({ field }) => (
        <FormItem><FormLabel>Upozilla</FormLabel>
          <FormControl><Input placeholder="Gurudaspur" {...field} /></FormControl>
          <FormMessage /></FormItem>
      )} />
    </div>
  );
}

function Step3({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="father_name" render={({ field }) => (
          <FormItem><FormLabel>Father's Name</FormLabel>
            <FormControl><Input placeholder="Full name" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="mother_name" render={({ field }) => (
          <FormItem><FormLabel>Mother's Name</FormLabel>
            <FormControl><Input placeholder="Full name" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="guardian_name" render={({ field }) => (
        <FormItem><FormLabel>Guardian Name</FormLabel>
          <FormControl><Input placeholder="Full name" {...field} /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="guardian_phone" render={({ field }) => (
        <FormItem><FormLabel>Guardian Phone</FormLabel>
          <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="guardian_email" render={({ field }) => (
          <FormItem>
            <FormLabel>Guardian Email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
            <FormControl><Input type="email" placeholder="guardian@email.com" {...field} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="guardian_occupation" render={({ field }) => (
          <FormItem>
            <FormLabel>Occupation <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
            <FormControl><Input placeholder="e.g. Farmer" {...field} /></FormControl>
          </FormItem>
        )} />
      </div>
    </div>
  );
}

// ── Success page ──────────────────────────────────────────────────────────────

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
      <button onClick={copy} className="p-1.5 rounded-md hover:bg-white/60 transition-colors text-indigo-600" title={`Copy ${label}`}>
        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

function SuccessPage({ admission, onPayNow }: { admission: AdmissionRecord; onPayNow: () => void }) {
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* School */}
      <div className="text-center space-y-1 print:mb-6">
        <div className="size-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-2">
          <GraduationCap className="size-6" />
        </div>
        <h2 className="font-bold text-lg">{SCHOOL_NAME}</h2>
        <p className="text-xs text-muted-foreground">Contact: {SCHOOL_CONTACT}</p>
      </div>

      {/* Banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-green-800">Application Received!</h1>
        <p className="text-sm text-green-700 mt-1">
          Your application has been submitted. Please save your login credentials below.
        </p>
      </div>

      {/* Credentials */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-1">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Your Login Credentials</p>
        <div className="divide-y divide-indigo-100">
          <CopyField label="Username" value={admission.username} />
          <CopyField label="Password" value={admission.password_text} />
        </div>
        <p className="text-[11px] text-indigo-600 pt-2">
          Use these to log in to the Admission Portal. Please note them down or take a screenshot.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-background p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Application Summary</p>
        {[
          ["Application ID", admission.username],
          ["Student Name",   admission.name],
          ["Applied Class",  admission.class_name],
          ["Gender",         admission.gender],
          ["Date of Birth",  admission.dob],
          ["Guardian",       admission.guardian_name ?? "—"],
          ["Guardian Phone", admission.guardian_phone ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right max-w-[55%]">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
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
  const [step, setStep]         = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [admission, setAdmission]   = useState<AdmissionRecord | null>(null);
  const router = useRouter();

  const form = useForm<AdmissionInput>({
    resolver: zodResolver(admissionSchema),
    mode: "onTouched",
    defaultValues: {
      name: "", class_name: "", gender: undefined, dob: "", stay_type: undefined,
      village_moholla: "", ward: "", union_pourosova: "", upozilla: "",
      father_name: "", mother_name: "", guardian_name: "",
      guardian_phone: "", guardian_email: "", guardian_occupation: "",
    },
  });

  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  }

  async function onSubmit(values: AdmissionInput) {
    setSubmitting(true);
    try {
      // Server action — runs server-side, no CORS/CSRF issues
      const result = await submitAdmission(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // Guard: ensure the record is fully formed before using it
      if (!result.admission?.id || !result.admission?.username) {
        toast.error("Application submitted but response was incomplete. Please contact the school.");
        return;
      }

      // Sign the student in using the returned admission token (no second login call)
      await studentSignInFromAdmission(result.admission, result.token);

      setAdmission(result.admission);
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePayNow() {
    router.push("/admission/application");
  }

  // Success view
  if (admission) {
    return (
      <div className="min-h-screen bg-muted/20 py-10 px-4">
        <SuccessPage admission={admission} onPayNow={handlePayNow} />
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-muted/20 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3">
            <GraduationCap className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">{SCHOOL_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Online Admission Form — Academic Year 2025–26
          </p>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border p-8 pt-10">
          <StepProgress current={step} total={STEPS.length} />

          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {step === 1 && <Step1 form={form} />}
                {step === 2 && <Step2 form={form} />}
                {step === 3 && <Step3 form={form} />}

                <div className="flex gap-3 mt-8">
                  {step > 1 && (
                    <Button type="button" variant="outline" className="flex-1 gap-1" onClick={() => setStep((s) => s - 1)}>
                      <ChevronLeft className="size-4" />Back
                    </Button>
                  )}
                  {step < STEPS.length ? (
                    <Button type="button" className="flex-1 gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={goNext}>
                      Continue<ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={submitting}>
                      {submitting
                        ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting…</>
                        : "Submit Application"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
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
