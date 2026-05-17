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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { class_name, section, academic_year } = body as {
    class_name?: string; section?: string; academic_year?: string;
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
          where: { publishedAt: { not: null } },
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
        grade:          String(s.grade ?? ""),
        remarks:        String(s.remarks ?? ""),
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
