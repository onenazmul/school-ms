import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

type Ctx = { params: Promise<{ id: string }> };

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

  const subject   = String(body.subject ?? "").trim();
  const examDate  = String(body.exam_date ?? "").trim();
  const startTime = String(body.start_time ?? "").trim();
  const endTime   = String(body.end_time ?? "").trim();

  if (!subject || !examDate || !startTime || !endTime)
    return NextResponse.json({ message: "subject, exam_date, start_time, end_time are required" }, { status: 422 });

  const count = await db.examSubjectSchedule.count({ where: { examId } });

  const entry = await db.examSubjectSchedule.upsert({
    where: { examId_subject: { examId, subject } },
    create: {
      id: createId(),
      examId,
      subject,
      examDate: new Date(examDate),
      startTime,
      endTime,
      room: body.room ? String(body.room) : null,
      sortOrder: count,
    },
    update: {
      examDate: new Date(examDate),
      startTime,
      endTime,
      room: body.room ? String(body.room) : null,
    },
  });

  return NextResponse.json({ schedule_entry: { id: entry.id, subject: entry.subject } }, { status: 201 });
}
