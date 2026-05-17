"use client";
// app/(admin)/admin/finance/bulk-billing/page.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Users, Zap, Calendar } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FeeConfig {
  id: string;
  name: string;
  amount: number;
  type: string;
  applicable_classes: string[];
  due_day: number | null;
  due_date: string | null;
  is_active: boolean;
  allow_bulk: boolean;
}

interface SchoolClass { id: number; name: string; isActive: boolean }

const TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", one_time: "One-time",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── Schema ─────────────────────────────────────────────────────────────────────

const schema = z.object({
  feeConfigId:    z.string().min(1, "Select a fee type"),
  classes:        z.array(z.string()).min(1, "Select at least one class"),
  month:          z.string().optional(),
  year:           z.coerce.number().min(2020).max(2099),
  dueDate:        z.string().min(1, "Due date required"),
  overrideAmount: z.coerce.number().positive().optional().or(z.literal("")),
});
type FormInput = z.infer<typeof schema>;

// ── Result type ────────────────────────────────────────────────────────────────

type GenerateResult = { created: number; skipped: number; total_students: number; message: string };

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BulkBillingPage() {
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  // Load fee configs
  const { data: feesData } = useQuery<{ fees: FeeConfig[] }>({
    queryKey: ["fee-configs"],
    queryFn: () => fetch("/api/v1/admin/fee-configs").then((r) => r.json()),
  });
  const fees = (feesData?.fees ?? []).filter((f) => f.is_active && f.allow_bulk);

  // Load classes
  const { data: classesData } = useQuery<{ classes: SchoolClass[] }>({
    queryKey: ["school-classes"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const activeClasses = (classesData?.classes ?? []).filter((c) => c.isActive).map((c) => c.name);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      feeConfigId: "",
      classes: [],
      month: MONTHS[new Date().getMonth()],
      year: new Date().getFullYear(),
      dueDate: "",
      overrideAmount: "",
    },
  });

  const watchFeeId   = form.watch("feeConfigId");
  const watchClasses = form.watch("classes");
  const watchYear    = form.watch("year");
  const selectedFee  = fees.find((f) => f.id === watchFeeId);

  const generateMutation = useMutation({
    mutationFn: async (values: FormInput) => {
      const fee = fees.find((f) => f.id === values.feeConfigId);
      const isOneTime = fee?.type === "one_time";
      const res = await fetch("/api/v1/admin/billing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeConfigId: values.feeConfigId,
          classes: values.classes,
          month: (!isOneTime && values.month && values.month !== "none") ? values.month : undefined,
          year: values.year,
          dueDate: values.dueDate,
          overrideAmount: values.overrideAmount || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Generation failed");
      return res.json() as Promise<GenerateResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.message);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleAutoGenerate() {
    setAutoLoading(true);
    try {
      const res = await fetch("/api/v1/admin/billing/auto-generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Auto-generate failed");
      toast.success(`Auto-generated ${data.created} bills for ${data.month} ${data.year}`);
    } catch (e: any) {
      toast.error(e.message ?? "Auto-generate failed");
    } finally {
      setAutoLoading(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 pt-16">
        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Bills Generated!</h2>
          <p className="text-muted-foreground mt-1">{result.message}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Created",  value: result.created,        color: "text-green-600" },
            { label: "Skipped",  value: result.skipped,        color: "text-amber-600" },
            { label: "Students", value: result.total_students, color: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-3">
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setResult(null); form.reset(); }}>
            Generate More
          </Button>
          <Button asChild>
            <a href="/admin/students">View Students</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Bulk Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate fee bills for multiple students at once
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleAutoGenerate}
          disabled={autoLoading}
        >
          {autoLoading
            ? <Loader2 className="size-3.5 animate-spin" />
            : <Zap className="size-3.5" />}
          Auto-Generate This Month
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => generateMutation.mutate(v))} className="space-y-4">

                {/* Fee type */}
                <FormField control={form.control} name="feeConfigId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        const fee = fees.find((f) => f.id === v);
                        if (fee?.applicable_classes?.length) {
                          form.setValue("classes", fee.applicable_classes);
                        }
                        // Auto-fill due date
                        if (fee?.type === "one_time" && fee.due_date) {
                          // one_time fees have a specific due date stored on the config
                          form.setValue("dueDate", fee.due_date);
                        } else if (fee?.due_day) {
                          const y = form.getValues("year");
                          const m = MONTHS.indexOf(form.getValues("month") ?? MONTHS[new Date().getMonth()]);
                          const d = String(fee.due_day).padStart(2, "0");
                          const mm = String(m + 1).padStart(2, "0");
                          form.setValue("dueDate", `${y}-${mm}-${d}`);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fees.length === 0
                          ? <SelectItem value="none" disabled>No bulk-eligible fee configs</SelectItem>
                          : fees.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} — ৳{f.amount.toLocaleString()} ({TYPE_LABELS[f.type]})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Classes */}
                <FormField control={form.control} name="classes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classes</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => field.onChange(
                          field.value.length === activeClasses.length ? [] : [...activeClasses]
                        )}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          field.value.length === activeClasses.length
                            ? "bg-slate-900 text-white border-slate-900"
                            : "border-border text-muted-foreground hover:border-slate-400"
                        }`}
                      >
                        All Classes
                      </button>
                      {activeClasses.map((cls) => {
                        const selected = field.value.includes(cls);
                        return (
                          <button
                            key={cls} type="button"
                            onClick={() => {
                              const next = selected
                                ? field.value.filter((c) => c !== cls)
                                : [...field.value, cls];
                              field.onChange(next);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              selected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "border-border text-muted-foreground hover:border-indigo-300"
                            }`}
                          >
                            {cls}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Month + Year (only for non one_time fees) */}
                {selectedFee?.type !== "one_time" && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="month" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month {selectedFee?.type === "yearly" ? "(optional)" : ""}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">— No month —</SelectItem>
                            {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="year" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl><Input type="number" min="2020" max="2099" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* Due date */}
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Override amount */}
                <FormField control={form.control} name="overrideAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Override Amount (৳)
                      <span className="text-xs font-normal text-muted-foreground">
                        — leave blank to use fee config amount
                        {selectedFee ? ` (৳${selectedFee.amount.toLocaleString()})` : ""}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder={selectedFee ? String(selectedFee.amount) : "Amount"}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending
                    ? <><Loader2 className="size-4 mr-2 animate-spin" />Generating…</>
                    : "Generate Bills"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview panel */}
        <div className="lg:col-span-2 space-y-3">
          {selectedFee && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Users className="size-4" />
                  <span className="text-sm font-medium">Selected Fee</span>
                </div>
                <p className="font-semibold text-indigo-900">{selectedFee.name}</p>
                <p className="text-2xl font-bold text-indigo-900">
                  ৳{selectedFee.amount.toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="secondary" className="text-xs">{TYPE_LABELS[selectedFee.type]}</Badge>
                  {selectedFee.due_day && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Calendar className="size-2.5" />Due day {selectedFee.due_day}
                    </Badge>
                  )}
                  {selectedFee.due_date && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Calendar className="size-2.5" />
                      Due {new Date(selectedFee.due_date).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
                    </Badge>
                  )}
                </div>
                {selectedFee.applicable_classes.length > 0 && (
                  <div>
                    <p className="text-xs text-indigo-600 mb-1">Applicable classes:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedFee.applicable_classes.map((c) => (
                        <span key={c} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {watchClasses.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Selected Classes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {watchClasses.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                </div>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  Bills will be generated for all <span className="font-medium text-foreground">Active</span> students in {watchClasses.length} class{watchClasses.length > 1 ? "es" : ""}.
                  Duplicate bills (same student + fee + month/year) are skipped automatically.
                </p>
              </CardContent>
            </Card>
          )}

          {!watchFeeId && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Select a fee type to get started
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
