import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/server";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const setting = await db.schoolSetting.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return NextResponse.json({ setting });
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const { name, address, city, phone, email, website, eiin, established } = body;

  const setting = await db.schoolSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name:        name        ?? "",
      address:     address     ?? "",
      city:        city        ?? "",
      phone:       phone       ?? "",
      email:       email       ?? "",
      website:     website     ?? "",
      eiin:        eiin        ?? "",
      established: established ?? "",
    },
    update: {
      ...(name        !== undefined && { name }),
      ...(address     !== undefined && { address }),
      ...(city        !== undefined && { city }),
      ...(phone       !== undefined && { phone }),
      ...(email       !== undefined && { email }),
      ...(website     !== undefined && { website }),
      ...(eiin        !== undefined && { eiin }),
      ...(established !== undefined && { established }),
    },
  });
  return NextResponse.json({ setting });
}
