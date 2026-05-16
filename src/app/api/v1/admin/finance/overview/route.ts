import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [outstanding, collected, collectedThisMonth, overdueCount, pendingCount, feeBreakdown] =
    await Promise.all([
      db.bill.aggregate({
        _sum: { amount: true, lateFee: true },
        where: { status: { in: ["unpaid", "partial"] } },
      }),
      db.bill.aggregate({
        _sum: { amount: true, lateFee: true },
        where: { status: "paid" },
      }),
      db.receipt.aggregate({
        _sum: { receivedAmount: true },
        where: { createdAt: { gte: startOfMonth } },
      }),
      db.bill.count({
        where: { status: { in: ["unpaid", "partial"] }, dueDate: { lt: now } },
      }),
      db.paymentSubmission.count({
        where: { status: "pending", paymentContext: "fee" },
      }),
      // Per-fee-config breakdown
      db.feeConfig.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          bills: {
            select: { status: true, dueDate: true, amount: true, lateFee: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const breakdown = feeBreakdown
    .filter((fc) => fc.bills.length > 0)
    .map((fc) => {
      const paid = fc.bills.filter((b) => b.status === "paid" || b.status === "waived").length;
      const unpaid = fc.bills.filter((b) => b.status === "unpaid" || b.status === "partial").length;
      const overdue = fc.bills.filter(
        (b) => (b.status === "unpaid" || b.status === "partial") && b.dueDate < now,
      ).length;
      const amountOutstanding = fc.bills
        .filter((b) => b.status === "unpaid" || b.status === "partial")
        .reduce((s, b) => s + Number(b.amount) + Number(b.lateFee), 0);
      const amountCollected = fc.bills
        .filter((b) => b.status === "paid" || b.status === "waived")
        .reduce((s, b) => s + Number(b.amount) + Number(b.lateFee), 0);
      return {
        fee_id: fc.id,
        fee_name: fc.name,
        fee_type: fc.type,
        total: fc.bills.length,
        paid,
        unpaid,
        overdue,
        amount_outstanding: amountOutstanding,
        amount_collected: amountCollected,
      };
    });

  return NextResponse.json({
    stats: {
      total_outstanding: Number(outstanding._sum.amount ?? 0) + Number(outstanding._sum.lateFee ?? 0),
      total_collected: Number(collected._sum.amount ?? 0) + Number(collected._sum.lateFee ?? 0),
      collected_this_month: Number(collectedThisMonth._sum.receivedAmount ?? 0),
      overdue_count: overdueCount,
      pending_verification_count: pendingCount,
    },
    breakdown,
  });
}
