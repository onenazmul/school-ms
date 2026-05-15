import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type        = searchParams.get("type") ?? undefined;
  const status      = searchParams.get("status") ?? undefined;
  const admissionId = searchParams.get("admission_id");
  const page        = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize    = Math.min(100, Number(searchParams.get("page_size") ?? 25));

  const where: Record<string, unknown> = {};
  if (type)        where.type        = type;
  if (status)      where.status      = status;
  if (admissionId) where.admissionId = Number(admissionId);

  const [logs, total] = await Promise.all([
    db.smsLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.smsLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total });
}
