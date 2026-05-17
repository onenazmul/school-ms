// app/api/documents/result-card/bulk/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { class_name, section, academic_year, exam_id } = body as {
    class_name?: string; section?: string; academic_year?: string; exam_id?: string;
  };

  const where: Record<string, unknown> = { status: "Active" };
  if (class_name) where.className = class_name;
  if (section) where.section = section;
  if (academic_year) where.academicYear = academic_year;

  const [students, schoolSetting] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        admission: true,
        user: { select: { username: true } },
        results: {
          where: { publishedAt: { not: null }, ...(exam_id ? { examId: exam_id } : {}) },
          orderBy: { publishedAt: "desc" },
          take: 1,
        },
      },
    }),
    db.schoolSetting.findUnique({ where: { id: 1 } }),
  ]);

  const studentsWithResults = students.filter((s) => s.results.length > 0);

  if (studentsWithResults.length === 0) {
    return new Response(JSON.stringify({ error: "No published results found for the given filters" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const schoolInfo = {
    name: schoolSetting?.name ?? "School Name",
    address: [schoolSetting?.address, schoolSetting?.city].filter(Boolean).join(", ") || "—",
    phone: schoolSetting?.phone ?? "—",
  };

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    const pdfPromises = studentsWithResults.map(async (student) => {
      const photo = await photoToDataUri(student.admission?.studentPhoto);
      const examResult = student.results[0];
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
      const buf = await renderToBuffer(element as any);
      archive.append(buf, { name: `result-card-${cardStudent.username}.pdf` });
    });

    Promise.all(pdfPromises).then(() => archive.finalize()).catch(reject);
  });

  const label = class_name
    ? `${class_name.replace(/\s+/g, "-").toLowerCase()}${section ? `-${section}` : ""}`
    : "all-students";

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="result-cards-${label}.zip"`,
      "X-Student-Count": String(studentsWithResults.length),
    },
  });
}
