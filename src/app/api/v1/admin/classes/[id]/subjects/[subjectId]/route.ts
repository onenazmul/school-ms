import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

type Ctx = { params: Promise<{ id: string; subjectId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { subjectId } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const cs = await db.classSubject.update({
    where: { id: Number(subjectId) },
    data: {
      defaultFullMarks: body.default_full_marks !== undefined ? (body.default_full_marks ? Number(body.default_full_marks) : null) : undefined,
      defaultPassMarks: body.default_pass_marks !== undefined ? (body.default_pass_marks ? Number(body.default_pass_marks) : null) : undefined,
      sortOrder: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
      isActive: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    },
  });

  return NextResponse.json({ ok: true, id: cs.id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { subjectId } = await params;

  await db.classSubject.delete({ where: { id: Number(subjectId) } });

  return NextResponse.json({ ok: true });
}
