import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const configId = Number(id);

  const exists = await db.admissionConfig.findUnique({ where: { id: configId } });
  if (!exists) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Deactivate all, then activate the target
  await db.$transaction([
    db.admissionConfig.updateMany({ data: { isActive: false } }),
    db.admissionConfig.update({ where: { id: configId }, data: { isActive: true } }),
  ]);

  return NextResponse.json({ message: "Activated", id: configId });
}
