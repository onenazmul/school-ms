import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

function serialize(fee: {
  id: string;
  name: string;
  amount: unknown;
  type: string;
  applicableClasses: unknown;
  dueDay: number | null;
  dueDate: Date | null;
  lateFee: unknown;
  isActive: boolean;
  allowBulk: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: fee.id,
    name: fee.name,
    amount: Number(fee.amount),
    type: fee.type,
    applicable_classes: JSON.parse(fee.applicableClasses as string) as string[],
    due_day: fee.dueDay,
    due_date: fee.dueDate ? fee.dueDate.toISOString().split("T")[0] : null,
    late_fee: fee.lateFee != null ? Number(fee.lateFee) : null,
    is_active: fee.isActive,
    allow_bulk: fee.allowBulk,
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const fees = await db.feeConfig.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ fees: fees.map(serialize) });
  } catch (err) {
    console.error("GET /api/v1/admin/fee-configs:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { name, amount, type, applicable_classes, due_day, due_date, late_fee, allow_bulk } = body;
    if (!name || !amount || !type || !Array.isArray(applicable_classes) || applicable_classes.length === 0)
      return NextResponse.json({ message: "name, amount, type, applicable_classes are required" }, { status: 422 });

    const parsedDueDate = due_date ? new Date(String(due_date)) : null;
    if (due_date && parsedDueDate && isNaN(parsedDueDate.getTime()))
      return NextResponse.json({ message: "Invalid due_date" }, { status: 422 });

    const fee = await db.feeConfig.create({
      data: {
        id: crypto.randomUUID(),
        name: String(name),
        amount: Number(amount),
        type: String(type),
        applicableClasses: JSON.stringify(applicable_classes),
        dueDay: due_day != null ? Number(due_day) : null,
        dueDate: parsedDueDate,
        lateFee: late_fee != null ? Number(late_fee) : null,
        isActive: true,
        allowBulk: allow_bulk !== undefined ? Boolean(allow_bulk) : true,
      },
    });
    return NextResponse.json({ fee: serialize(fee) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/admin/fee-configs:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
