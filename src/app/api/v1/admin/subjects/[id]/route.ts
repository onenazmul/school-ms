import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "name is required" }, { status: 422 });

  const code = body.code ? String(body.code).trim().toUpperCase() : null;

  const subject = await db.subject.update({
    where: { id: Number(id) },
    data: {
      name,
      code: code || null,
      sortOrder: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
      isActive: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    },
  });

  return NextResponse.json({
    subject: { id: subject.id, name: subject.name, code: subject.code ?? null },
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await db.subject.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
