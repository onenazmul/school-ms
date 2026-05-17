// app/api/documents/payment-receipt/fee-receipt/[receiptId]/route.ts
// PDF receipt for admin-issued Receipt records (cash / in-person payments).
import { renderToBuffer } from "@react-pdf/renderer";
import { PaymentReceiptPDF, type ReceiptData } from "@/components/documents/pdf/PaymentReceiptPDF";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ receiptId: string }> },
) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });

  const { receiptId } = await params;

  const [receipt, schoolSetting] = await Promise.all([
    db.receipt.findUnique({
      where: { id: receiptId },
      include: {
        student: {
          select: {
            className: true,
            rollNumber: true,
            admission: { select: { nameEn: true } },
            user: { select: { username: true } },
          },
        },
        items: {
          include: { bill: { include: { feeConfig: { select: { name: true } } } } },
        },
      },
    }),
    db.schoolSetting.findUnique({ where: { id: 1 } }),
  ]);

  if (!receipt) {
    return new Response(JSON.stringify({ error: "Receipt not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auth: admin always allowed; student only allowed for their own receipt
  const role = (session.user as any)?.role;
  if (role === "student") {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { studentId: true },
    });
    if (user?.studentId !== receipt.studentId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const schoolInfo = {
    name: schoolSetting?.name ?? "School Name",
    address: [schoolSetting?.address, schoolSetting?.city].filter(Boolean).join(", ") || "—",
    phone: schoolSetting?.phone ?? "—",
    email: schoolSetting?.email ?? "—",
  };

  const amountPaid = Number(receipt.receivedAmount);
  const feeNames = receipt.items.map((i) => i.bill.feeConfig.name).join(", ");

  const data: ReceiptData = {
    receiptNumber: receipt.receiptNumber,
    receiptDate: receipt.paymentDate.toISOString().slice(0, 10),
    payerName: receipt.student.admission?.nameEn ?? "Student",
    paymentContext: "enrollment",
    studentId: receipt.student.user?.username ?? receipt.studentId,
    studentClass: receipt.student.className,
    rollNumber: receipt.student.rollNumber ?? undefined,
    academicYear: String(new Date(receipt.paymentDate).getFullYear()),
    feeType: feeNames || "Fee Payment",
    totalFee: amountPaid,
    amountPaid,
    balanceDue: 0,
    status: "verified",
    verifiedBy: receipt.createdBy,
    verifiedAt: receipt.createdAt.toISOString(),
    submissions: [
      {
        id: receipt.id,
        status: "verified",
        method: receipt.paymentMethod,
        transactionId: receipt.receiptNumber,
        phoneNumber: null,
        amountSent: amountPaid,
        paymentDate: receipt.paymentDate.toISOString().slice(0, 10),
      },
    ],
    schoolInfo,
  };

  const buffer = await renderToBuffer(createElement(PaymentReceiptPDF, { data }) as any);
  const label = (receipt.student.user?.username ?? receipt.studentId).replace(/[^a-z0-9-]/gi, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt_${receipt.receiptNumber}_${label}.pdf"`,
    },
  });
}
