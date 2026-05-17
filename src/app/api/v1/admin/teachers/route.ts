import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

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
    classes: t.classes ? JSON.parse(t.classes as string) as string[] : [],
    status: t.status,
  };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const subject = searchParams.get("subject") ?? "";
  const status = searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (subject) where.subject = subject;
  if (status) where.status = status;
  if (q) where.OR = [
    { name: { contains: q } },
    { email: { contains: q } },
    { phone: { contains: q } },
  ];

  const teachers = await db.teacher.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ teachers: teachers.map(serialize) });
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

  const { name, email, phone, subject, designation, qualification, joining_date, classes } = body;
  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ message: "name is required" }, { status: 422 });

  try {
    const teacher = await db.teacher.create({
      data: {
        id: createId(),
        name: String(name).trim(),
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        subject: subject ? String(subject).trim() : null,
        designation: designation ? String(designation) : "Teacher",
        qualification: qualification ? String(qualification).trim() : null,
        joiningDate: joining_date ? new Date(String(joining_date)) : null,
        classes: JSON.stringify(Array.isArray(classes) ? classes : []),
        status: "active",
      },
    });
    return NextResponse.json({ teacher: serialize(teacher) }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002")
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    throw err;
  }
}
