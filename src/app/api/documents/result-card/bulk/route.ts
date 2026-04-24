// app/api/documents/result-card/bulk/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
import { ResultCardPDF } from "@/components/documents/pdf/ResultCardPDF";
import {
  getStudentsByClass, getResultByStudentId, MOCK_STUDENTS,
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

  const studentsWithResults = students.filter((s) => !!getResultByStudentId(s.id));

  if (studentsWithResults.length === 0) {
    return new Response(JSON.stringify({ error: "No results found for the given filters" }), {
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

    const pdfPromises = studentsWithResults.map((student) => {
      const result = getResultByStudentId(student.id)!;
      const element = createElement(ResultCardPDF, { student, result });
      return renderToBuffer(element as any).then((buf) => {
        archive.append(buf, { name: `result-card-${student.username}.pdf` });
      });
    });

    Promise.all(pdfPromises)
      .then(() => archive.finalize())
      .catch(reject);
  });

  const label = class_name
    ? `${class_name.replace(/\s+/g, "-").toLowerCase()}${section ? `-${section}` : ""}`
    : "all-students";
  const filename = `result-cards-${label}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Student-Count": String(studentsWithResults.length),
    },
  });
}
