import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const config = await db.admissionConfig.findUnique({
    where: { id: Number(id) },
    include: { classConfigs: true },
  });
  if (!config) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ config });
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

  const data: Record<string, unknown> = {};
  if (body.academic_year        !== undefined) data.academicYear        = String(body.academic_year);
  if (body.fee_mode             !== undefined) data.feeMode             = String(body.fee_mode);
  if (body.global_fee           !== undefined) data.globalFee           = body.global_fee != null ? Number(body.global_fee) : null;
  if (body.application_start_date !== undefined) data.applicationStartDate = body.application_start_date ? new Date(String(body.application_start_date)) : null;
  if (body.application_end_date   !== undefined) data.applicationEndDate   = body.application_end_date   ? new Date(String(body.application_end_date))   : null;
  if (body.global_test_day      !== undefined) data.globalTestDay      = body.global_test_day  ? new Date(String(body.global_test_day))  : null;
  if (body.global_test_type     !== undefined) data.globalTestType     = body.global_test_type ? String(body.global_test_type)           : null;
  if (body.global_max_written_marks !== undefined) data.globalMaxWrittenMarks = body.global_max_written_marks != null ? Number(body.global_max_written_marks) : null;
  if (body.global_max_viva_marks    !== undefined) data.globalMaxVivaMarks    = body.global_max_viva_marks    != null ? Number(body.global_max_viva_marks)    : null;
  if (body.result_day           !== undefined) data.resultDay           = body.result_day        ? new Date(String(body.result_day))        : null;
  if (body.result_visibility    !== undefined) data.resultVisibility    = String(body.result_visibility);
  if (body.marks_threshold_enabled !== undefined) data.marksThresholdEnabled = Boolean(body.marks_threshold_enabled);
  if (body.marks_pass_threshold    !== undefined) data.marksPassThreshold    = body.marks_pass_threshold != null ? Number(body.marks_pass_threshold) : null;
  if (body.marks_threshold_action  !== undefined) data.marksThresholdAction  = String(body.marks_threshold_action);

  const config = await db.admissionConfig.update({
    where: { id: Number(id) },
    data,
    include: { classConfigs: true },
  });
  return NextResponse.json({ config });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.admissionConfig.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: "Deleted" });
}
