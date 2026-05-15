import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
    if (body.sort_order !== undefined) data.sortOrder = Number(body.sort_order);
    if (body.is_active !== undefined) data.isActive = Boolean(body.is_active);

    const cls = await db.schoolClass.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ class: cls });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002")
      return NextResponse.json({ message: "Class name already exists" }, { status: 409 });
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    console.error("PATCH /api/v1/admin/classes/[id]:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await db.schoolClass.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025")
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    console.error("DELETE /api/v1/admin/classes/[id]:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
