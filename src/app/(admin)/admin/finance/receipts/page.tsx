"use client";
// app/(admin)/admin/finance/receipts/page.tsx

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Printer, CheckCircle2, Loader2, Receipt } from "lucide-react";

const STUDENTS = [
  { id: "S001", name: "Rahim Uddin",   class: "9A" },
  { id: "S002", name: "Fatema Begum",  class: "6B" },
  { id: "S003", name: "Karim Hossain", class: "10C" },
  { id: "S004", name: "Nasrin Akter",  class: "8A" },
];

const PENDING_BILLS: Record<string, { id: string; description: string; amount: number; due: string }[]> = {
  S001: [{ id: "B001", description: "Tuition Fee - May 2025", amount: 5500, due: "2025-05-10" }],
  S002: [
    { id: "B002", description: "Tuition Fee - May 2025", amount: 5500, due: "2025-05-10" },
    { id: "B003", description: "Exam Fee - Q2 2025", amount: 1200, due: "2025-05-05" },
  ],
  S003: [{ id: "B004", description: "Tuition Fee - May 2025 (Partial)", amount: 2500, due: "2025-05-10" }],
  S004: [],
};

type GeneratedReceipt = {
  receiptNo: string;
  student: (typeof STUDENTS)[0];
  bills: { description: string; amount: number }[];
  paymentMethod: string;
  receivedAmount: number;
  paymentDate: string;
  remarks?: string;
  issuedBy: string;
  issuedAt: string;
};

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
        .receipt-title { font-size: 14px; color: #555; margin-top: 4px; }
        .receipt-no { font-size: 13px; font-weight: 600; margin-top: 8px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .label { color: #666; }
        .divider { border-top: 1px solid #ddd; margin: 12px 0; }
        .total { font-size: 16px; font-weight: bold; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; }
        .sig { margin-top: 48px; display: flex; justify-content: flex-end; }
        .sig-line { border-top: 1px solid #111; width: 160px; text-align: center; padding-top: 4px; font-size: 11px; }
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
      <div
        ref={printRef}
        className="border rounded-xl p-6 bg-white space-y-4 text-sm"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center border-b pb-4 space-y-1">
          <p className="text-xl font-bold">Bright Future School</p>
          <p className="text-muted-foreground text-xs">
            123 Education Road, Sirajganj, Bangladesh
          </p>
          <p className="font-semibold mt-2">MONEY RECEIPT</p>
          <p className="text-xs text-muted-foreground">
            Receipt No: <strong>{receipt.receiptNo}</strong>
          </p>
        </div>

        {/* Student info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <span className="text-muted-foreground">Student Name: </span>
            <strong>{receipt.student.name}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Class: </span>
            <strong>{receipt.student.class}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Student ID: </span>
            <strong>{receipt.student.id}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Date: </span>
            <strong>
              {new Date(receipt.paymentDate).toLocaleDateString("en-BD", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </strong>
          </div>
        </div>

        <Separator />

        {/* Bill items */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground pb-1 border-b">
            <span>Description</span>
            <span>Amount</span>
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
            <div className="flex gap-1">
              <span>Remarks:</span>
              <strong>{receipt.remarks}</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-8 mt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>Issued by: {receipt.issuedBy}</p>
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
          <Printer className="size-4" />
          Print Receipt
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("PDF download coming soon")}
          className="flex-1"
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  const [generatedReceipt, setGeneratedReceipt] = useState<GeneratedReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);

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
  const pendingBills = watchStudentId ? PENDING_BILLS[watchStudentId] ?? [] : [];
  const selectedStudent = STUDENTS.find((s) => s.id === watchStudentId);

  const selectedBillTotal = pendingBills
    .filter((b) => selectedBills.includes(b.id))
    .reduce((s, b) => s + b.amount, 0);

  function toggleBill(id: string) {
    const next = selectedBills.includes(id)
      ? selectedBills.filter((b) => b !== id)
      : [...selectedBills, id];
    setSelectedBills(next);
    form.setValue("billIds", next);
    const total = pendingBills
      .filter((b) => next.includes(b.id))
      .reduce((s, b) => s + b.amount, 0);
    form.setValue("receivedAmount", total);
  }

  async function onSubmit(values: ReceiptInput) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);

    const bills = pendingBills.filter((b) => values.billIds.includes(b.id));
    setGeneratedReceipt({
      receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
      student: selectedStudent!,
      bills: bills.map((b) => ({ description: b.description, amount: b.amount })),
      paymentMethod: values.paymentMethod,
      receivedAmount: values.receivedAmount,
      paymentDate: values.paymentDate,
      remarks: values.remarks,
      issuedBy: "Admin",
      issuedAt: new Date().toLocaleString("en-BD"),
    });

    toast.success("Receipt generated!");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Money Receipts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Collect payments and generate receipts
          </p>
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
              <Receipt className="size-4" />
              New Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STUDENTS.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} — Class {s.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pending bills */}
                {watchStudentId && (
                  <div>
                    <p className="text-sm font-medium mb-2">Pending Bills</p>
                    {pendingBills.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 className="size-4" />
                        No pending bills for this student
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingBills.map((bill) => {
                          const checked = selectedBills.includes(bill.id);
                          return (
                            <button
                              key={bill.id}
                              type="button"
                              onClick={() => toggleBill(bill.id)}
                              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                checked
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-border hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-left">
                                <div
                                  className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                                    checked
                                      ? "bg-indigo-600 border-indigo-600"
                                      : "border-muted-foreground/40"
                                  }`}
                                >
                                  {checked && (
                                    <svg viewBox="0 0 10 8" className="size-2.5 fill-white">
                                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" />
                                    </svg>
                                  )}
                                </div>
                                <span>{bill.description}</span>
                              </div>
                              <span className="font-mono font-medium ml-2 shrink-0">
                                ৳{bill.amount.toLocaleString()}
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
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["cash","bank_transfer","cheque","online"].map((m) => (
                              <SelectItem key={m} value={m} className="capitalize">
                                {m.replace("_", " ")}
                              </SelectItem>
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
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                  disabled={loading || !selectedBills.length}
                >
                  {loading ? (
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
