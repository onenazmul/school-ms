import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const module  = searchParams.get("module") ?? undefined;
  const from    = searchParams.get("from");
  const to      = searchParams.get("to");
  const page    = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit   = Math.min(100, Math.max(10, Number(searchParams.get("limit") ?? 50)));
  const skip    = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (module && module !== "all") where.module = module;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59Z") } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.activityLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      module: l.module,
      action: l.action,
      entity_type: l.entityType,
      entity_id: l.entityId,
      entity_label: l.entityLabel,
      actor_id: l.actorId,
      actor_name: l.actorName,
      actor_role: l.actorRole,
      description: l.description,
      metadata: l.metadata,
      created_at: l.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
