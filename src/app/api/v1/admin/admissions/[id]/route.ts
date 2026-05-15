import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { serializeAdmission } from "@/lib/serializers/admission";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

  const admission = await db.admission.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } },
      mark: true,
    },
  });

  if (!admission) return NextResponse.json({ message: "Admission not found" }, { status: 404 });

  return NextResponse.json({
    admission: {
      ...serializeAdmission(admission),
      username: admission.user?.username ?? null,
      mark: admission.mark
        ? {
            written_marks: admission.mark.writtenMarks,
            viva_marks: admission.mark.vivaMarks,
            total_marks: admission.mark.totalMarks,
            entered_by: admission.mark.enteredBy,
            entered_at: admission.mark.enteredAt.toISOString(),
          }
        : null,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  // Read current record before applying updates
  const current = await db.admission.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ message: "Admission not found" }, { status: 404 });

  // Approval lock: once Approved or Enrolled, status cannot be changed via this endpoint
  if ((current.status === "Approved" || current.status === "Enrolled") && body.status !== undefined) {
    return NextResponse.json(
      { message: `Application is ${current.status} and its status can no longer be changed.` },
      { status: 409 },
    );
  }

  // Payment lock: once Paid, cannot downgrade via this endpoint
  if (current.paymentStatus === "Paid" && body.payment_status !== undefined) {
    return NextResponse.json(
      { message: "Payment has already been verified. Use the payment submission endpoint to modify payment status." },
      { status: 409 },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.payment_status !== undefined) updateData.paymentStatus = body.payment_status;
  if (body.admin_note !== undefined) updateData.adminNote = body.admin_note;

  // Set reviewer info when status is being changed
  if (body.status !== undefined) {
    updateData.reviewedBy = (session.user as any)?.name ?? null;
    updateData.reviewedAt = new Date();
  }

  const updated = await db.admission.update({
    where: { id },
    data: updateData,
    include: { user: { select: { username: true } } },
  });

  const changes: string[] = [];
  if (body.status !== undefined) changes.push(`status → ${body.status}`);
  if (body.payment_status !== undefined) changes.push(`payment_status → ${body.payment_status}`);
  logActivity({
    module: "admission",
    action: "status_changed",
    entityType: "Admission",
    entityId: String(id),
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Admin updated admission #${id}: ${changes.join(", ")}`,
    metadata: body as Record<string, unknown>,
  });

  return NextResponse.json({
    admission: { ...serializeAdmission(updated), username: updated.user?.username ?? null },
  });
}
