"use client";
// app/(admin)/admin/students/[id]/page.tsx

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, MapPin, Receipt, Pencil, CheckCircle2,
  FileText, RefreshCw, ExternalLink, Plus, Ban, Trash2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Bill = {
  id: string;
  name: string;
  amount: number;
  late_fee: number;
  due_date: string;
  month: string | null;
  academic_year: string;
  status: string;
  created_at: string;
};

type ReceiptItem = { bill_id: string; bill_name: string; amount: number };

type StudentReceipt = {
  id: string;
  receipt_number: string;
  payment_method: string;
  received_amount: number;
  payment_date: string;
  created_by: string;
  notes: string | null;
  items: ReceiptItem[];
};

type StudentProfile = {
  id: string;
  admission_id: number;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  academic_year: string;
  session_name: string | null;
  status: string;
  enrolled_at: string;
  username: string | null;
  email: string | null;
  name_en: string;
  name_bn: string | null;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  nationality: string | null;
  birth_certificate_no: string | null;
  photo: string | null;
  present_village: string | null;
  present_post: string | null;
  present_upazilla: string | null;
  present_zilla: string | null;
  present_post_code: string | null;
  guardian_name: string | null;
  guardian_mobile: string | null;
  guardian_relation: string | null;
  guardian_occupation: string | null;
  father_name: string | null;
  father_name_bn: string | null;
  father_mobile: string | null;
  mother_name: string | null;
  mother_name_bn: string | null;
  mother_mobile: string | null;
  previous_institute_name: string | null;
  bills: Bill[];
  receipts: StudentReceipt[];
};

