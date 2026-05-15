import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { logActivity } from "@/lib/activity-log";

// ── Shared include shape ──────────────────────────────────────────────────────

const studentInclude = {
  admission: true,
  user: { select: { username: true, email: true } },
  bills: {
    orderBy: { createdAt: "desc" as const },
    include: { feeConfig: { select: { name: true } } },
  },
  receipts: {
    orderBy: { paymentDate: "desc" as const },
    include: {
      items: {
        include: {
          bill: { include: { feeConfig: { select: { name: true } } } },
        },
      },
    },
  },
} satisfies Prisma.StudentInclude;

type StudentWithIncludes = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

function serializeStudent(s: StudentWithIncludes) {
  const a = s.admission;
  return {
    id: s.id,
    admission_id: s.admissionId,
    class_name: s.className,
    section: s.section,
    roll_number: s.rollNumber,
    academic_year: s.academicYear,
    session_name: s.sessionName,
    status: s.status,
    enrolled_at: s.enrolledAt.toISOString(),
    username: s.user?.username ?? null,
    email: s.user?.email ?? null,
    name_en: a?.nameEn ?? "",
    name_bn: a?.nameBn ?? null,
    gender: a?.gender ?? null,
    dob: a?.dob ? a.dob.toISOString().split("T")[0] : null,
    blood_group: a?.bloodGroup ?? null,
    nationality: a?.nationality ?? null,
    birth_certificate_no: a?.birthCertificateNo ?? null,
    photo: a?.studentPhoto ?? null,
    present_village: a?.presentVillage ?? null,
    present_post: a?.presentPost ?? null,
    present_upazilla: a?.presentUpazilla ?? null,
    present_zilla: a?.presentZilla ?? null,
    present_post_code: a?.presentPostCode ?? null,
    guardian_name: a?.guardianName ?? null,
    guardian_mobile: a?.guardianMobileNo ?? null,
    guardian_relation: a?.guardianRelation ?? null,
    guardian_occupation: a?.guardianOccupation ?? null,
    father_name: a?.fatherNameEn ?? null,
    father_name_bn: a?.fatherNameBn ?? null,
    father_mobile: a?.fatherMobileNo ?? null,
    mother_name: a?.motherNameEn ?? null,
    mother_name_bn: a?.motherNameBn ?? null,
    mother_mobile: a?.motherMobileNo ?? null,
    previous_institute_name: a?.previousInstituteName ?? null,
    bills: s.bills.map((b) => ({
      id: b.id,
      name: b.feeConfig.name,
      amount: Number(b.amount),
      late_fee: Number(b.lateFee),
      due_date: b.dueDate.toISOString(),
      month: b.month,
      academic_year: b.academicYear,
      status: b.status,
      created_at: b.createdAt.toISOString(),
    })),
    receipts: s.receipts.map((r) => ({
      id: r.id,
      receipt_number: r.receiptNumber,
      payment_method: r.paymentMethod,
      received_amount: Number(r.receivedAmount),
      payment_date: r.paymentDate.toISOString(),
      created_by: r.createdBy,
      notes: r.notes,
      items: r.items.map((item) => ({
        bill_id: item.billId,
        bill_name: item.bill.feeConfig.name,
        amount: Number(item.amount),
      })),
    })),
  };
}

// ── STUDENT_STATUSES ──────────────────────────────────────────────────────────

const STUDENT_STATUSES = ["Active", "Inactive", "Graduated", "Transferred"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const student = await db.student.findUnique({ where: { id }, include: studentInclude });

  if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  return NextResponse.json({ student: serializeStudent(student) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const current = await db.student.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (body.class_name !== undefined) {
    if (typeof body.class_name !== "string" || !body.class_name.trim())
      return NextResponse.json({ message: "class_name must be a non-empty string" }, { status: 400 });
    updateData.className = (body.class_name as string).trim();
  }
  if (body.section !== undefined)
    updateData.section = body.section ? String(body.section).trim() || null : null;
  if (body.roll_number !== undefined)
    updateData.rollNumber = body.roll_number ? String(body.roll_number).trim() || null : null;
  if (body.academic_year !== undefined) {
    if (typeof body.academic_year !== "string" || !body.academic_year.trim())
      return NextResponse.json({ message: "academic_year must be a non-empty string" }, { status: 400 });
    updateData.academicYear = (body.academic_year as string).trim();
  }
  if (body.session_name !== undefined)
    updateData.sessionName = body.session_name ? String(body.session_name).trim() || null : null;
  if (body.status !== undefined) {
    if (!STUDENT_STATUSES.includes(body.status as (typeof STUDENT_STATUSES)[number]))
      return NextResponse.json({ message: `status must be one of: ${STUDENT_STATUSES.join(", ")}` }, { status: 400 });
    updateData.status = body.status;
  }

  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });

  const updated = await db.student.update({ where: { id }, data: updateData, include: studentInclude });

  const changes = Object.keys(updateData).map((k) => `${k} → ${updateData[k]}`);
  logActivity({
    module: "student",
    action: "updated",
    entityType: "Student",
    entityId: id,
    actorId: session.user.id,
    actorName: (session.user as any)?.name ?? undefined,
    actorRole: "admin",
    description: `Admin updated student ${id}: ${changes.join(", ")}`,
    metadata: body as Record<string, unknown>,
  });

  return NextResponse.json({ student: serializeStudent(updated) });
}
