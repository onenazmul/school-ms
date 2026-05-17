import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

type Ctx = { params: Promise<{ id: string; scheduleId: string }> };

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

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId, scheduleId } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.exam_date  !== undefined) data.examDate  = new Date(String(body.exam_date));
  if (body.start_time !== undefined) data.startTime = String(body.start_time);
  if (body.end_time   !== undefined) data.endTime   = String(body.end_time);
  if (body.room       !== undefined) data.room      = body.room ? String(body.room) : null;
  if (body.full_marks !== undefined) data.fullMarks = body.full_marks ? Number(body.full_marks) : null;
  if (body.pass_marks !== undefined) data.passMarks = body.pass_marks ? Number(body.pass_marks) : null;

  const entry = await db.examSubjectSchedule.update({ where: { id: scheduleId }, data });
  await syncExamDates(examId);
  return NextResponse.json({ ok: true, id: entry.id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: examId, scheduleId } = await params;
  await db.examSubjectSchedule.delete({ where: { id: scheduleId } });
  await syncExamDates(examId);
  return NextResponse.json({ message: "Deleted" });
}
