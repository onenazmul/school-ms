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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });

  const { studentId } = await params;

  const [student, examResult, schoolSetting] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      include: {
        admission: true,
        user: { select: { username: true } },
      },
    }),
    db.examResult.findFirst({
      where: { studentId, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
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
  if (!examResult) {
    return new Response(JSON.stringify({ error: "No published result found for this student" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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
    grade:          String(s.grade ?? ""),
    remarks:        String(s.remarks ?? ""),
  }));

  const totalObtained = subjects.reduce((a, s) => a + s.obtained_marks, 0);
  const totalMax = subjects.reduce((a, s) => a + s.max_marks, 0);

  const result = {
    exam_term:          examResult.examName,
    academic_year:      examResult.academicYear,
    subjects,
    total_obtained:     Number(examResult.totalMarks) || totalObtained,
    total_max:          totalMax,
    percentage:         totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0,
    overall_grade:      examResult.grade ?? "—",
    position:           examResult.position ?? 0,
    total_students:     (examResult as any).totalStudents ?? 0,
    attendance_present: (examResult as any).attendancePresent ?? 0,
    attendance_total:   (examResult as any).attendanceTotal ?? 0,
    pass:               (examResult as any).pass ?? true,
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
