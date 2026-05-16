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
  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      schedule: { orderBy: { sortOrder: "asc" } },
      _count: { select: { results: true } },
    },
  });
  if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

  return NextResponse.json({
    exam: {
      id: exam.id,
      name: exam.name,
      academic_year: exam.academicYear,
      class_name: exam.className ?? null,
      start_date: exam.startDate?.toISOString().split("T")[0] ?? null,
      end_date: exam.endDate?.toISOString().split("T")[0] ?? null,
      status: exam.status,
      instructions: (exam.instructions as string[]) ?? [],
      result_count: exam._count.results,
      schedule: exam.schedule.map((s) => ({
        id: s.id,
        subject: s.subject,
        exam_date: s.examDate.toISOString().split("T")[0],
        start_time: s.startTime,
        end_time: s.endTime,
        room: s.room ?? null,
        sort_order: s.sortOrder,
      })),
    },
  });
}

export async function PUT(req: Request, { params }: Ctx) {
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
  if (body.name !== undefined)          data.name = String(body.name).trim();
  if (body.academic_year !== undefined) data.academicYear = String(body.academic_year).trim();
  if (body.class_name !== undefined)    data.className = body.class_name ? String(body.class_name) : null;
  if (body.start_date !== undefined)    data.startDate = body.start_date ? new Date(String(body.start_date)) : null;
  if (body.end_date !== undefined)      data.endDate = body.end_date ? new Date(String(body.end_date)) : null;
  if (body.status !== undefined)        data.status = String(body.status);
  if (body.instructions !== undefined)  data.instructions = Array.isArray(body.instructions) ? body.instructions : null;

  const exam = await db.exam.update({ where: { id }, data });
  return NextResponse.json({ exam: { id: exam.id, name: exam.name, status: exam.status } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.exam.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
