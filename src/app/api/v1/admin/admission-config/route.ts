import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const configs = await db.admissionConfig.findMany({
    orderBy: { createdAt: "desc" },
    include: { classConfigs: true },
  });
  return NextResponse.json({ configs });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const academicYear = String(body.academic_year ?? "").trim();
  if (!academicYear)
    return NextResponse.json({ message: "academic_year required" }, { status: 422 });

  const config = await db.admissionConfig.create({
    data: {
      academicYear,
      feeMode: String(body.fee_mode ?? "same_for_all"),
      globalFee: body.global_fee != null ? Number(body.global_fee) : null,
      applicationStartDate: body.application_start_date ? new Date(String(body.application_start_date)) : null,
      applicationEndDate:   body.application_end_date   ? new Date(String(body.application_end_date))   : null,
      globalTestDay:  body.global_test_day  ? new Date(String(body.global_test_day))  : null,
      globalTestType: body.global_test_type ? String(body.global_test_type)           : null,
      globalMaxWrittenMarks: body.global_max_written_marks != null ? Number(body.global_max_written_marks) : null,
      globalMaxVivaMarks:    body.global_max_viva_marks    != null ? Number(body.global_max_viva_marks)    : null,
      resultDay:        body.result_day        ? new Date(String(body.result_day))        : null,
      resultVisibility: body.result_visibility ? String(body.result_visibility)           : "real_time",
      marksThresholdEnabled: Boolean(body.marks_threshold_enabled ?? false),
      marksPassThreshold:    body.marks_pass_threshold != null ? Number(body.marks_pass_threshold) : null,
      marksThresholdAction:  body.marks_threshold_action ? String(body.marks_threshold_action) : "flag_review",
    },
    include: { classConfigs: true },
  });

  return NextResponse.json({ config }, { status: 201 });
}
