"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStudentSession } from "@/lib/auth/student-client";
import { api, ApiError } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { admissionEditSchema, type AdmissionEditInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Lock } from "lucide-react";

const CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DIVISIONS = ["আবাসিক", "অনবাসিক", "ক্যাডেট", "হিফজুল কুরআন"];

type RawAdmission = AdmissionEditInput & {
  id: number;
  payment_tracking_id: string | null;
};

function isPaid(a: RawAdmission) {
  return (
    a.payment_tracking_id !== null &&
    a.payment_tracking_id !== "4" &&
    a.payment_tracking_id !== ""
  );
}

function SecTitle({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {title}
    </p>
  );
}

export default function EditApplicationPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useStudentSession();
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);

  const form = useForm<AdmissionEditInput>({
    resolver: zodResolver(admissionEditSchema),
    mode: "onTouched",
    defaultValues: {
      name_en: "", name_bn: "", name_ar: "",
      dob: "", birth_certificate_no: "",
      gender: "Male", height: "", weight: "", age: "",
      nationality: "Bangladeshi", blood_group: "", identify_sign: "",
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
    },
  });

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    api
      .get<{ admission: RawAdmission }>(EP.ADMISSION(session.id), session.laravelToken)
      .then(({ admission }) => {
        if (isPaid(admission)) { setLocked(true); return; }
        form.reset({
          name_en:              admission.name_en              ?? "",
          name_bn:              admission.name_bn              ?? "",
          name_ar:              admission.name_ar              ?? "",
          dob:                  admission.dob                  ?? "",
          birth_certificate_no: admission.birth_certificate_no ?? "",
          gender:               (admission.gender as AdmissionEditInput["gender"]) ?? "Male",
          height:               admission.height               ?? "",
          weight:               admission.weight               ?? "",
          age:                  admission.age                  ?? "",
          nationality:          admission.nationality          ?? "Bangladeshi",
          blood_group:          admission.blood_group          ?? "",
          identify_sign:        admission.identify_sign        ?? "",

          present_village:   admission.present_village   ?? "",
          present_post:      admission.present_post      ?? "",
          present_upazilla:  admission.present_upazilla  ?? "",
          present_post_code: admission.present_post_code ?? "",
          present_zilla:     admission.present_zilla     ?? "",

          permanent_village:   admission.permanent_village   ?? "",
          permanent_post:      admission.permanent_post      ?? "",
          permanent_upazilla:  admission.permanent_upazilla  ?? "",
          permanent_zilla:     admission.permanent_zilla     ?? "",
          permanent_post_code: admission.permanent_post_code ?? "",

          father_name_en:         admission.father_name_en         ?? "",
          father_name_bn:         admission.father_name_bn         ?? "",
          father_education:       admission.father_education       ?? "",
          father_occupation:      admission.father_occupation      ?? "",
          father_monthly_earning: admission.father_monthly_earning ?? "",
          father_mobile_no:       admission.father_mobile_no       ?? "",
          father_nid_no:          admission.father_nid_no          ?? "",
          father_dob:             admission.father_dob             ?? "",

          mother_name_en:         admission.mother_name_en         ?? "",
          mother_name_bn:         admission.mother_name_bn         ?? "",
          mother_education:       admission.mother_education       ?? "",
          mother_occupation:      admission.mother_occupation      ?? "",
          mother_monthly_earning: admission.mother_monthly_earning ?? "",
          mother_mobile_no:       admission.mother_mobile_no       ?? "",
          mother_nid_no:          admission.mother_nid_no          ?? "",
          mother_dob:             admission.mother_dob             ?? "",

          guardian_name:              admission.guardian_name              ?? "",
          guardian_student_relation:  admission.guardian_student_relation  ?? "",
          guardian_present_address:   admission.guardian_present_address   ?? "",
          guardian_permanent_address: admission.guardian_permanent_address ?? "",
          guardian_education:         admission.guardian_education         ?? "",
          guardian_occupation:        admission.guardian_occupation        ?? "",
          guardian_monthly_earning:   admission.guardian_monthly_earning   ?? "",
          guardian_mobile_no:         admission.guardian_mobile_no         ?? "",
          guardian_nid_no:            admission.guardian_nid_no            ?? "",
          guardian_dob:               admission.guardian_dob               ?? "",

          class_name:              admission.class_name              ?? "",
          session_name:            admission.session_name            ?? "",
          division:                admission.division                ?? "",
          previous_institute_name: admission.previous_institute_name ?? "",
          sibling_details:         admission.sibling_details         ?? "",
        });
      })
      .catch((err) => toast.error(err.message ?? "Could not load application"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading, form]);

  function copyPresentToPermanent() {
    const v = form.getValues();
    form.setValue("permanent_village",   v.present_village);
    form.setValue("permanent_post",      v.present_post);
    form.setValue("permanent_upazilla",  v.present_upazilla);
    form.setValue("permanent_zilla",     v.present_zilla);
    form.setValue("permanent_post_code", v.present_post_code);
  }

  function handleSameAddress(checked: boolean) {
    setSameAddress(checked);
    if (checked) copyPresentToPermanent();
  }

  async function onSubmit(values: AdmissionEditInput) {
    if (!session) return;
    setSaving(true);
    try {
      await api.postParams(
        EP.ADMISSION(session.id),
        { _method: "PUT", ...values },
        session.laravelToken,
      );
      toast.success("Application updated successfully.");
      router.push("/admission/application");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.errors) {
        Object.entries(err.errors).forEach(([f, msgs]) =>
          toast.error(`${f}: ${(msgs as string[]).join(", ")}`)
        );
      } else {
        toast.error((err as Error).message ?? "Could not save changes.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="space-y-4 pt-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        <div className="rounded-xl border bg-background p-8 text-center space-y-4">
          <div className="size-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
            <Lock className="size-6 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold">Application Locked</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Application cannot be edited after the fee is paid.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/admission/application">View Application</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2 pb-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" /> Back
      </button>
      <div>
        <h1 className="text-xl font-semibold">Edit Application</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Changes are allowed before paying the application fee.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Student Details ─────────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <SecTitle title="Student Details" />

            <div className="grid grid-cols-1 gap-4">
              <FormField control={form.control} name="name_en" render={({ field }) => (
                <FormItem><FormLabel>Full Name (English) *</FormLabel>
                  <FormControl><Input placeholder="e.g. Mohammad Ali" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name_bn" render={({ field }) => (
                <FormItem><FormLabel>Full Name (Bengali)</FormLabel>
                  <FormControl><Input placeholder="বাংলায় নাম" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name_ar" render={({ field }) => (
                <FormItem><FormLabel>Full Name (Arabic)</FormLabel>
                  <FormControl><Input placeholder="الاسم بالعربية" dir="rtl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="birth_certificate_no" render={({ field }) => (
                <FormItem><FormLabel>Birth Certificate No.</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="blood_group" render={({ field }) => (
                <FormItem><FormLabel>Blood Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem><FormLabel>Age</FormLabel>
                  <FormControl><Input type="number" min={1} max={30} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="height" render={({ field }) => (
                <FormItem><FormLabel>Height (cm)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>Weight (kg)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="nationality" render={({ field }) => (
                <FormItem><FormLabel>Nationality</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="identify_sign" render={({ field }) => (
                <FormItem><FormLabel>Identify Sign</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Academic Details ─────────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <SecTitle title="Academic Details" />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="class_name" render={({ field }) => (
                <FormItem><FormLabel>Applied Class *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="session_name" render={({ field }) => (
                <FormItem><FormLabel>Session</FormLabel>
                  <FormControl><Input placeholder="e.g. 2025-26" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="division" render={({ field }) => (
                <FormItem><FormLabel>Division / Section</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="previous_institute_name" render={({ field }) => (
                <FormItem><FormLabel>Previous Institute</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="sibling_details" render={({ field }) => (
              <FormItem><FormLabel>Sibling Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Names and classes of siblings studying here (if any)"
                    className="resize-none min-h-16"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* ── Present Address ──────────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <SecTitle title="Present Address" />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="present_village" render={({ field }) => (
                <FormItem><FormLabel>Village *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="present_post" render={({ field }) => (
                <FormItem><FormLabel>Post Office</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="present_upazilla" render={({ field }) => (
                <FormItem><FormLabel>Upazilla *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="present_zilla" render={({ field }) => (
                <FormItem><FormLabel>Zilla *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="present_post_code" render={({ field }) => (
              <FormItem><FormLabel>Post Code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* ── Permanent Address ────────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SecTitle title="Permanent Address" />
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={sameAddress}
                  onCheckedChange={(v) => handleSameAddress(!!v)}
                />
                Same as present
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="permanent_village" render={({ field }) => (
                <FormItem><FormLabel>Village</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="permanent_post" render={({ field }) => (
                <FormItem><FormLabel>Post Office</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="permanent_upazilla" render={({ field }) => (
                <FormItem><FormLabel>Upazilla</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="permanent_zilla" render={({ field }) => (
                <FormItem><FormLabel>Zilla</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="permanent_post_code" render={({ field }) => (
              <FormItem><FormLabel>Post Code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* ── Father's Information ─────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <SecTitle title="Father's Information" />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="father_name_en" render={({ field }) => (
                <FormItem><FormLabel>Name (English)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="father_name_bn" render={({ field }) => (
                <FormItem><FormLabel>Name (Bengali)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="father_occupation" render={({ field }) => (
                <FormItem><FormLabel>Occupation</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="father_education" render={({ field }) => (
                <FormItem><FormLabel>Education</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="father_mobile_no" render={({ field }) => (
                <FormItem><FormLabel>Mobile No.</FormLabel>
                  <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="father_monthly_earning" render={({ field }) => (
                <FormItem><FormLabel>Monthly Earning (৳)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="father_nid_no" render={({ field }) => (
                <FormItem><FormLabel>NID No.</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="father_dob" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Mother's Information ─────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <SecTitle title="Mother's Information" />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="mother_name_en" render={({ field }) => (
                <FormItem><FormLabel>Name (English)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_name_bn" render={({ field }) => (
                <FormItem><FormLabel>Name (Bengali)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="mother_occupation" render={({ field }) => (
                <FormItem><FormLabel>Occupation</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_education" render={({ field }) => (
                <FormItem><FormLabel>Education</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="mother_mobile_no" render={({ field }) => (
                <FormItem><FormLabel>Mobile No.</FormLabel>
                  <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_monthly_earning" render={({ field }) => (
                <FormItem><FormLabel>Monthly Earning (৳)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="mother_nid_no" render={({ field }) => (
                <FormItem><FormLabel>NID No.</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mother_dob" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Guardian Information ─────────────────────────────────── */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <SecTitle title="Guardian Information" />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="guardian_name" render={({ field }) => (
                <FormItem><FormLabel>Guardian Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_student_relation" render={({ field }) => (
                <FormItem><FormLabel>Relation to Student</FormLabel>
                  <FormControl><Input placeholder="e.g. Father, Uncle" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="guardian_mobile_no" render={({ field }) => (
                <FormItem><FormLabel>Mobile No. *</FormLabel>
                  <FormControl><Input type="tel" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_occupation" render={({ field }) => (
                <FormItem><FormLabel>Occupation</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="guardian_education" render={({ field }) => (
                <FormItem><FormLabel>Education</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_monthly_earning" render={({ field }) => (
                <FormItem><FormLabel>Monthly Earning (৳)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="guardian_nid_no" render={({ field }) => (
                <FormItem><FormLabel>NID No.</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardian_dob" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="guardian_present_address" render={({ field }) => (
              <FormItem><FormLabel>Present Address</FormLabel>
                <FormControl>
                  <Textarea className="resize-none min-h-16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="guardian_permanent_address" render={({ field }) => (
              <FormItem><FormLabel>Permanent Address</FormLabel>
                <FormControl>
                  <Textarea className="resize-none min-h-16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base"
            disabled={saving}
          >
            {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
