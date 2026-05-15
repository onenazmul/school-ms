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

  const [receipts, admissionSubmissions] = await Promise.all([
    db.receipt.findMany({
      where: { studentId: user.studentId },
      include: {
        items: {
          include: { bill: { include: { feeConfig: { select: { name: true } } } } },
        },
      },
      orderBy: { paymentDate: "desc" },
    }),
    // Verified admission + enrollment payment submissions for this applicant/student
    user.admissionId
      ? db.paymentSubmission.findMany({
          where: {
            admissionId: user.admissionId,
            paymentContext: { in: ["admission", "enrollment"] },
            status: "verified",
          },
          orderBy: { verifiedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  type Entry = {
    id: string;
    source: "fee_receipt" | "admission_payment" | "enrollment_payment";
    receipt_number: string | null;
    payment_method: string;
    amount: number;
    payment_date: string;
    issued_by: string | null;
    items: { name: string; amount: number }[];
  };

  const feeReceiptEntries: Entry[] = receipts.map((r) => ({
    id: r.id,
    source: "fee_receipt",
    receipt_number: r.receiptNumber,
    payment_method: r.paymentMethod,
    amount: Number(r.receivedAmount),
    payment_date: r.paymentDate.toISOString().split("T")[0],
    issued_by: r.createdBy,
    items: r.items.map((item) => ({
      name: item.bill.feeConfig.name,
      amount: Number(item.amount),
    })),
  }));

  const submissionEntries: Entry[] = admissionSubmissions.map((s) => ({
    id: s.id,
    source: s.paymentContext === "enrollment" ? "enrollment_payment" : "admission_payment",
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

  const all = [...feeReceiptEntries, ...submissionEntries].sort(
    (a, b) => b.payment_date.localeCompare(a.payment_date),
  );

  return NextResponse.json({ receipts: all });
}
