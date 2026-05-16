import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

// GET — list receipts
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const method = searchParams.get("method") ?? "";

  const where: Record<string, unknown> = {};
  if (method && method !== "all") where.paymentMethod = method;

  const receipts = await db.receipt.findMany({
    where,
    include: {
      student: {
        select: {
          className: true,
          admission: { select: { nameEn: true } },
        },
      },
      items: {
        include: { bill: { include: { feeConfig: { select: { name: true } }, } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const result = receipts
    .filter((r) => {
      if (!search) return true;
      const name = r.student.admission?.nameEn?.toLowerCase() ?? "";
      return name.includes(search.toLowerCase()) || r.receiptNumber.toLowerCase().includes(search.toLowerCase());
    })
    .map((r) => ({
      id: r.id,
      receipt_number: r.receiptNumber,
      student_name: r.student.admission?.nameEn ?? "Unknown",
      class: r.student.className,
      amount: Number(r.receivedAmount),
      date: r.paymentDate.toISOString().split("T")[0],
      method: r.paymentMethod,
      notes: r.notes,
      bills: [...new Set(r.items.map((i) => i.bill.feeConfig.name))],
      created_at: r.createdAt.toISOString(),
    }));

  return NextResponse.json({ receipts: result });
}

// POST — create manual receipt (cash/in-person payment)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: {
    studentId?: string; billIds?: string[];
    paymentMethod?: string; receivedAmount?: number;
    paymentDate?: string; notes?: string;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { studentId, billIds, paymentMethod, receivedAmount, paymentDate, notes } = body;
  if (!studentId || !billIds?.length || !paymentMethod || !receivedAmount || !paymentDate)
    return NextResponse.json({ message: "studentId, billIds, paymentMethod, receivedAmount, paymentDate are required" }, { status: 422 });

  const parsedDate = new Date(paymentDate);
  if (isNaN(parsedDate.getTime()))
    return NextResponse.json({ message: "Invalid paymentDate" }, { status: 422 });

  // Verify student + bills
  const [student, bills] = await Promise.all([
    db.student.findUnique({ where: { id: studentId } }),
    db.bill.findMany({ where: { id: { in: billIds }, studentId } }),
  ]);
  if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });
  if (bills.length === 0) return NextResponse.json({ message: "No matching bills found" }, { status: 404 });

  // Generate receipt number
  const year = new Date().getFullYear();
  const count = await db.receipt.count();
  const receiptNumber = `RCP-${year}-${String(count + 1).padStart(5, "0")}`;

  const actorName = (session.user as any)?.name ?? "Admin";

  const receipt = await db.$transaction(async (tx) => {
    const rec = await tx.receipt.create({
      data: {
        id: createId(),
        studentId,
        receiptNumber,
        paymentMethod,
        receivedAmount,
        paymentDate: parsedDate,
        createdBy: actorName,
        notes: notes ?? null,
        items: {
          create: bills.map((b) => ({
            id: createId(),
            billId: b.id,
            amount: Number(b.amount) + Number(b.lateFee),
          })),
        },
      },
    });

    // Mark bills as paid
    await tx.bill.updateMany({
      where: { id: { in: bills.map((b) => b.id) } },
      data: { status: "paid" },
    });

    return rec;
  });

  return NextResponse.json({
    receipt: { id: receipt.id, receipt_number: receipt.receiptNumber },
  }, { status: 201 });
}
