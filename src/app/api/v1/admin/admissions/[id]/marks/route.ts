import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity-log";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== "admin" && role !== "teacher")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: idStr } = await params;
  const admissionId = Number(idStr);
  if (!admissionId) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const writtenMarks = body.written_marks != null ? Number(body.written_marks) : null;
  const vivaMarks    = body.viva_marks    != null ? Number(body.viva_marks)    : null;
  const totalMarks   = body.total_marks   != null
    ? Number(body.total_marks)
    : (writtenMarks ?? 0) + (vivaMarks ?? 0) || null;

  const mark = await db.admissionMark.upsert({
    where: { admissionId },
    create: {
      admissionId,
      writtenMarks,
      vivaMarks,
      totalMarks,
      enteredBy: (session.user as any)?.name ?? null,
    },
    update: {
      writtenMarks,
      vivaMarks,
      totalMarks,
      enteredBy: (session.user as any)?.name ?? null,
      enteredAt: new Date(),
    },
  });

  logActivity({
    module: "exam",
    action: "marks_entered",
    entityType: "Admission",
    entityId: String(admissionId),
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Marks entered for admission #${admissionId}: Written=${writtenMarks ?? "-"}, Viva=${vivaMarks ?? "-"}, Total=${totalMarks ?? "-"}`,
    metadata: { writtenMarks, vivaMarks, totalMarks },
  });

  // Auto-threshold check
  const admission = await db.admission.findUnique({
    where: { id: admissionId },
    include: { admissionConfig: true },
  });

  if (admission?.admissionConfig?.marksThresholdEnabled && totalMarks != null) {
    const threshold = admission.admissionConfig.marksPassThreshold;
    const action    = admission.admissionConfig.marksThresholdAction;
    if (threshold != null) {
      const passed = totalMarks >= threshold;
      if (action === "auto_enroll" && passed) {
        // Will be handled by the enroll route — just set Approved for now
        // so a separate enrollment transaction (Student creation) can be triggered
        await db.admission.update({
          where: { id: admissionId },
          data: { status: "Approved" },
        });
      } else if (action === "flag_review") {
        await db.admission.update({
          where: { id: admissionId },
          data: { status: passed ? "Approved" : "Rejected" },
        });
      }
    }
  }

  return NextResponse.json({ mark });
}
