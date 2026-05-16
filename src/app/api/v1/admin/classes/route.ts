import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const classes = await db.schoolClass.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        sections: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });
    return NextResponse.json({ classes });
  } catch (err) {
    console.error("GET /api/v1/admin/classes:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { name, sort_order, is_active } = body as Record<string, unknown>;
    if (!name || typeof name !== "string" || !name.trim())
      return NextResponse.json({ message: "name is required" }, { status: 422 });

    const cls = await db.schoolClass.create({
      data: {
        name: (name as string).trim(),
        sortOrder: typeof sort_order === "number" ? sort_order : 0,
        isActive: typeof is_active === "boolean" ? is_active : true,
      },
    });
    return NextResponse.json({ class: cls }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002")
      return NextResponse.json({ message: "Class name already exists" }, { status: 409 });
    console.error("POST /api/v1/admin/classes:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
