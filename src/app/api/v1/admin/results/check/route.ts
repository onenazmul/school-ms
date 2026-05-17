import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthenticated" }, { status: 401 });

  const studentId = req.nextUrl.searchParams.get("studentId") ?? "";
  const examId    = req.nextUrl.searchParams.get("examId")    ?? "";

  if (!studentId || !examId)
    return Response.json({ error: "studentId and examId are required" }, { status: 400 });

  const result = await db.examResult.findFirst({
    where: { studentId, examId, publishedAt: { not: null } },
    select: { id: true },
  });

  return Response.json({ has_result: !!result });
}
