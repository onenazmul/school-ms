"use client";
// app/(admin)/admin/finance/receipts/page.tsx

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { receiptSchema, type ReceiptInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Printer, CheckCircle2, Loader2, Receipt, Search } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  name_en: string;
  class_name: string;
  section: string | null;
};

type Bill = {
  id: string;
  fee_name: string;
  month: string | null;
  academic_year: string;
  total: number;
  due_date: string;
  status: string;
};

type GeneratedReceipt = {
  receiptNo: string;
  studentName: string;
  studentClass: string;
  bills: { description: string; amount: number }[];
  paymentMethod: string;
  receivedAmount: number;
  paymentDate: string;
  remarks?: string;
  issuedAt: string;
};

// ── Printable receipt ─────────────────────────────────────────────────────────

function PrintableReceipt({ receipt }: { receipt: GeneratedReceipt }) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${receipt.receiptNo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
        .school-name { font-size: 22px; font-weight: bold; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .label { color: #666; }
        .divider { border-top: 1px solid #ddd; margin: 12px 0; }
        .total { font-size: 16px; font-weight: bold; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  return (
    <div className="space-y-4">
      <div ref={printRef} className="border rounded-xl p-6 bg-white space-y-4 text-sm">
        <div className="text-center border-b pb-4 space-y-1">
          <p className="text-xl font-bold">School Management System</p>
          <p className="font-semibold mt-2">MONEY RECEIPT</p>
          <p className="text-xs text-muted-foreground">
            Receipt No: <strong>{receipt.receiptNo}</strong>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div><span className="text-muted-foreground">Student Name: </span><strong>{receipt.studentName}</strong></div>
          <div><span className="text-muted-foreground">Class: </span><strong>{receipt.studentClass}</strong></div>
          <div><span className="text-muted-foreground">Payment Date: </span>
            <strong>{new Date(receipt.paymentDate).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })}</strong>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground pb-1 border-b">
            <span>Description</span><span>Amount</span>
          </div>
          {receipt.bills.map((b, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
              <span>{b.description}</span>
              <span className="font-mono">৳{b.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total Received</span>
          <span className="font-mono text-green-700">৳{receipt.receivedAmount.toLocaleString()}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex gap-1">
            <span>Payment Method:</span>
            <strong className="capitalize">{receipt.paymentMethod.replace("_", " ")}</strong>
          </div>
          {receipt.remarks && (
            <div className="flex gap-1"><span>Remarks:</span><strong>{receipt.remarks}</strong></div>
          )}
        </div>
        <div className="flex justify-between items-end pt-8 mt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>Issued at: {receipt.issuedAt}</p>
          </div>
          <div className="text-center">
            <div className="border-t border-foreground w-32 pt-1">
              <p className="text-xs">Authorised Signature</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handlePrint} className="gap-2 flex-1">
          <Printer className="size-4" />Print Receipt
        </Button>
        <Button variant="outline" onClick={() => toast.info("PDF download coming soon")} className="flex-1">
          Download PDF
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReceiptsPage() {
  const [generatedReceipt, setGeneratedReceipt] = useState<GeneratedReceipt | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const form = useForm<ReceiptInput>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      studentId: "",
      billIds: [],
      paymentMethod: "cash",
      receivedAmount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      remarks: "",
    },
  });

  const watchStudentId = form.watch("studentId");

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ students: Student[] }>({
    queryKey: ["students-for-receipt", studentSearch],
    queryFn: () => fetch(`/api/v1/admin/students?status=Active&limit=100${studentSearch ? `&q=${encodeURIComponent(studentSearch)}` : ""}`).then((r) => r.json()),
  });

  // Fetch pending bills for selected student
  const { data: billsData, isLoading: billsLoading } = useQuery<{ bills: Bill[] }>({
    queryKey: ["student-pending-bills", watchStudentId],
    queryFn: () => fetch(`/api/v1/admin/finance/bills?studentId=${watchStudentId}&status=unpaid`).then((r) => r.json()),
    enabled: !!watchStudentId,
  });

  const students = studentsData?.students ?? [];
  const pendingBills = billsData?.bills ?? [];
  const selectedStudent = students.find((s) => s.id === watchStudentId);

  const selectedBillTotal = pendingBills
    .filter((b) => selectedBills.includes(b.id))
    .reduce((s, b) => s + b.total, 0);

  function toggleBill(id: string) {
    const next = selectedBills.includes(id)
      ? selectedBills.filter((b) => b !== id)
      : [...selectedBills, id];
    setSelectedBills(next);
    form.setValue("billIds", next);
    const total = pendingBills
      .filter((b) => next.includes(b.id))
      .reduce((s, b) => s + b.total, 0);
    form.setValue("receivedAmount", total);
  }

  const mutation = useMutation({
    mutationFn: (values: ReceiptInput) =>
      fetch("/api/v1/admin/finance/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: values.studentId,
          billIds: values.billIds,
          paymentMethod: values.paymentMethod,
          receivedAmount: values.receivedAmount,
          paymentDate: values.paymentDate,
          notes: values.remarks || undefined,
        }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
        return r.json();
      }),
    onSuccess: (data, values) => {
      const bills = pendingBills.filter((b) => values.billIds.includes(b.id));
      setGeneratedReceipt({
        receiptNo: data.receipt.receipt_number,
        studentName: selectedStudent?.name_en ?? "Unknown",
        studentClass: `${selectedStudent?.class_name ?? ""}${selectedStudent?.section ? `-${selectedStudent.section}` : ""}`,
        bills: bills.map((b) => ({
          description: b.month ? `${b.fee_name} — ${b.month} ${b.academic_year}` : `${b.fee_name} ${b.academic_year}`,
          amount: b.total,
        })),
        paymentMethod: values.paymentMethod,
        receivedAmount: values.receivedAmount,
        paymentDate: values.paymentDate,
        remarks: values.remarks,
        issuedAt: new Date().toLocaleString("en-BD"),
      });
      toast.success("Receipt generated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Money Receipts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Collect payments and generate receipts</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/finance/receipts/history">View History</a>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="size-4" />New Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                {/* Student search + select */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      className="pl-8 h-9 text-sm"
                      placeholder="Search student by name…"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            setSelectedBills([]);
                            form.setValue("billIds", []);
                            form.setValue("receivedAmount", 0);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={studentsLoading ? "Loading…" : "Select student"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name_en} — Class {s.class_name}{s.section ? `-${s.section}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pending bills */}
                {watchStudentId && (
                  <div>
                    <p className="text-sm font-medium mb-2">Pending Bills</p>
                    {billsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : pendingBills.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 className="size-4" />
                        No pending bills for this student
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingBills.map((bill) => {
                          const checked = selectedBills.includes(bill.id);
                          const label = bill.month
                            ? `${bill.fee_name} — ${bill.month} ${bill.academic_year}`
                            : `${bill.fee_name} ${bill.academic_year}`;
                          return (
                            <button
                              key={bill.id}
                              type="button"
                              onClick={() => toggleBill(bill.id)}
                              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                checked ? "border-indigo-300 bg-indigo-50" : "border-border hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-left">
                                <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                                  checked ? "bg-indigo-600 border-indigo-600" : "border-muted-foreground/40"
                                }`}>
                                  {checked && (
                                    <svg viewBox="0 0 10 8" className="size-2.5 fill-white">
                                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" />
                                    </svg>
                                  )}
                                </div>
                                <span>{label}</span>
                              </div>
                              <span className="font-mono font-medium ml-2 shrink-0">
                                ৳{bill.total.toLocaleString()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage>{form.formState.errors.billIds?.message}</FormMessage>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {["cash", "bank_transfer", "cheque", "online"].map((m) => (
                              <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="receivedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount Received
                        {selectedBillTotal > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (bills total: ৳{selectedBillTotal.toLocaleString()})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Paid via bKash ref: 123" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={mutation.isPending || !selectedBills.length}
                >
                  {mutation.isPending ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" />Processing…</>
                  ) : (
                    "Generate Receipt"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Generated receipt */}
        <div>
          {generatedReceipt ? (
            <PrintableReceipt receipt={generatedReceipt} />
          ) : (
            <div className="h-full min-h-64 rounded-xl border border-dashed flex items-center justify-center text-sm text-muted-foreground">
              Receipt preview will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
