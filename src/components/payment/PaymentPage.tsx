"use client";
// components/payment/PaymentPage.tsx
// Shared payment submission page — works for both admission and exam_fee contexts.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/utils/format";
import { fetchAndDownload } from "@/lib/documents/download-helpers";
import { PAYMENT_ACCOUNT_CONFIG } from "@/lib/mock-data/payments";
import type { PaymentSubmission, PaymentContext, PaymentMethod } from "@/lib/mock-data/payments";

// ── UI ────────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Copy, Check,
  Download, Loader2, CreditCard, RotateCcw, Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentPageContext = {
  paymentContext: PaymentContext;
  entityId: string;
  entityLabel: string;
  payerName: string;
  totalFee: number;
  amountPaid: number;
  dueDate?: string;
  feeDescription: string;
  backHref: string;
  existingSubmissions?: PaymentSubmission[];
  onSubmitPayment?: (values: PaymentFormValues) => Promise<void>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema — conditional validation per method
// ─────────────────────────────────────────────────────────────────────────────

const paymentSchema = z.object({
  method: z.enum(["bkash", "rocket", "bank_transfer"], {
    required_error: "Select a payment method",
  }),
  // bKash / Rocket
  transactionId:      z.string().optional(),
  phoneNumber:        z.string().optional(),
  // Bank Transfer
  accountHolderName:  z.string().optional(),
  branch:             z.string().optional(),
  depositSlipNo:      z.string().optional(),
  // Common
  amountSent: z.coerce.number({ invalid_type_error: "Enter an amount" })
    .positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required").refine(
    (d) => new Date(d) <= new Date(),
    "Payment date cannot be in the future",
  ),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.method === "bkash" || data.method === "rocket") {
    if (!data.transactionId || data.transactionId.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Transaction ID must be at least 6 characters", path: ["transactionId"] });
    } else if (!/^[a-zA-Z0-9-]+$/.test(data.transactionId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only letters, digits and hyphens", path: ["transactionId"] });
    }
    if (!data.phoneNumber || !/^01[0-9]{9}$/.test(data.phoneNumber)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid BD phone number (01XXXXXXXXX)", path: ["phoneNumber"] });
    }
  }
  if (data.method === "bank_transfer") {
    if (!data.accountHolderName || data.accountHolderName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account holder name is required", path: ["accountHolderName"] });
    }
  }
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

type MethodKey = "bkash" | "rocket" | "bank_transfer";

// ─────────────────────────────────────────────────────────────────────────────
// CopyableField
// ─────────────────────────────────────────────────────────────────────────────

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono font-semibold mt-0.5">{value}</p>
      </div>
      <button
        onClick={copy}
        className="p-1.5 rounded-md hover:bg-black/5 transition-colors ml-2 shrink-0"
        title={`Copy ${label}`}
      >
        {copied
          ? <Check className="size-4 text-green-600" />
          : <Copy className="size-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MethodInstructions — tab content for each method
// ─────────────────────────────────────────────────────────────────────────────

function MethodInstructions({ method }: { method: MethodKey }) {
  const cfg = PAYMENT_ACCOUNT_CONFIG;

  if (method === "bkash") {
    return (
      <div className="space-y-1 pt-1">
        <CopyableField label="bKash Number"  value={cfg.bkash.number} />
        <CopyableField label="Account Type"  value={String(cfg.bkash.accountType).charAt(0).toUpperCase() + String(cfg.bkash.accountType).slice(1)} />
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{cfg.bkash.instructions}</p>
      </div>
    );
  }
  if (method === "rocket") {
    return (
      <div className="space-y-1 pt-1">
        <CopyableField label="Rocket Number" value={cfg.rocket.number} />
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{cfg.rocket.instructions}</p>
      </div>
    );
  }
  return (
    <div className="space-y-1 pt-1">
      <CopyableField label="Bank"           value={cfg.bank.bankName} />
      <CopyableField label="Branch"         value={cfg.bank.branchName} />
      <CopyableField label="Account Name"   value={cfg.bank.accountName} />
      <CopyableField label="Account No."    value={cfg.bank.accountNumber} />
      <CopyableField label="Routing No."    value={cfg.bank.routingNumber} />
      {cfg.bank.swiftCode && (
        <CopyableField label="SWIFT Code"   value={cfg.bank.swiftCode} />
      )}
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{cfg.bank.instructions}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MethodFields — form fields that change per payment method
// ─────────────────────────────────────────────────────────────────────────────

function MethodFields({ form }: { form: ReturnType<typeof useForm<PaymentFormValues>> }) {
  const method = form.watch("method") as MethodKey | undefined;

  if (!method) return null;

  if (method === "bkash" || method === "rocket") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="transactionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction ID *</FormLabel>
              <FormControl>
                <Input placeholder={method === "bkash" ? "e.g. TXN8K7J2X1M9" : "e.g. RKT99X2M441"} className="font-mono" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number Used *</FormLabel>
              <FormControl>
                <Input placeholder="01XXXXXXXXX" type="tel" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  // bank_transfer
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="accountHolderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Holder Name *</FormLabel>
              <FormControl>
                <Input placeholder="Name on bank account" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Gurudaspur Branch" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="depositSlipNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deposit Slip / Ref No. <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. SNLB202601234" className="font-mono" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="01XXXXXXXXX" type="tel" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentStatusCard
// ─────────────────────────────────────────────────────────────────────────────

function PaymentStatusCard({
  submission,
  onResubmit,
  onDownloadReceipt,
  downloadingReceipt,
}: {
  submission: PaymentSubmission;
  onResubmit?: () => void;
  onDownloadReceipt?: () => void;
  downloadingReceipt?: boolean;
}) {
  const isVerified = submission.status === "verified";
  const isRejected = submission.status === "rejected";
  const isPending  = !isVerified && !isRejected;

  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
  const methodLabel = (m: string) =>
    m === "bkash" ? "bKash" : m === "rocket" ? "Rocket" : "Bank Transfer";

  const isBankTransfer = submission.method === "bank_transfer";

  const rows: [string, string][] = [
    ["Method", methodLabel(submission.method)],
    ...(isBankTransfer
      ? ([
          submission.accountHolderName ? ["Account Holder", submission.accountHolderName] : null,
          submission.branch            ? ["Branch",         submission.branch]            : null,
          submission.depositSlipNo     ? ["Slip / Ref No.", submission.depositSlipNo]     : null,
          submission.phoneNumber       ? ["Phone",          submission.phoneNumber]        : null,
        ].filter(Boolean) as [string, string][])
      : ([
          ["Transaction ID", submission.transactionId],
          ["Phone Number",   submission.phoneNumber],
        ] as [string, string][])),
    ["Amount Sent",    formatBDT(submission.amountSent)],
    ["Payment Date",   fmtD(submission.paymentDate)],
    ["Submitted At",   fmtD(submission.submittedAt)],
    ...(isVerified && submission.verifiedAt ? [["Verified On", fmtD(submission.verifiedAt)] as [string, string]] : []),
  ];

  return (
    <div className={cn(
      "rounded-xl border p-5 space-y-4",
      isVerified ? "bg-green-50 border-green-200" :
      isRejected ? "bg-red-50 border-red-200"     :
      "bg-amber-50 border-amber-200",
    )}>
      <div className="flex items-start gap-3">
        {isVerified && <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />}
        {isPending  && <Clock        className="size-5 text-amber-600 shrink-0 mt-0.5" />}
        {isRejected && <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />}
        <div>
          <p className={cn("font-semibold text-sm",
            isVerified ? "text-green-800" : isRejected ? "text-red-800" : "text-amber-800")}>
            {isVerified ? "Payment Verified ✓" :
             isRejected ? "Submission Returned for Correction" :
             submission.status === "under_review" ? "Payment Under Review" :
             "Payment Proof Submitted"}
          </p>
          <p className={cn("text-xs mt-0.5",
            isVerified ? "text-green-700" : isRejected ? "text-red-700" : "text-amber-700")}>
            {isVerified
              ? "Your payment has been verified by the school admin."
              : isRejected
              ? "Please see the admin note below and resubmit."
              : "Our admin team will verify your payment within 1–2 business days."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xs font-medium mt-0.5 font-mono break-all">{value}</p>
          </div>
        ))}
      </div>

      {isRejected && submission.adminNote && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-800 mb-1">Admin Note</p>
          <p className="text-xs text-red-700">{submission.adminNote}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {isVerified && onDownloadReceipt && (
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={onDownloadReceipt}
            disabled={downloadingReceipt}
          >
            {downloadingReceipt
              ? <><Loader2 className="size-3.5 animate-spin" />Downloading…</>
              : <><Download className="size-3.5" />Download Receipt</>}
          </Button>
        )}
        {isRejected && onResubmit && (
          <Button size="sm" variant="outline" className="gap-2" onClick={onResubmit}>
            <RotateCcw className="size-3.5" />Resubmit Payment Details
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PaymentPage (exported)
// ─────────────────────────────────────────────────────────────────────────────

export function PaymentPage({ ctx }: { ctx: PaymentPageContext }) {
  const amountDue  = ctx.totalFee - ctx.amountPaid;
  const isFullyPaid = amountDue <= 0;

  const existingSubs  = ctx.existingSubmissions ?? [];
  const latestSub     = existingSubs.at(-1) ?? null;
  const hasPendingSub = existingSubs.some((s) => s.status === "pending" || s.status === "under_review");
  const hasVerifiedSub = existingSubs.some((s) => s.status === "verified");
  const lastRejected  = existingSubs.filter((s) => s.status === "rejected").at(-1);

  const [showForm, setShowForm]       = useState(!latestSub || latestSub.status === "rejected");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState<PaymentSubmission | null>(null);
  const [downloading, setDownloading] = useState(false);

  const verifiedSub = existingSubs.find((s) => s.status === "verified");
  const displaySub  = submitted ?? latestSub;

  // Determine initial method from a rejected submission so the right tab is pre-selected
  const initialMethod = (lastRejected?.method ?? undefined) as MethodKey | undefined;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method:             initialMethod,
      transactionId:      lastRejected?.transactionId      ?? "",
      phoneNumber:        lastRejected?.phoneNumber         ?? "",
      accountHolderName:  lastRejected?.accountHolderName  ?? "",
      branch:             lastRejected?.branch              ?? "",
      depositSlipNo:      lastRejected?.depositSlipNo       ?? "",
      amountSent:         lastRejected?.amountSent          ?? (undefined as unknown as number),
      paymentDate:        lastRejected?.paymentDate         ?? "",
      notes:              lastRejected?.notes               ?? "",
    },
  });

  const watchedMethod = form.watch("method") as MethodKey | undefined;

  function handleTabChange(value: string) {
    const next = value as MethodKey;
    if (next === watchedMethod) return;
    // Clear method-specific fields when switching tabs
    form.setValue("method", next, { shouldValidate: false });
    form.resetField("transactionId");
    form.resetField("phoneNumber");
    form.resetField("accountHolderName");
    form.resetField("branch");
    form.resetField("depositSlipNo");
    form.clearErrors();
  }

  async function handleSubmit(values: PaymentFormValues) {
    if (hasPendingSub && latestSub?.status !== "rejected") {
      toast.warning("You already have a payment under review. Please wait for admin to verify.");
      return;
    }
    setSubmitting(true);
    try {
      if (ctx.onSubmitPayment) {
        await ctx.onSubmitPayment(values);
      } else {
        // fallback mock for non-admission contexts
        await new Promise((r) => setTimeout(r, 1200));
      }

      const newSub: PaymentSubmission = {
        id: `PS-${Date.now()}`,
        paymentContext: ctx.paymentContext,
        ...(ctx.paymentContext === "admission"
          ? { applicationId: ctx.entityId }
          : { examFeeId: ctx.entityId, studentId: "" }),
        method:            values.method as PaymentMethod,
        transactionId:     values.transactionId     ?? "",
        phoneNumber:       values.phoneNumber        ?? "",
        accountHolderName: values.accountHolderName,
        branch:            values.branch,
        depositSlipNo:     values.depositSlipNo,
        amountSent:        values.amountSent,
        paymentDate:       values.paymentDate,
        notes:             values.notes,
        status:            "pending",
        submittedAt:       new Date().toISOString(),
      };
      setSubmitted(newSub);
      setShowForm(false);
      toast.success("Payment proof submitted! Admin will verify within 1–2 business days.");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadReceipt() {
    if (!verifiedSub) return;
    setDownloading(true);
    try {
      await fetchAndDownload(
        `/api/documents/payment-receipt/${verifiedSub.id}`,
        `Receipt_${ctx.entityId}_${new Date().getFullYear()}.pdf`,
      );
      toast.success("Receipt downloaded.");
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <a
            href={ctx.backHref}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
          </a>
          <h1 className="font-semibold text-sm flex-1 truncate">Payment</h1>
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
            #{ctx.entityLabel}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* ── Fee Summary ── */}
        {isFullyPaid ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Payment Complete</p>
              <p className="text-sm text-green-700 mt-0.5">
                The full {ctx.feeDescription} of {formatBDT(ctx.totalFee)} has been received.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-background p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fee Summary</p>
            <div className="space-y-2">
              {[
                ["Fee",         formatBDT(ctx.totalFee),   ""],
                ["Amount Paid", formatBDT(ctx.amountPaid), "text-green-700"],
                ["Amount Due",  formatBDT(amountDue),      amountDue > 0 ? "text-red-700 font-bold" : "text-green-700"],
              ].map(([label, value, extra]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn("font-medium", extra)}>{value}</span>
                </div>
              ))}
            </div>
            {ctx.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Info className="size-3.5 shrink-0" />
                Due by {new Date(ctx.dueDate).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        )}

        {/* ── Existing submission status ── */}
        {displaySub && !showForm && (
          <PaymentStatusCard
            submission={displaySub}
            onResubmit={() => setShowForm(true)}
            onDownloadReceipt={hasVerifiedSub ? handleDownloadReceipt : undefined}
            downloadingReceipt={downloading}
          />
        )}

        {/* ── Pending warning ── */}
        {hasPendingSub && showForm && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800">
              You already have a payment under review. Please wait for admin to verify before submitting again.
            </p>
          </div>
        )}

        {/* ── Payment method + form ── */}
        {showForm && !isFullyPaid && (
          <div className="rounded-xl border bg-background overflow-hidden">
            {/* Section title */}
            <div className="px-5 pt-5 pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pay &amp; Submit Proof
              </p>
            </div>

            {/* Method tabs — selector + instructions combined */}
            <Tabs
              value={watchedMethod ?? ""}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <div className="px-5">
                <TabsList className="w-full h-10 p-1 grid grid-cols-3">
                  <TabsTrigger value="bkash"         className="text-xs gap-1.5">
                    <span className="size-2 rounded-full bg-pink-400 shrink-0" />bKash
                  </TabsTrigger>
                  <TabsTrigger value="rocket"        className="text-xs gap-1.5">
                    <span className="size-2 rounded-full bg-purple-400 shrink-0" />Rocket
                  </TabsTrigger>
                  <TabsTrigger value="bank_transfer" className="text-xs gap-1.5">
                    <span className="size-2 rounded-full bg-blue-400 shrink-0" />Bank Transfer
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="bkash" className="px-5 pb-2 mt-0">
                <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 mt-3">
                  <MethodInstructions method="bkash" />
                </div>
              </TabsContent>
              <TabsContent value="rocket" className="px-5 pb-2 mt-0">
                <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 mt-3">
                  <MethodInstructions method="rocket" />
                </div>
              </TabsContent>
              <TabsContent value="bank_transfer" className="px-5 pb-2 mt-0">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 mt-3">
                  <MethodInstructions method="bank_transfer" />
                </div>
              </TabsContent>
            </Tabs>

            {/* If no tab selected yet, show a prompt */}
            {!watchedMethod && (
              <div className="mx-5 mb-3 mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="size-3.5 shrink-0" />
                Select a payment method above to see account details.
              </div>
            )}

            {/* Divider */}
            <div className="mx-5 my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">After paying, fill in the details below</span>
              <Separator className="flex-1" />
            </div>

            {/* Form */}
            <div className="px-5 pb-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {/* Method-specific fields */}
                  <MethodFields form={form} />

                  {!watchedMethod && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Select a payment method above to continue.
                    </p>
                  )}

                  {/* Common fields */}
                  {watchedMethod && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amountSent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Sent (৳) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 500"
                                min={1}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Date *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                max={new Date().toISOString().slice(0, 10)}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {watchedMethod && (
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional info for admin…"
                              className="resize-none min-h-16"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    disabled={submitting || !watchedMethod}
                  >
                    {submitting
                      ? <><Loader2 className="size-4 animate-spin" />Submitting…</>
                      : <><CreditCard className="size-4" />Submit Payment Proof</>}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
