import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const exams = await db.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      schedule: { orderBy: { sortOrder: "asc" } },
      _count: { select: { results: true } },
    },
  });

  return NextResponse.json({
    exams: exams.map((e) => ({
      id: e.id,
      name: e.name,
      academic_year: e.academicYear,
      class_name: e.className ?? null,
      start_date: e.startDate?.toISOString().split("T")[0] ?? null,
      end_date: e.endDate?.toISOString().split("T")[0] ?? null,
      status: e.status,
      instructions: e.instructions ?? [],
      schedule_count: e.schedule.length,
      result_count: e._count.results,
      created_at: e.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const academicYear = String(body.academic_year ?? "").trim();
  if (!name) return NextResponse.json({ message: "name is required" }, { status: 422 });
  if (!academicYear) return NextResponse.json({ message: "academic_year is required" }, { status: 422 });

  const exam = await db.exam.create({
    data: {
      id: createId(),
      name,
      academicYear,
      className: body.class_name ? String(body.class_name) : null,
      startDate: body.start_date ? new Date(String(body.start_date)) : null,
      endDate: body.end_date ? new Date(String(body.end_date)) : null,
      status: "draft",
      instructions: Array.isArray(body.instructions) ? body.instructions : undefined,
    },
  });

  return NextResponse.json({ exam: { id: exam.id, name: exam.name } }, { status: 201 });
}
