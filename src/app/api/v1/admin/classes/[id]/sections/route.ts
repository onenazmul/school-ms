import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

type Ctx = { params: Promise<{ id: string }> };

async function authAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ message: "Unauthenticated" }, { status: 401 }) };
  if ((session.user as any)?.role !== "admin")
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  return { session };
}

// ── GET  /api/v1/admin/classes/[id]/sections ──────────────────────────────────

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await authAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const sections = await db.classSection.findMany({
      where: { classId: Number(id) },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ sections });
  } catch (err) {
    console.error("GET sections:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/v1/admin/classes/[id]/sections ──────────────────────────────────

export async function POST(req: Request, { params }: Ctx) {
  const auth = await authAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "name is required" }, { status: 422 });

  try {
    const section = await db.classSection.create({
      data: {
        name,
        classId: Number(id),
        sortOrder: typeof body.sort_order === "number" ? body.sort_order : 0,
        isActive: typeof body.is_active === "boolean" ? body.is_active : true,
      },
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002")
      return NextResponse.json({ message: "Section already exists in this class" }, { status: 409 });
    console.error("POST section:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
