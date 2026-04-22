"use client";
// app/(admin)/admin/finance/fee-config/page.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feeConfigSchema, type FeeConfigInput } from "@/lib/schemas";
import { useFeeConfigs, useCreateFeeConfig, useUpdateFeeConfig, useDeleteFeeConfig } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  one_time: "One-time",
};

// Mock data
const MOCK_FEES = [
  { id: "1", name: "Tuition Fee", amount: 5500, type: "monthly", applicableClasses: ["6","7","8","9","10"], dueDay: 10, lateFee: 200 },
  { id: "2", name: "Exam Fee", amount: 1200, type: "quarterly", applicableClasses: ["1","2","3","4","5","6","7","8","9","10"], dueDay: 5, lateFee: 0 },
  { id: "3", name: "Library Fee", amount: 500, type: "yearly", applicableClasses: ["1","2","3","4","5"], dueDay: 15, lateFee: 50 },
  { id: "4", name: "Admission Fee", amount: 15000, type: "one_time", applicableClasses: ["1","6"], dueDay: null, lateFee: 0 },
];

function FeeForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<FeeConfigInput>;
  onSubmit: (v: FeeConfigInput) => void;
  loading: boolean;
}) {
  const form = useForm<FeeConfigInput>({
    resolver: zodResolver(feeConfigSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: "monthly",
      applicableClasses: [],
      dueDay: 10,
      lateFee: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tuition Fee" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (৳)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="applicableClasses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Applicable Classes</FormLabel>
              <div className="flex flex-wrap gap-2 mt-1">
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
                      Class {cls}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Day of Month</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="31" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lateFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Late Fee (৳)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Fee Configuration
        </Button>
      </form>
    </Form>
  );
}

export default function FeeConfigPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // In production, use real query hooks:
  // const { data } = useFeeConfigs();
  // const create = useCreateFeeConfig();
  const fees = MOCK_FEES;

  function handleCreate(values: FeeConfigInput) {
    toast.success(`Fee "${values.name}" created`);
    setOpen(false);
  }

  function handleUpdate(values: FeeConfigInput) {
    toast.success(`Fee "${values.name}" updated`);
    setEditing(null);
  }

  function handleDelete(id: string, name: string) {
    toast.success(`"${name}" deleted`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fee Configuration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define fee types, amounts, and applicability
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Fee Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Fee Configuration</DialogTitle>
            </DialogHeader>
            <FeeForm onSubmit={handleCreate} loading={false} />
          </DialogContent>
        </Dialog>
      </div>

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
                  {fee.lateFee > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                      +৳{fee.lateFee} late
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-semibold mt-1">
                  ৳{fee.amount.toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {fee.applicableClasses.map((cls) => (
                    <span
                      key={cls}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                    >
                      Class {cls}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-1 shrink-0">
                <Dialog
                  open={editing?.id === fee.id}
                  onOpenChange={(o) => !o && setEditing(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditing(fee)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Fee Configuration</DialogTitle>
                    </DialogHeader>
                    {editing && (
                      <FeeForm
                        defaultValues={editing}
                        onSubmit={handleUpdate}
                        loading={false}
                      />
                    )}
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{fee.name}"?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <p className="text-sm text-muted-foreground">
                      This will not affect existing bills. Future billing cycles
                      will no longer include this fee.
                    </p>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(fee.id, fee.name)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
