import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any).role !== "student")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { studentId: true, admissionId: true },
  });
  if (!user?.studentId) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  const [receipts, feeSubmissions, admissionSubmissions] = await Promise.all([
    // Admin-issued / auto-created receipts (Receipt model)
    db.receipt.findMany({
      where: { studentId: user.studentId },
      include: {
        items: {
          include: { bill: { include: { feeConfig: { select: { name: true } } } } },
        },
      },
      orderBy: { paymentDate: "desc" },
    }),

    // Fee payment submissions (student-submitted)
    db.paymentSubmission.findMany({
      where: {
        studentId: user.studentId,
        paymentContext: { in: ["fee", "exam_fee"] },
        status: { in: ["pending", "under_review", "verified"] },
      },
      include: {
        submissionItems: {
          include: { bill: { include: { feeConfig: { select: { name: true } } } } },
        },
        bill: { include: { feeConfig: { select: { name: true } } } },
      },
      orderBy: { submittedAt: "desc" },
    }),

    // Admission + enrollment payment submissions
    user.admissionId
      ? db.paymentSubmission.findMany({
          where: {
            admissionId: user.admissionId,
            paymentContext: { in: ["admission", "enrollment"] },
            status: { in: ["pending", "under_review", "verified"] },
          },
          orderBy: { submittedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  type Entry = {
    id: string;
    download_url: string | null;
    source: "fee_receipt" | "admission_payment" | "enrollment_payment" | "fee_submission";
    status: string;
    receipt_number: string | null;
    payment_method: string;
    amount: number;
    payment_date: string;
    issued_by: string | null;
    items: { name: string; amount: number }[];
  };

  // Map receiptNumber → submission ID so Receipt entries can use the submission PDF URL
  const receiptNumToSubId = new Map<string, string>(
    feeSubmissions
      .filter((s) => s.status === "verified" && s.receiptNumber)
      .map((s) => [s.receiptNumber!, s.id]),
  );

  // Receipt entries — prefer submission PDF when available; fall back to fee-receipt endpoint
  const receiptEntries: Entry[] = receipts.map((r) => {
    const subId = receiptNumToSubId.get(r.receiptNumber);
    return {
      id: r.id,
      download_url: subId
        ? `/api/documents/payment-receipt/${subId}`
        : `/api/documents/payment-receipt/fee-receipt/${r.id}`,
      source: "fee_receipt",
      status: "verified",
      receipt_number: r.receiptNumber,
      payment_method: r.paymentMethod,
      amount: Number(r.receivedAmount),
      payment_date: r.paymentDate.toISOString().split("T")[0],
      issued_by: r.createdBy,
      items: r.items.map((item) => ({
        name: item.bill.feeConfig.name,
        amount: Number(item.amount),
      })),
    };
  });

  // Verified receipt numbers already shown via receiptEntries — don't duplicate
  const receiptNumbers = new Set(receipts.map((r) => r.receiptNumber));

  // Fee submissions: show pending/under_review always; show verified only if no Receipt was created
  const feeSubmissionEntries: Entry[] = feeSubmissions
    .filter(
      (s) =>
        s.status === "pending" ||
        s.status === "under_review" ||
        (s.status === "verified" && (!s.receiptNumber || !receiptNumbers.has(s.receiptNumber))),
    )
    .map((s) => ({
      id: s.id,
      download_url: `/api/documents/payment-receipt/${s.id}`,
      source: "fee_submission" as const,
      status: s.status,
      receipt_number: s.receiptNumber ?? null,
      payment_method: s.method,
      amount: Number(s.amountSent),
      payment_date: (s.verifiedAt ?? s.submittedAt).toISOString().split("T")[0],
      issued_by: s.verifiedBy ?? null,
      items:
        s.submissionItems.length > 0
          ? s.submissionItems.map((si) => ({
              name: si.bill.feeConfig.name,
              amount: Number(si.amount),
            }))
          : s.bill
            ? [{ name: s.bill.feeConfig.name, amount: Number(s.amountSent) }]
            : [{ name: "Fee Payment", amount: Number(s.amountSent) }],
    }));

  // Admission / enrollment submissions
  const admissionEntries: Entry[] = admissionSubmissions.map((s) => ({
    id: s.id,
    download_url: `/api/documents/payment-receipt/${s.id}`,
    source: s.paymentContext === "enrollment" ? "enrollment_payment" : "admission_payment",
    status: s.status,
    receipt_number: s.receiptNumber ?? null,
    payment_method: s.method,
    amount: Number(s.amountSent),
    payment_date: (s.verifiedAt ?? s.submittedAt).toISOString().split("T")[0],
    issued_by: s.verifiedBy ?? null,
    items: [
      {
        name: s.paymentContext === "enrollment" ? "Enrollment Fee" : "Admission Fee",
        amount: Number(s.amountSent),
      },
    ],
  }));

  const all = [...receiptEntries, ...feeSubmissionEntries, ...admissionEntries].sort(
    (a, b) => b.payment_date.localeCompare(a.payment_date),
  );

  return NextResponse.json({ receipts: all });
}
