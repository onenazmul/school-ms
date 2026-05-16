"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeConfig {
  id: string;
  name: string;
  amount: number;
  type: string;
  applicable_classes: string[];
  due_day: number | null;
  due_date: string | null;
  late_fee: number | null;
  is_active: boolean;
}

interface SchoolClass { id: number; name: string; isActive: boolean }

const TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  one_time: "One-time",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const feeSchema = z.object({
  name: z.string().min(2, "Fee name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
  applicable_classes: z.array(z.string()).min(1, "Select at least one class"),
  due_day: z.coerce.number().min(1).max(31).optional().or(z.literal("")),
  due_date: z.string().optional(),
  late_fee: z.coerce.number().min(0).optional().or(z.literal("")),
});
type FeeFormInput = z.infer<typeof feeSchema>;

// ─── Fee Form ─────────────────────────────────────────────────────────────────

function FeeForm({
  defaultValues,
  classes,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<FeeFormInput>;
  classes: string[];
  onSubmit: (v: FeeFormInput) => void;
  loading: boolean;
}) {
  const form = useForm<FeeFormInput>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: "monthly",
      applicable_classes: [],
      due_day: 10,
      due_date: "",
      late_fee: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Fee Name</FormLabel>
            <FormControl><Input placeholder="e.g. Tuition Fee" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (৳)</FormLabel>
              <FormControl><Input type="number" min="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="applicable_classes" render={({ field }) => (
          <FormItem>
            <FormLabel>Applicable Classes</FormLabel>
            {classes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No active classes found. Add classes in{" "}
                <a href="/admin/classes" className="underline text-indigo-600">Classes</a> first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {classes.map((cls) => {
                  const selected = field.value?.includes(cls);
                  return (
                    <button
                      key={cls} type="button"
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
            )}
            <FormMessage />
          </FormItem>
        )} />

        {form.watch("type") === "one_time" ? (
          <FormField control={form.control} name="due_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        ) : (
          <FormField control={form.control} name="due_day" render={({ field }) => (
            <FormItem>
              <FormLabel>Due Day of Month</FormLabel>
              <FormControl><Input type="number" min="1" max="31" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="late_fee" render={({ field }) => (
          <FormItem>
            <FormLabel>Late Fee (৳)</FormLabel>
            <FormControl><Input type="number" min="0" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Fee Configuration
        </Button>
      </form>
    </Form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeeConfigPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeConfig | null>(null);

  const { data: feesData, isLoading: feesLoading } = useQuery<{ fees: FeeConfig[] }>({
    queryKey: ["fee-configs"],
    queryFn: () => fetch("/api/v1/admin/fee-configs").then((r) => r.json()),
  });
  const fees = feesData?.fees ?? [];

  const { data: classesData } = useQuery<{ classes: SchoolClass[] }>({
    queryKey: ["school-classes"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const classNames = (classesData?.classes ?? [])
    .filter((c) => c.isActive)
    .map((c) => c.name);

  const createMutation = useMutation({
    mutationFn: (body: FeeFormInput) =>
      fetch("/api/v1/admin/fee-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-configs"] });
      setOpen(false);
      toast.success("Fee type created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (body: FeeFormInput) =>
      fetch(`/api/v1/admin/fee-configs/${editing!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-configs"] });
      setEditing(null);
      toast.success("Fee type updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/admin/fee-configs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-configs"] });
      setDeleteTarget(null);
      toast.success("Fee type deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fee Configuration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define fee types, amounts, and applicability
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add Fee Type
        </Button>
      </div>

      {feesLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : fees.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center text-sm text-muted-foreground">
          No fee types yet. Add your first fee configuration.
        </div>
      ) : (
        <div className="grid gap-3">
          {fees.map((fee) => (
            <Card key={fee.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm">{fee.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {TYPE_LABELS[fee.type]}
                    </Badge>
                    {fee.late_fee != null && fee.late_fee > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                        +৳{fee.late_fee} late
                      </Badge>
                    )}
                    {!fee.is_active && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-semibold mt-1">৳{fee.amount.toLocaleString()}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(fee.applicable_classes ?? []).map((cls) => (
                      <span key={cls} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {cls}
                      </span>
                    ))}
                  </div>
                  {fee.due_day && (
                    <p className="text-xs text-muted-foreground mt-1.5">Due: day {fee.due_day} of month</p>
                  )}
                  {fee.due_date && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Due: {new Date(fee.due_date).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="size-8"
                    onClick={() => setEditing(fee)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(fee)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Fee Configuration</DialogTitle></DialogHeader>
          <FeeForm
            classes={classNames}
            onSubmit={(v) => createMutation.mutate(v)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Fee Configuration</DialogTitle></DialogHeader>
          {editing && (
            <FeeForm
              defaultValues={{
                name: editing.name,
                amount: editing.amount,
                type: editing.type as "monthly" | "quarterly" | "yearly" | "one_time",
                applicable_classes: editing.applicable_classes ?? [],
                due_day: editing.due_day ?? undefined,
                due_date: editing.due_date ?? "",
                late_fee: editing.late_fee ?? undefined,
              }}
              classes={classNames}
              onSubmit={(v) => updateMutation.mutate(v)}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground px-6">
            This will not affect existing bills. Future billing cycles will no longer include this fee.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
