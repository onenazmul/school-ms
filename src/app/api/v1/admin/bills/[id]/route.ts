import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity-log";

// PATCH /api/v1/admin/bills/[id] — update status (waive/reopen) or amount
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: { status?: string; late_fee?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const bill = await db.bill.findUnique({ where: { id } });
  if (!bill) return NextResponse.json({ message: "Bill not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  const validStatuses = ["unpaid", "partial", "paid", "waived"];
  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status))
      return NextResponse.json({ message: `status must be one of: ${validStatuses.join(", ")}` }, { status: 422 });
    updateData.status = body.status;
  }
  if (body.late_fee !== undefined) {
    if (typeof body.late_fee !== "number" || body.late_fee < 0)
      return NextResponse.json({ message: "late_fee must be a non-negative number" }, { status: 422 });
    updateData.lateFee = body.late_fee;
  }
  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ message: "No valid fields" }, { status: 422 });

  const updated = await db.bill.update({
    where: { id },
    data: updateData,
    include: { feeConfig: { select: { name: true } } },
  });

  logActivity({
    module: "fee",
    action: "bill_updated",
    entityType: "Bill",
    entityId: id,
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Admin updated bill ${id}: ${JSON.stringify(updateData)}`,
    metadata: updateData,
  });

  return NextResponse.json({
    bill: {
      id: updated.id,
      status: updated.status,
      late_fee: Number(updated.lateFee),
    },
  });
}

// DELETE /api/v1/admin/bills/[id] — delete unpaid bill
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const bill = await db.bill.findUnique({ where: { id } });
  if (!bill) return NextResponse.json({ message: "Bill not found" }, { status: 404 });
  if (bill.status === "paid")
    return NextResponse.json({ message: "Cannot delete a paid bill" }, { status: 409 });

  await db.bill.delete({ where: { id } });
  return NextResponse.json({ message: "Bill deleted" });
}
