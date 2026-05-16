import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId } = await params;
  const url = new URL(req.url);
  const className = url.searchParams.get("class") ?? "";

  const results = await db.examResult.findMany({
    where: { examId, ...(className ? { student: { className } } : {}) },
    include: {
      student: {
        select: {
          className: true,
          section: true,
          rollNumber: true,
          admission: { select: { nameEn: true } },
          user: { select: { username: true } },
        },
      },
    },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      student_id: r.studentId,
      student_name: r.student.admission?.nameEn ?? "—",
      username: r.student.user?.username ?? null,
      class_name: r.student.className,
      section: r.student.section ?? null,
      roll_number: r.student.rollNumber ?? null,
      exam_name: r.examName,
      academic_year: r.academicYear,
      subjects: r.subjects,
      total_marks: r.totalMarks ? Number(r.totalMarks) : null,
      gpa: r.gpa ? Number(r.gpa) : null,
      grade: r.grade ?? null,
      position: r.position ?? null,
      total_students: (r as any).totalStudents ?? null,
      attendance_present: (r as any).attendancePresent ?? null,
      attendance_total: (r as any).attendanceTotal ?? null,
      pass: (r as any).pass ?? null,
      teacher_remarks: (r as any).teacherRemarks ?? null,
      published_at: r.publishedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const studentId = String(body.student_id ?? "").trim();
  if (!studentId) return NextResponse.json({ message: "student_id is required" }, { status: 422 });

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  const subjects = Array.isArray(body.subjects) ? body.subjects : [];
  const totalObtained = subjects.reduce((s: number, sub: any) => s + Number(sub.obtainedMarks ?? sub.obtained_marks ?? 0), 0);
  const totalMax = subjects.reduce((s: number, sub: any) => s + Number(sub.fullMarks ?? sub.max_marks ?? 0), 0);

  const result = await db.examResult.upsert({
    where: { id: body.result_id ? String(body.result_id) : "nonexistent" },
    create: {
      id: createId(),
      studentId,
      examId,
      examName: exam.name,
      academicYear: exam.academicYear,
      subjects,
      totalMarks: Number(body.total_marks ?? totalObtained),
      gpa: body.gpa ? Number(body.gpa) : null,
      grade: body.grade ? String(body.grade) : null,
      position: body.position ? Number(body.position) : null,
      totalStudents: body.total_students ? Number(body.total_students) : null,
      attendancePresent: body.attendance_present ? Number(body.attendance_present) : null,
      attendanceTotal: body.attendance_total ? Number(body.attendance_total) : null,
      pass: body.pass !== undefined ? Boolean(body.pass) : null,
      teacherRemarks: body.teacher_remarks ? String(body.teacher_remarks) : null,
      publishedAt: body.publish ? new Date() : null,
    } as any,
    update: {
      subjects,
      totalMarks: Number(body.total_marks ?? totalObtained),
      gpa: body.gpa ? Number(body.gpa) : null,
      grade: body.grade ? String(body.grade) : null,
      position: body.position ? Number(body.position) : null,
      totalStudents: body.total_students ? Number(body.total_students) : null,
      attendancePresent: body.attendance_present ? Number(body.attendance_present) : null,
      attendanceTotal: body.attendance_total ? Number(body.attendance_total) : null,
      pass: body.pass !== undefined ? Boolean(body.pass) : null,
      teacherRemarks: body.teacher_remarks ? String(body.teacher_remarks) : null,
      ...(body.publish ? { publishedAt: new Date() } : {}),
    } as any,
  });

  return NextResponse.json({ result: { id: result.id } }, { status: 201 });
}
