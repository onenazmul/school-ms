"use client";
// app/(admission)/admission/application/edit/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStudentSession } from "@/lib/auth/student-client";
import { api, ApiError } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { admissionSchema, type AdmissionInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type RawAdmission = {
  id: number;
  name: string; class_name: string; gender: string; dob: string; stay_type: string;
  father_name: string; mother_name: string; guardian_name: string;
  guardian_occupation: string | null; guardian_phone: string; guardian_email: string | null;
  upozilla: string; union_pourosova: string; ward: string; village_moholla: string;
  payment_tracking_id: string | null;
};

function isPaid(a: RawAdmission) {
  return a.payment_tracking_id !== null &&
    a.payment_tracking_id !== "4" &&
    a.payment_tracking_id !== "";
}

export default function EditApplicationPage() {
  const router  = useRouter();
  const { session, loading: sessionLoading } = useStudentSession();
  const [fetching, setFetching] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [locked,   setLocked]   = useState(false);

  const form = useForm<AdmissionInput>({
    resolver: zodResolver(admissionSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    api
      .get<{ admission: RawAdmission }>(EP.ADMISSION(session.id), session.laravelToken)
      .then(({ admission }) => {
        if (isPaid(admission)) { setLocked(true); return; }
        form.reset({
          name:                admission.name,
          class_name:          admission.class_name,
          gender:              admission.gender as AdmissionInput["gender"],
          dob:                 admission.dob,
          stay_type:           admission.stay_type as AdmissionInput["stay_type"],
          village_moholla:     admission.village_moholla,
          ward:                admission.ward,
          union_pourosova:     admission.union_pourosova,
          upozilla:            admission.upozilla,
          father_name:         admission.father_name,
          mother_name:         admission.mother_name,
          guardian_name:       admission.guardian_name,
          guardian_phone:      admission.guardian_phone,
          guardian_email:      admission.guardian_email ?? "",
          guardian_occupation: admission.guardian_occupation ?? "",
        });
      })
      .catch((err) => toast.error(err.message ?? "Could not load application"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading, form]);

  async function onSubmit(values: AdmissionInput) {
    if (!session) return;
    setSaving(true);
    try {
      await api.postParams(
        EP.ADMISSION(session.id),
        {
          _method:             "PUT",
          name:                values.name,
          class_name:          values.class_name,
          gender:              values.gender,
          dob:                 values.dob,
          stay_type:           values.stay_type,
          father_name:         values.father_name,
          mother_name:         values.mother_name,
          guardian_name:       values.guardian_name,
          guardian_occupation: values.guardian_occupation || undefined,
          guardian_phone:      values.guardian_phone,
          guardian_email:      values.guardian_email || undefined,
          upozilla:            values.upozilla,
          union_pourosova:     values.union_pourosova,
          ward:                values.ward,
          village_moholla:     values.village_moholla,
        },
        session.laravelToken
      );
      toast.success("Application updated successfully.");
      router.push("/admission/application");
    } catch (err: any) {
      if (err instanceof ApiError && err.errors) {
        Object.entries(err.errors).forEach(([f, msgs]) =>
          toast.error(`${f}: ${(msgs as string[]).join(", ")}`)
        );
      } else {
        toast.error(err.message ?? "Could not save changes.");
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
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
    <div className="space-y-5 pt-2">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
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

          {/* Student */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student Details</p>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="class_name" render={({ field }) => (
                <FormItem><FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                  <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="stay_type" render={({ field }) => (
                <FormItem><FormLabel>Stay Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Home">Home (Day Scholar)</SelectItem>
                      <SelectItem value="Hostel">Hostel (Boarding)</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="village_moholla" render={({ field }) => (
                <FormItem><FormLabel>Village / Moholla</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ward" render={({ field }) => (
                <FormItem><FormLabel>Ward No.</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="union_pourosova" render={({ field }) => (
              <FormItem><FormLabel>Union / Pouroshova</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="upozilla" render={({ field }) => (
              <FormItem><FormLabel>Upozilla</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          {/* Guardian */}
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guardian / Family</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="father_name" render={({ field }) => (
                <FormItem><FormLabel>Father's Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mother_name" render={({ field }) => (
                <FormItem><FormLabel>Mother's Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="guardian_name" render={({ field }) => (
              <FormItem><FormLabel>Guardian Name</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="guardian_phone" render={({ field }) => (
              <FormItem><FormLabel>Guardian Phone</FormLabel>
                <FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="guardian_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="guardian_occupation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </div>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
            {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
