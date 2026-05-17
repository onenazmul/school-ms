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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.type !== undefined) data.type = String(body.type);
    if (body.applicable_classes !== undefined) data.applicableClasses = JSON.stringify(body.applicable_classes);
    if (body.due_day !== undefined) data.dueDay = body.due_day != null ? Number(body.due_day) : null;
    if (body.due_date !== undefined) data.dueDate = body.due_date ? new Date(String(body.due_date)) : null;
    if (body.late_fee !== undefined) data.lateFee = body.late_fee != null ? Number(body.late_fee) : null;
    if (body.is_active !== undefined) data.isActive = Boolean(body.is_active);
    if (body.allow_bulk !== undefined) data.allowBulk = Boolean(body.allow_bulk);

    const fee = await db.feeConfig.update({ where: { id }, data });
    return NextResponse.json({ fee: serialize(fee) });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    console.error("PATCH /api/v1/admin/fee-configs/[id]:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await db.feeConfig.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    console.error("DELETE /api/v1/admin/fee-configs/[id]:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
