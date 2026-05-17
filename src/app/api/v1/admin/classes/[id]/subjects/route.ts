import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const classSubjects = await db.classSubject.findMany({
    where: { classId: Number(id) },
    include: { subject: true },
    orderBy: [{ sortOrder: "asc" }, { subject: { name: "asc" } }],
  });

  return NextResponse.json({
    subjects: classSubjects.map((cs) => ({
      id: cs.id,
      subject_id: cs.subjectId,
      subject_name: cs.subject.name,
      subject_code: cs.subject.code ?? null,
      default_full_marks: cs.defaultFullMarks ? Number(cs.defaultFullMarks) : null,
      default_pass_marks: cs.defaultPassMarks ? Number(cs.defaultPassMarks) : null,
      sort_order: cs.sortOrder,
      is_active: cs.isActive,
    })),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const subjectId = Number(body.subject_id);
  if (!subjectId) return NextResponse.json({ message: "subject_id is required" }, { status: 422 });

  const count = await db.classSubject.count({ where: { classId: Number(id) } });

  const cs = await db.classSubject.upsert({
    where: { classId_subjectId: { classId: Number(id), subjectId } },
    create: {
      classId: Number(id),
      subjectId,
      defaultFullMarks: body.default_full_marks ? Number(body.default_full_marks) : null,
      defaultPassMarks: body.default_pass_marks ? Number(body.default_pass_marks) : null,
      sortOrder: count,
      isActive: true,
    },
    update: {
      defaultFullMarks: body.default_full_marks !== undefined ? (body.default_full_marks ? Number(body.default_full_marks) : null) : undefined,
      defaultPassMarks: body.default_pass_marks !== undefined ? (body.default_pass_marks ? Number(body.default_pass_marks) : null) : undefined,
      isActive: true,
    },
    include: { subject: true },
  });

  return NextResponse.json({
    subject: {
      id: cs.id,
      subject_id: cs.subjectId,
      subject_name: cs.subject.name,
      subject_code: cs.subject.code ?? null,
      default_full_marks: cs.defaultFullMarks ? Number(cs.defaultFullMarks) : null,
      default_pass_marks: cs.defaultPassMarks ? Number(cs.defaultPassMarks) : null,
    },
  }, { status: 201 });
}
