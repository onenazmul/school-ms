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
  const classConfigs = await db.classAdmissionConfig.findMany({
    where: { admissionConfigId: Number(id) },
    orderBy: { className: "asc" },
  });
  return NextResponse.json({ classConfigs });
}

export async function POST(
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

  const className = String(body.class_name ?? "").trim();
  if (!className)
    return NextResponse.json({ message: "class_name required" }, { status: 422 });

  const classConfig = await db.classAdmissionConfig.create({
    data: {
      admissionConfigId: Number(id),
      className,
      fee:             body.fee             != null ? Number(body.fee)             : null,
      testDay:         body.test_day        ? new Date(String(body.test_day))       : null,
      testType:        body.test_type       ? String(body.test_type)               : null,
      maxWrittenMarks: body.max_written_marks != null ? Number(body.max_written_marks) : null,
      maxVivaMarks:    body.max_viva_marks    != null ? Number(body.max_viva_marks)    : null,
      resultDay:       body.result_day      ? new Date(String(body.result_day))     : null,
    },
  });
  return NextResponse.json({ classConfig }, { status: 201 });
}
