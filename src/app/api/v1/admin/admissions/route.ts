import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { serializeAdmission } from "@/lib/serializers/admission";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const admissions = await db.admission.findMany({
    include: {
      user: { select: { username: true } },
      mark: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const data = admissions.map((a) => ({
    ...serializeAdmission(a),
    username: a.user?.username ?? null,
    mark: a.mark
      ? {
          written_marks: a.mark.writtenMarks,
          viva_marks: a.mark.vivaMarks,
          total_marks: a.mark.totalMarks,
          entered_by: a.mark.enteredBy,
          entered_at: a.mark.enteredAt.toISOString(),
        }
      : null,
  }));

  return NextResponse.json({ admissions: { data, total: data.length } });
}
