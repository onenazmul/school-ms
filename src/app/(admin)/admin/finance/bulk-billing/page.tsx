"use client";
// app/(admin)/admin/finance/bulk-billing/page.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bulkBillingSchema, type BulkBillingInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle, Users } from "lucide-react";

const CLASSES = ["1","2","3","4","5","6","7","8","9","10"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MOCK_FEE_CONFIGS = [
  { id: "1", name: "Tuition Fee", amount: 5500, type: "monthly" },
  { id: "2", name: "Exam Fee", amount: 1200, type: "quarterly" },
  { id: "3", name: "Library Fee", amount: 500, type: "yearly" },
];
const CLASS_STUDENT_COUNT: Record<string, number> = {
  "1": 42, "2": 38, "3": 45, "4": 41, "5": 39,
  "6": 52, "7": 48, "8": 55, "9": 61, "10": 58,
};

type PreviewData = {
  totalStudents: number;
  totalBills: number;
  totalAmount: number;
  perClass: { cls: string; students: number; amount: number }[];
};

export default function BulkBillingPage() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<BulkBillingInput>({
    resolver: zodResolver(bulkBillingSchema),
    defaultValues: {
      feeConfigId: "",
      classes: [],
      month: "",
      year: new Date().getFullYear(),
      dueDate: "",
      description: "",
    },
  });

  const watchClasses = form.watch("classes");
  const watchFeeId = form.watch("feeConfigId");
  const selectedFee = MOCK_FEE_CONFIGS.find((f) => f.id === watchFeeId);

  function buildPreview(values: BulkBillingInput): PreviewData {
    const fee = MOCK_FEE_CONFIGS.find((f) => f.id === values.feeConfigId);
    const perClass = values.classes.map((cls) => ({
      cls,
      students: CLASS_STUDENT_COUNT[cls] ?? 0,
      amount: (CLASS_STUDENT_COUNT[cls] ?? 0) * (fee?.amount ?? 0),
    }));
    const totalStudents = perClass.reduce((s, c) => s + c.students, 0);
    const totalAmount = perClass.reduce((s, c) => s + c.amount, 0);
    return { totalStudents, totalBills: totalStudents, totalAmount, perClass };
  }

  function onPreview(values: BulkBillingInput) {
    setPreview(buildPreview(values));
  }

  async function onConfirm() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500)); // Simulate API
    setLoading(false);
    setSubmitted(true);
    toast.success(`${preview?.totalBills} bills generated successfully`);
  }

  if (submitted && preview) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 pt-16">
        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Bills Generated!</h2>
          <p className="text-muted-foreground mt-1">
            {preview.totalBills} bills totalling ৳{preview.totalAmount.toLocaleString()} created.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setSubmitted(false); setPreview(null); form.reset(); }}>
            Generate More
          </Button>
          <Button asChild>
            <a href="/admin/finance/ledger">View Ledger</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Bulk Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate bills for multiple classes at once
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onPreview)} className="space-y-4">
                {/* Fee type */}
                <FormField
                  control={form.control}
                  name="feeConfigId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_FEE_CONFIGS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} — ৳{f.amount.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Classes */}
                <FormField
                  control={form.control}
                  name="classes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classes</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(
                              field.value.length === CLASSES.length ? [] : [...CLASSES]
                            )
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            field.value.length === CLASSES.length
                              ? "bg-slate-900 text-white border-slate-900"
                              : "border-border text-muted-foreground hover:border-slate-400"
                          }`}
                        >
                          All Classes
                        </button>
                        {CLASSES.map((cls) => {
                          const selected = field.value?.includes(cls);
                          return (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => {
                                const next = selected
                                  ? field.value.filter((c) => c !== cls)
                                  : [...(field.value ?? []), cls];
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
                  )}
                />

                {/* Month + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Due date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Appears on student ledger…" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Preview Bills
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview panel */}
        <div className="lg:col-span-2 space-y-3">
          {/* Live counter */}
          {watchClasses.length > 0 && selectedFee && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Users className="size-4" />
                  <span className="text-sm font-medium">Live Preview</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-indigo-900">
                    ৳{(
                      watchClasses.reduce((s, c) => s + (CLASS_STUDENT_COUNT[c] ?? 0), 0) *
                      selectedFee.amount
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {watchClasses.reduce((s, c) => s + (CLASS_STUDENT_COUNT[c] ?? 0), 0)} students ×
                    ৳{selectedFee.amount.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {preview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Billing Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview.perClass.map((pc) => (
                  <div key={pc.cls} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Class {pc.cls}</span>
                    <div className="text-right">
                      <p className="font-medium">৳{pc.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{pc.students} students</p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total</span>
                  <span>৳{preview.totalAmount.toLocaleString()}</span>
                </div>
                <Button
                  onClick={onConfirm}
                  disabled={loading}
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" />Generating…</>
                  ) : (
                    `Confirm & Generate ${preview.totalBills} Bills`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {!watchClasses.length && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Select fee type and classes to see a preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
