// app/api/documents/admit-card/bulk/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
import { AdmitCardPDF } from "@/components/documents/pdf/AdmitCardPDF";
import {
  getStudentsByClass, getExamCardByStudentId, MOCK_STUDENTS,
} from "@/lib/mock-data/documents";
import { createElement } from "react";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { class_name, section, academic_year } = body as {
    class_name?: string;
    section?: string;
    academic_year?: string;
  };

  const students =
    class_name
      ? getStudentsByClass(class_name, section)
      : MOCK_STUDENTS.filter((s) => !academic_year || s.academic_year === academic_year);

  const studentsWithCards = students.filter((s) => !!getExamCardByStudentId(s.id));

  if (studentsWithCards.length === 0) {
    return new Response(JSON.stringify({ error: "No admit cards found for the given filters" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    const pdfPromises = studentsWithCards.map((student) => {
      const examCard = getExamCardByStudentId(student.id)!;
      const element = createElement(AdmitCardPDF, { student, examCard });
      return renderToBuffer(element as any).then((buf) => {
        archive.append(buf, { name: `admit-card-${student.username}.pdf` });
      });
    });

    Promise.all(pdfPromises)
      .then(() => archive.finalize())
      .catch(reject);
  });

  const label = class_name
    ? `${class_name.replace(/\s+/g, "-").toLowerCase()}${section ? `-${section}` : ""}`
    : "all-students";
  const filename = `admit-cards-${label}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Student-Count": String(studentsWithCards.length),
    },
  });
}
