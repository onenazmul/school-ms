import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";
import { logActivity } from "@/lib/activity-log";

export async function POST(
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
    include: { user: true, student: true },
  });
  if (!admission) return NextResponse.json({ message: "Admission not found" }, { status: 404 });
  if (admission.student) return NextResponse.json({ message: "Already enrolled" }, { status: 409 });
  if (!admission.user) return NextResponse.json({ message: "No user linked to this admission" }, { status: 422 });

  // Enrollment fee gate
  const activeConfig = await db.admissionConfig.findFirst({ where: { isActive: true } });
  if (activeConfig?.enrollmentFeeRequired && admission.enrollmentPaymentStatus !== "Paid") {
    return NextResponse.json(
      { message: "Enrollment fee has not been verified. Please verify the enrollment fee payment before enrolling." },
      { status: 409 },
    );
  }

  const academicYear = new Date().getFullYear().toString();

  // Auto-assign roll number: MAX existing roll for this class + year, then +1
  const lastStudent = await db.student.findFirst({
    where: { className: admission.className, academicYear },
    orderBy: { rollNumber: "desc" },
    select: { rollNumber: true },
  });
  const nextRoll = lastStudent?.rollNumber
    ? String(Number(lastStudent.rollNumber) + 1).padStart(String(lastStudent.rollNumber).length, "0")
    : "1";

  const studentId = createId();

  const [student] = await db.$transaction([
    db.student.create({
      data: {
        id: studentId,
        admissionId: admission.id,
        className: admission.className,
        section: admission.section ?? null,
        sessionName: admission.sessionName,
        academicYear,
        rollNumber: nextRoll,
        status: "Active",
      },
    }),
    db.user.update({
      where: { id: admission.user.id },
      data: { role: "student", studentId },
    }),
    db.admission.update({
      where: { id },
      data: { status: "Enrolled" },
    }),
  ]);

  logActivity({
    module: "student",
    action: "student_enrolled",
    entityType: "Student",
    entityId: studentId,
    entityLabel: `${admission.nameEn} · ${admission.className}`,
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `${admission.nameEn} enrolled as student for class ${admission.className}`,
    metadata: { admissionId: admission.id, studentId, className: admission.className },
  });

  return NextResponse.json({
    message: "Admission approved and student account created",
    student: {
      id: student.id,
      admission_id: student.admissionId,
      class_name: student.className,
      academic_year: student.academicYear,
      roll_number: student.rollNumber,
    },
  });
}
