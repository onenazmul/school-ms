// app/api/documents/result-card/[studentId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { ResultCardPDF } from "@/components/documents/pdf/ResultCardPDF";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createElement } from "react";
import { photoToDataUri } from "@/lib/documents/photo-utils";

function fmtDate(d: Date | null | undefined) {
  if (!d) return null;
  return d.toISOString().split("T")[0];
}

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });

  const { studentId } = await params;
  const url = new URL(req.url);
  const examId = url.searchParams.get("examId") ?? "";

  const [student, schoolSetting] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      include: {
        admission: true,
        user: { select: { username: true } },
      },
    }),
    db.schoolSetting.findUnique({ where: { id: 1 } }),
  ]);
  const photo = await photoToDataUri(student?.admission?.studentPhoto);

  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Find result: filter by specific exam if examId provided, otherwise most recent published
  const examResult = examId
    ? await db.examResult.findFirst({
        where: { studentId, examId, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
      })
    : await db.examResult.findFirst({
        where: { studentId, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
      });

  if (!examResult) {
    return new Response(
      JSON.stringify({ error: examId ? "No published result found for this exam" : "No published result found for this student" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const schoolInfo = {
    name: schoolSetting?.name ?? "School Name",
    address: [schoolSetting?.address, schoolSetting?.city].filter(Boolean).join(", ") || "—",
    phone: schoolSetting?.phone ?? "—",
  };

  const cardStudent = {
    id: student.id,
    username: student.user?.username ?? student.id,
    name: student.admission?.nameEn ?? "—",
    class_name: student.className,
    section: student.section ?? null,
    roll_number: student.rollNumber ?? null,
    gender: student.admission?.gender ?? null,
    dob: fmtDate(student.admission?.dob),
    guardian_name: student.admission?.guardianName ?? null,
    photo,
  };

  const rawSubjects = (JSON.parse(examResult.subjects as string) as any[]) ?? [];
  const subjects = rawSubjects.map((s: any) => ({
    subject:        String(s.subject ?? ""),
    subject_code:   s.subject_code ? String(s.subject_code) : null,
    max_marks:      Number(s.fullMarks ?? s.max_marks ?? 0),
    obtained_marks: Number(s.obtainedMarks ?? s.obtained_marks ?? 0),
    remarks:        s.remarks ? String(s.remarks) : undefined,
  }));

  const totalObtained = subjects.reduce((a, s) => a + s.obtained_marks, 0);
  const totalMax = subjects.reduce((a, s) => a + s.max_marks, 0);

  const result = {
    exam_term:          examResult.examName,
    academic_year:      examResult.academicYear,
    subjects,
    total_obtained:     Number(examResult.totalMarks) || totalObtained,
    total_max:          totalMax,
    gpa:                calcGPA(totalObtained, totalMax),
    position:           examResult.position ?? null,
    total_students:     (examResult as any).totalStudents ?? null,
    attendance_present: (examResult as any).attendancePresent ?? null,
    attendance_total:   (examResult as any).attendanceTotal ?? null,
    pass:               (examResult as any).pass ?? null,
    teacher_remarks:    (examResult as any).teacherRemarks ?? "",
  };

  const element = createElement(ResultCardPDF, { student: cardStudent, result, schoolInfo });
  const buffer = await renderToBuffer(element as any);

  const username = student.user?.username ?? student.id;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="result-card-${username}.pdf"`,
    },
  });
}
