import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const subjects = await db.subject.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code ?? null,
      sort_order: s.sortOrder,
      is_active: s.isActive,
    })),
  });
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

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "name is required" }, { status: 422 });

  const code = body.code ? String(body.code).trim().toUpperCase() : null;

  const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;
  const count = await db.subject.count();
  const subject = await db.subject.create({
    data: {
      name,
      code: code || null,
      sortOrder: count,
      isActive,
    },
  });

  return NextResponse.json({
    subject: { id: subject.id, name: subject.name, code: subject.code ?? null, is_active: subject.isActive },
  }, { status: 201 });
}
