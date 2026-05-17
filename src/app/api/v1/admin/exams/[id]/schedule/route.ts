import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

type Ctx = { params: Promise<{ id: string }> };

async function syncExamDates(examId: string) {
  const entries = await db.examSubjectSchedule.findMany({
    where: { examId },
    select: { examDate: true },
  });
  if (entries.length === 0) {
    await db.exam.update({ where: { id: examId }, data: { startDate: null, endDate: null } });
    return;
  }
  const dates = entries.map((e) => e.examDate.getTime());
  const endDate = new Date(Math.max(...dates));
  const exam = await db.exam.findUnique({ where: { id: examId }, select: { resultDaysAfter: true } });
  const update: Record<string, unknown> = {
    startDate: new Date(Math.min(...dates)),
    endDate,
  };
  if (exam?.resultDaysAfter != null) {
    update.resultDate = new Date(endDate.getTime() + exam.resultDaysAfter * 86400000);
  }
  await db.exam.update({ where: { id: examId }, data: update });
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId } = await params;
  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

  if (!exam.className) {
    // All-classes mode: return subjects from every active class
    const classes = await db.schoolClass.findMany({
      where: { isActive: true },
      include: {
        classSubjects: {
          where: { isActive: true },
          include: { subject: true },
          orderBy: [{ sortOrder: "asc" }, { subject: { name: "asc" } }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const subjects = classes.flatMap((c) =>
      c.classSubjects.map((cs) => ({
        subject_id: cs.subjectId,
        subject_name: cs.subject.name,
        subject_code: cs.subject.code ?? null,
        class_name: c.name,
        default_full_marks: cs.defaultFullMarks ? Number(cs.defaultFullMarks) : null,
        default_pass_marks: cs.defaultPassMarks ? Number(cs.defaultPassMarks) : null,
      }))
    );

    return NextResponse.json({ subjects, is_all_classes: true });
  }

  const schoolClass = await db.schoolClass.findUnique({ where: { name: exam.className } });
  if (!schoolClass) return NextResponse.json({ subjects: [], is_all_classes: false });

  const classSubjects = await db.classSubject.findMany({
    where: { classId: schoolClass.id, isActive: true },
    include: { subject: true },
    orderBy: [{ sortOrder: "asc" }, { subject: { name: "asc" } }],
  });

  return NextResponse.json({
    subjects: classSubjects.map((cs) => ({
      subject_id: cs.subjectId,
      subject_name: cs.subject.name,
      subject_code: cs.subject.code ?? null,
      class_name: exam.className,
      default_full_marks: cs.defaultFullMarks ? Number(cs.defaultFullMarks) : null,
      default_pass_marks: cs.defaultPassMarks ? Number(cs.defaultPassMarks) : null,
    })),
    is_all_classes: false,
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

  const examDate  = String(body.exam_date ?? "").trim();
  const startTime = String(body.start_time ?? "").trim();
  const endTime   = String(body.end_time ?? "").trim();
  const className = body.class_name ? String(body.class_name).trim() : "";

  let subject = String(body.subject ?? "").trim();
  const subjectId = body.subject_id ? Number(body.subject_id) : null;

  if (subjectId && !subject) {
    const subjectRef = await db.subject.findUnique({ where: { id: subjectId } });
    if (subjectRef) subject = subjectRef.name;
  }

  if (!subject || !examDate || !startTime || !endTime)
    return NextResponse.json({ message: "subject, exam_date, start_time, end_time are required" }, { status: 422 });

  const count = await db.examSubjectSchedule.count({ where: { examId } });

  const entry = await db.examSubjectSchedule.upsert({
    where: { examId_subject_className: { examId, subject, className } },
    create: {
      id: createId(),
      examId,
      subject,
      className,
      subjectId,
      fullMarks: body.full_marks ? Number(body.full_marks) : null,
      passMarks: body.pass_marks ? Number(body.pass_marks) : null,
      examDate: new Date(examDate),
      startTime,
      endTime,
      room: body.room ? String(body.room) : null,
      sortOrder: count,
    },
    update: {
      subjectId: subjectId ?? undefined,
      fullMarks: body.full_marks !== undefined ? (body.full_marks ? Number(body.full_marks) : null) : undefined,
      passMarks: body.pass_marks !== undefined ? (body.pass_marks ? Number(body.pass_marks) : null) : undefined,
      examDate: new Date(examDate),
      startTime,
      endTime,
      room: body.room ? String(body.room) : null,
    },
  });

  await syncExamDates(examId);
  return NextResponse.json({ schedule_entry: { id: entry.id, subject: entry.subject } }, { status: 201 });
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId } = await params;
  let body: { subjects: { subject_id: number; class_name?: string; exam_date: string; start_time: string; end_time: string; room?: string; full_marks?: number; pass_marks?: number }[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.subjects))
    return NextResponse.json({ message: "subjects array required" }, { status: 422 });

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

  await db.examSubjectSchedule.deleteMany({ where: { examId } });

  const subjectIds = body.subjects.map((s) => s.subject_id).filter(Boolean);
  const subjectRefs = await db.subject.findMany({ where: { id: { in: subjectIds } } });
  const subjectMap = new Map(subjectRefs.map((s) => [s.id, s]));

  const entries = body.subjects.map((s, idx) => {
    const ref = subjectMap.get(s.subject_id);
    return {
      id: createId(),
      examId,
      subject: ref?.name ?? String(s.subject_id),
      className: s.class_name ?? "",
      subjectId: s.subject_id ?? null,
      fullMarks: s.full_marks ? Number(s.full_marks) : null,
      passMarks: s.pass_marks ? Number(s.pass_marks) : null,
      examDate: new Date(s.exam_date),
      startTime: s.start_time,
      endTime: s.end_time,
      room: s.room ?? null,
      sortOrder: idx,
    };
  });

  await db.examSubjectSchedule.createMany({ data: entries });
  await syncExamDates(examId);

  return NextResponse.json({ ok: true, count: entries.length });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId } = await params;
  let body: { order: string[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.order))
    return NextResponse.json({ message: "order array required" }, { status: 422 });

  await Promise.all(
    body.order.map((id, idx) =>
      db.examSubjectSchedule.update({ where: { id, examId }, data: { sortOrder: idx } })
    )
  );

  return NextResponse.json({ ok: true });
}
