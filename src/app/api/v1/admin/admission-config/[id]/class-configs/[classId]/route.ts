import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; classId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { classId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.class_name         !== undefined) data.className        = String(body.class_name);
  if (body.fee                !== undefined) data.fee              = body.fee != null ? Number(body.fee) : null;
  if (body.test_day           !== undefined) data.testDay          = body.test_day ? new Date(String(body.test_day)) : null;
  if (body.test_type          !== undefined) data.testType         = body.test_type ? String(body.test_type) : null;
  if (body.max_written_marks  !== undefined) data.maxWrittenMarks  = body.max_written_marks != null ? Number(body.max_written_marks) : null;
  if (body.max_viva_marks     !== undefined) data.maxVivaMarks     = body.max_viva_marks != null ? Number(body.max_viva_marks) : null;
  if (body.result_day         !== undefined) data.resultDay        = body.result_day ? new Date(String(body.result_day)) : null;

  const classConfig = await db.classAdmissionConfig.update({
    where: { id: Number(classId) },
    data,
  });
  return NextResponse.json({ classConfig });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; classId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { classId } = await params;
  await db.classAdmissionConfig.delete({ where: { id: Number(classId) } });
  return NextResponse.json({ message: "Deleted" });
}
