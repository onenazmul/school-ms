import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

type Ctx = { params: Promise<{ id: string; sectionId: string }> };

async function authAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ message: "Unauthenticated" }, { status: 401 }) };
  if ((session.user as any)?.role !== "admin")
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await authAdmin();
  if (auth.error) return auth.error;

  const { sectionId } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.sort_order !== undefined) data.sortOrder = Number(body.sort_order);
  if (body.is_active !== undefined) data.isActive = Boolean(body.is_active);

  try {
    const section = await db.classSection.update({ where: { id: Number(sectionId) }, data });
    return NextResponse.json({ section });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002")
      return NextResponse.json({ message: "Section name already exists in this class" }, { status: 409 });
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    console.error("PATCH section:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await authAdmin();
  if (auth.error) return auth.error;

  const { sectionId } = await params;
  try {
    await db.classSection.delete({ where: { id: Number(sectionId) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    console.error("DELETE section:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
