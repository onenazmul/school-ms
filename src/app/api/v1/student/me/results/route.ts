import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

function calcGPA(obtained: number, total: number): number {
  if (total === 0) return 0;
  const pct = (obtained / total) * 100;
  if (pct >= 80) return 5.0;
  if (pct >= 70) return 4.0;
  if (pct >= 60) return 3.5;
  if (pct >= 50) return 3.0;
  if (pct >= 40) return 2.0;
  if (pct >= 33) return 1.0;
  return 0.0;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any).role !== "student")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { student: { select: { id: true } } },
  });
  if (!user?.student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  const results = await db.examResult.findMany({
    where: { studentId: user.student.id, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({
    results: results.map((r) => {
      const subjects: any[] = r.subjects ? JSON.parse(r.subjects as string) : [];
      const totalObtained = subjects.reduce((s, sub) => s + Number(sub.obtainedMarks ?? sub.obtained_marks ?? 0), 0);
      const totalMax = subjects.reduce((s, sub) => s + Number(sub.fullMarks ?? sub.max_marks ?? 0), 0);
      return {
        id: r.id,
        exam_id: r.examId,
        exam_name: r.examName,
        academic_year: r.academicYear,
        subjects: subjects.map((s) => ({
          subject:        String(s.subject ?? ""),
          subject_code:   s.subject_code ? String(s.subject_code) : null,
          full_marks:     Number(s.fullMarks ?? s.max_marks ?? 0),
          obtained_marks: Number(s.obtainedMarks ?? s.obtained_marks ?? 0),
          grade:          String(s.grade ?? ""),
          remarks:        String(s.remarks ?? ""),
        })),
        total_obtained: Number(r.totalMarks) || totalObtained,
        total_max:      totalMax,
        gpa:            calcGPA(Number(r.totalMarks) || totalObtained, totalMax),
        position:       r.position ?? null,
        total_students: (r as any).totalStudents ?? null,
        pass:           (r as any).pass ?? null,
        teacher_remarks:(r as any).teacherRemarks ?? null,
        published_at:   r.publishedAt!.toISOString(),
      };
    }),
  });
}
