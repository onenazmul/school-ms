import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const cls = await db.schoolClass.findUnique({
      where: { id: Number(id) },
      include: { sections: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
    if (!cls) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const q       = searchParams.get("q")?.trim() ?? "";
    const section = searchParams.get("section")?.trim() ?? "";

    const studentWhere: Record<string, unknown> = { className: cls.name };
    if (section) studentWhere.section = section;
    if (q) studentWhere.OR = [
      { admission: { nameEn: { contains: q } } },
      { rollNumber: { contains: q } },
    ];

    const [students, totalCount, activeCount] = await Promise.all([
      db.student.findMany({
        where: studentWhere,
        include: {
          admission: { select: { nameEn: true, gender: true, fatherMobileNo: true, guardianMobileNo: true } },
        },
        orderBy: [{ rollNumber: "asc" }, { enrolledAt: "asc" }],
        take: 100,
      }),
      db.student.count({ where: { className: cls.name } }),
      db.student.count({ where: { className: cls.name, status: "Active" } }),
    ]);

    return NextResponse.json({
      class: cls,
      total_students: totalCount,
      active_students: activeCount,
      students: students.map((s) => ({
        id: s.id,
        name: s.admission?.nameEn ?? "Unknown",
        roll: s.rollNumber ?? null,
        section: s.section ?? null,
        gender: s.admission?.gender ?? null,
        phone: s.admission?.fatherMobileNo || s.admission?.guardianMobileNo || null,
        status: s.status,
        enrolled_at: s.enrolledAt.toISOString().split("T")[0],
      })),
    });
  } catch (err) {
    console.error("GET /api/v1/admin/classes/[id]:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