interface FeeConfig { id: string; name: string; amount: number; type: string; is_active: boolean }

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
}
function statusColor(s: string) {
  switch (s) {
    case "Active":      return "bg-green-50 text-green-700 border-green-200";
    case "Inactive":    return "bg-slate-50 text-slate-500 border-slate-200";
    case "Graduated":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "Transferred": return "bg-orange-50 text-orange-700 border-orange-200";
    default:            return "bg-slate-50 text-slate-500 border-slate-200";
  }
}
function billStatusColor(s: string) {
  switch (s) {
    case "paid":    return "bg-green-50 text-green-700 border-green-200";
    case "partial": return "bg-amber-50 text-amber-700 border-amber-200";
    case "waived":  return "bg-blue-50 text-blue-700 border-blue-200";
    default:        return "bg-red-50 text-red-700 border-red-200";
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-dashed last:border-0">
      <span className="text-muted-foreground shrink-0 pr-3">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

// ── Add-bill form schema ──────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

const addBillSchema = z.object({
  feeConfigId:    z.string().min(1, "Select a fee type"),
  month:          z.string().optional(),
  year:           z.coerce.number().min(2020).max(2099),
  dueDate:        z.string().min(1, "Due date required"),
  overrideAmount: z.coerce.number().positive().optional().or(z.literal("")),
});
type AddBillInput = z.infer<typeof addBillSchema>;

// ── Bills tab ─────────────────────────────────────────────────────────────────

function BillsTab({ student, onRefresh }: { student: StudentProfile; onRefresh: () => void }) {
  const [addOpen, setAddOpen]   = useState(false);
  const [waiveTarget, setWaiveTarget] = useState<Bill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);

  const { data: feesData } = useQuery<{ fees: FeeConfig[] }>({
    queryKey: ["fee-configs"],
    queryFn: () => fetch("/api/v1/admin/fee-configs").then((r) => r.json()),
  });
  const activeFees = (feesData?.fees ?? []).filter((f) => f.is_active);

  const form = useForm<AddBillInput>({
    resolver: zodResolver(addBillSchema),
    defaultValues: {
      feeConfigId: "", month: "", year: new Date().getFullYear(),
      dueDate: "", overrideAmount: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: AddBillInput) => {
      const res = await fetch("/api/v1/admin/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          feeConfigId: values.feeConfigId,
          month: (values.month && values.month !== "none") ? values.month : undefined,
          year: String(values.year),
          dueDate: values.dueDate,
          overrideAmount: values.overrideAmount || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      return res.json();
    },
    onSuccess: () => { toast.success("Bill added"); setAddOpen(false); form.reset(); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const waiveMutation = useMutation({
    mutationFn: async (billId: string) => {
      const res = await fetch(`/api/v1/admin/bills/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "waived" }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
    },
    onSuccess: () => { toast.success("Bill waived"); setWaiveTarget(null); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (billId: string) => {
      const res = await fetch(`/api/v1/admin/bills/${billId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
    },
    onSuccess: () => { toast.success("Bill deleted"); setDeleteTarget(null); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedFee = activeFees.find((f) => f.id === form.watch("feeConfigId"));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {student.bills.length} bill{student.bills.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" /> Add Bill
        </Button>
      </div>

      {student.bills.length === 0 ? (
        <div className="border rounded-xl py-14 text-center">
          <FileText className="size-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm text-muted-foreground">No bills yet. Add one or use Bulk Billing.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground font-medium">
                <th className="text-left py-3 px-4">Fee</th>
                <th className="text-left py-3 px-4">Period</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-right py-3 px-4">Late Fee</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Due Date</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {student.bills.map((b) => (
                <tr key={b.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium">{b.name}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {b.month ? `${b.month} ${b.academic_year}` : b.academic_year}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm">৳{b.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-amber-600">
                    {b.late_fee > 0 ? `৳${b.late_fee.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                    {fmtShort(b.due_date)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={`text-xs capitalize ${billStatusColor(b.status)}`}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      {(b.status === "unpaid" || b.status === "partial") && (
                        <Button
                          variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-blue-600"
                          title="Waive bill"
                          onClick={() => setWaiveTarget(b)}
                        >
                          <Ban className="size-3.5" />
                        </Button>
                      )}
                      {b.status !== "paid" && (
                        <Button
                          variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive"
                          title="Delete bill"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Bill Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="feeConfigId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select fee type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {activeFees.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} — ৳{f.amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="month" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month (opt.)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl><Input type="number" min="2020" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="overrideAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount (৳)
                    {selectedFee && (
                      <span className="font-normal text-muted-foreground ml-1">
                        — default ৳{selectedFee.amount.toLocaleString()}
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder={selectedFee ? String(selectedFee.amount) : ""} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding…" : "Add Bill"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Waive confirm */}
      <AlertDialog open={waiveTarget !== null} onOpenChange={(o) => { if (!o) setWaiveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Waive this bill?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground px-6">
            Mark <strong>{waiveTarget?.name}{waiveTarget?.month ? ` — ${waiveTarget.month}` : ""}</strong> (৳{waiveTarget?.amount.toLocaleString()}) as waived.
            The student will no longer be required to pay it.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => waiveTarget && waiveMutation.mutate(waiveTarget.id)}
              disabled={waiveMutation.isPending}
            >
              Waive Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground px-6">
            Permanently delete <strong>{deleteTarget?.name}</strong>. This cannot be undone.
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
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-start gap-5">
        <Skeleton className="size-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<{ student: StudentProfile }>({
    queryKey: ["admin-student", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/students/${id}`);
      if (!res.ok) throw new Error("Failed to load student");
      return res.json();
    },
    staleTime: 30_000,
  });

  const student = data?.student;

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !student) {
    return (
      <div className="space-y-4">
        <Link href="/admin/students" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Students
        </Link>
        <div className="border rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Failed to load student profile.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = student.receipts.reduce((s, r) => s + r.received_amount, 0);
  const totalDue  = student.bills
    .filter((b) => b.status === "unpaid" || b.status === "partial")
    .reduce((s, b) => s + b.amount + b.late_fee, 0);

  const address = [student.present_village, student.present_post, student.present_upazilla, student.present_zilla]
    .filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/admin/students"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Students
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/admissions/${student.admission_id}`}>
              <ExternalLink className="size-3.5 mr-1.5" /> View Admission
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/students/${id}/edit`}>
              <Pencil className="size-3.5 mr-1.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 flex-wrap">
        <Avatar className="size-16 shrink-0">
          <AvatarFallback className="text-xl font-semibold bg-indigo-50 text-indigo-700">
            {initials(student.name_en)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{student.name_en}</h1>
            {student.name_bn && <span className="text-sm text-muted-foreground">{student.name_bn}</span>}
            <Badge variant="outline" className={statusColor(student.status)}>{student.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {student.class_name}
            {student.section ? ` · Section ${student.section}` : ""}
            {student.roll_number ? ` · Roll ${student.roll_number}` : ""}
            {student.username ? ` · @${student.username}` : ""}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {student.guardian_mobile && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="size-3" /> {student.guardian_mobile}
              </span>
            )}
            {address && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {address}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold">৳{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <p className={`text-2xl font-semibold ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
              ৳{totalDue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="bills">
            Bills
            {student.bills.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5">
                {student.bills.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="receipts">
            Receipts
            {student.receipts.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5">
                {student.receipts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="info" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Date of Birth"    value={fmtDate(student.dob)} />
                <InfoRow label="Gender"           value={student.gender} />
                <InfoRow label="Blood Group"      value={student.blood_group} />
                <InfoRow label="Nationality"      value={student.nationality} />
                <InfoRow label="Birth Cert. No."  value={student.birth_certificate_no} />
                <InfoRow label="Previous School"  value={student.previous_institute_name} />
                <InfoRow label="Academic Year"    value={student.academic_year} />
                <InfoRow label="Session"          value={student.session_name} />
                <InfoRow label="Enrolled"         value={fmtDate(student.enrolled_at)} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow label="Name"       value={student.guardian_name} />
                  <InfoRow label="Relation"   value={student.guardian_relation} />
                  <InfoRow label="Phone"      value={student.guardian_mobile} />
                  <InfoRow label="Occupation" value={student.guardian_occupation} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Parents</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow label="Father (EN)"   value={student.father_name} />
                  <InfoRow label="Father (BN)"   value={student.father_name_bn} />
                  <InfoRow label="Father Mobile" value={student.father_mobile} />
                  <InfoRow label="Mother (EN)"   value={student.mother_name} />
                  <InfoRow label="Mother (BN)"   value={student.mother_name_bn} />
                  <InfoRow label="Mother Mobile" value={student.mother_mobile} />
                </CardContent>
              </Card>
              {address && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Address</CardTitle></CardHeader>
                  <CardContent className="space-y-0">
                    <InfoRow label="Village"   value={student.present_village} />
                    <InfoRow label="Post"      value={student.present_post} />
                    <InfoRow label="Post Code" value={student.present_post_code} />
                    <InfoRow label="Upazilla"  value={student.present_upazilla} />
                    <InfoRow label="Zilla"     value={student.present_zilla} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills" className="mt-4">
          <BillsTab
            student={student}
            onRefresh={() => qc.invalidateQueries({ queryKey: ["admin-student", id] })}
          />
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="mt-4">
          {student.receipts.length === 0 ? (
            <div className="border rounded-xl py-14 text-center">
              <Receipt className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">No receipts recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.receipts.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-medium text-sm">{r.receipt_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtShort(r.payment_date)} · {r.payment_method.replace(/_/g, " ")}
                          {r.created_by && ` · by ${r.created_by}`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.items.map((item) => (
                            <span key={item.bill_id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {item.bill_name}
                              {r.items.length > 1 && ` ৳${item.amount.toLocaleString()}`}
                            </span>
                          ))}
                        </div>
                        {r.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">{r.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">৳{r.received_amount.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="size-3 mr-1" /> Paid
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
