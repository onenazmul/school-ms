import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const classes = await db.schoolClass.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        sections: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true },
        },
      },
    });
    return NextResponse.json({ classes });
  } catch (err) {
    console.error("GET /api/v1/classes:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
