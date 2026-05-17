// app/api/documents/admit-card/bulk/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
import { AdmitCardPDF } from "@/components/documents/pdf/AdmitCardPDF";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createElement } from "react";
import { photoToDataUri } from "@/lib/documents/photo-utils";

const DEFAULT_INSTRUCTIONS = [
  "Bring this admit card to the examination hall. Entry will not be permitted without it.",
  "Arrive at the hall at least 15 minutes before the examination starts.",
  "Mobile phones and electronic devices are strictly prohibited.",
  "Sit only in the seat assigned to your roll number.",
  "Write your roll number clearly on the answer script.",
];

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
      },
    }),
    db.schoolSetting.findUnique({ where: { id: 1 } }),
  ]);

  if (students.length === 0) {
    return new Response(JSON.stringify({ error: "No students found for the given filters" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Find published exam applicable to this class
  const exam = await db.exam.findFirst({
    where: {
      status: "published",
      OR: [{ className: null }, { className: class_name ?? null }],
    },
    orderBy: { startDate: "desc" },
    include: { schedule: { orderBy: { sortOrder: "asc" } } },
  });

  if (!exam) {
    return new Response(JSON.stringify({ error: "No published exam found for the selected class" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const schoolInfo = {
    name: schoolSetting?.name ?? "School Name",
    address: [schoolSetting?.address, schoolSetting?.city].filter(Boolean).join(", ") || "—",
  };

  const examCard = {
    exam_name: exam.name,
    academic_year: exam.academicYear,
    schedule: exam.schedule.map((s) => ({
      subject: s.subject,
      date: s.examDate.toISOString().split("T")[0],
      day: s.examDate.toLocaleDateString("en-US", { weekday: "long" }),
      time: `${s.startTime} – ${s.endTime}`,
      room: s.room ?? "—",
    })),
    instructions: (exam.instructions as string[] | null) ?? DEFAULT_INSTRUCTIONS,
  };

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    const pdfPromises = students.map(async (student) => {
      const photo = await photoToDataUri(student.admission?.studentPhoto);
      const cardStudent = {
        id: student.id,
        username: student.user?.username ?? student.id,
        name: student.admission?.nameEn ?? "—",
        class_name: student.className,
        section: student.section ?? null,
        roll_number: student.rollNumber ?? null,
        gender: student.admission?.gender ?? null,
        dob: fmtDate(student.admission?.dob),
        photo,
      };
      const element = createElement(AdmitCardPDF, { student: cardStudent, examCard, schoolInfo });
      const buf = await renderToBuffer(element as any);
      archive.append(buf, { name: `admit-card-${cardStudent.username}.pdf` });
    });

    Promise.all(pdfPromises).then(() => archive.finalize()).catch(reject);
  });

  const label = class_name
    ? `${class_name.replace(/\s+/g, "-").toLowerCase()}${section ? `-${section}` : ""}`
    : "all-students";

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="admit-cards-${label}.zip"`,
      "X-Student-Count": String(students.length),
    },
  });
}
