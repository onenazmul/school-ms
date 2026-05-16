import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search    = searchParams.get("search")?.trim() ?? "";
  const className = searchParams.get("class") ?? "";
  const status    = searchParams.get("status") ?? "";
  const type      = searchParams.get("type") ?? ""; // bill | payment | all

  const now = new Date();

  // Fetch bills
  const billWhere: Record<string, unknown> = {};
  if (className) billWhere.student = { className };
  if (status && status !== "all") {
    if (status === "overdue") {
      billWhere.status = { in: ["unpaid", "partial"] };
      billWhere.dueDate = { lt: now };
    } else {
      billWhere.status = status;
    }
  }

  const bills = await db.bill.findMany({
    where: billWhere,
    include: {
      student: {
        select: {
          id: true, className: true,
          admission: { select: { nameEn: true } },
        },
      },
      feeConfig: { select: { name: true } },
      receiptItems: {
        select: { amount: true, receiptId: true },
      },
    },
    orderBy: { dueDate: "desc" },
    take: 300,
  });

  // Fetch receipts (payments)
  const receiptWhere: Record<string, unknown> = {};
  if (className) receiptWhere.student = { className };

  const receipts = await db.receipt.findMany({
    where: receiptWhere,
    include: {
      student: {
        select: {
          id: true, className: true,
          admission: { select: { nameEn: true } },
        },
      },
      items: {
        include: { bill: { include: { feeConfig: { select: { name: true } } } } },
      },
    },
    orderBy: { paymentDate: "desc" },
    take: 300,
  });

  type Entry = {
    id: string; studentId: string; studentName: string; class: string;
    type: "bill" | "payment"; description: string;
    debit: number; credit: number; date: string;
    status: "paid" | "unpaid" | "partial" | "overdue" | "waived";
  };

  const entries: Entry[] = [];

  for (const b of bills) {
    const studentName = b.student.admission?.nameEn ?? "Unknown";
    if (search && !studentName.toLowerCase().includes(search.toLowerCase())) continue;
    if (type === "payment") continue;

    const isOverdue = (b.status === "unpaid" || b.status === "partial") && b.dueDate < now;
    const creditAmount = b.receiptItems.reduce((s, ri) => s + Number(ri.amount), 0);
    const label = b.feeConfig.name + (b.month ? ` — ${b.month} ${b.academicYear}` : ` ${b.academicYear}`);

    entries.push({
      id: b.id,
      studentId: b.student.id,
      studentName,
      class: b.student.className,
      type: "bill",
      description: label,
      debit: Number(b.amount) + Number(b.lateFee),
      credit: creditAmount,
      date: b.dueDate.toISOString().split("T")[0],
      status: isOverdue ? "overdue" : (b.status as Entry["status"]),
    });
  }

  for (const r of receipts) {
    const studentName = r.student.admission?.nameEn ?? "Unknown";
    if (search && !studentName.toLowerCase().includes(search.toLowerCase())) continue;
    if (type === "bill") continue;
    if (status && status !== "all") continue; // receipts don't have bill status

    const feeNames = [...new Set(r.items.map((i) => i.bill.feeConfig.name))].join(", ");
    entries.push({
      id: r.id,
      studentId: r.student.id,
      studentName,
      class: r.student.className,
      type: "payment",
      description: `Payment — ${feeNames || r.paymentMethod}`,
      debit: 0,
      credit: Number(r.receivedAmount),
      date: r.paymentDate.toISOString().split("T")[0],
      status: "paid",
    });
  }

  // Sort by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));

  const totalDebit  = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return NextResponse.json({ entries, total_debit: totalDebit, total_credit: totalCredit });
}
