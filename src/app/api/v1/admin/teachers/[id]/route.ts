import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

function serialize(t: {
  id: string; name: string; email: string | null; phone: string | null;
  subject: string | null; designation: string; qualification: string | null;
  joiningDate: Date | null; classes: unknown; status: string;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: t.id, name: t.name, email: t.email, phone: t.phone,
    subject: t.subject, designation: t.designation, qualification: t.qualification,
    joining_date: t.joiningDate ? t.joiningDate.toISOString().split("T")[0] : null,
    classes: Array.isArray(t.classes) ? t.classes as string[] : [],
    status: t.status,
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.email !== undefined) data.email = body.email ? String(body.email).trim() : null;
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
  if (body.subject !== undefined) data.subject = body.subject ? String(body.subject) : null;
  if (body.designation !== undefined) data.designation = String(body.designation);
  if (body.qualification !== undefined) data.qualification = body.qualification ? String(body.qualification) : null;
  if (body.joining_date !== undefined) data.joiningDate = body.joining_date ? new Date(String(body.joining_date)) : null;
  if (body.classes !== undefined) data.classes = Array.isArray(body.classes) ? body.classes : [];
  if (body.status !== undefined) data.status = String(body.status);

  try {
    const teacher = await db.teacher.update({ where: { id }, data });
    return NextResponse.json({ teacher: serialize(teacher) });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    if ((err as { code?: string })?.code === "P2002")
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await db.teacher.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    throw err;
  }
}
