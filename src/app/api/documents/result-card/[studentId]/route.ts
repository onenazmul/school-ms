// app/api/documents/result-card/[studentId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { ResultCardPDF } from "@/components/documents/pdf/ResultCardPDF";
import { getStudentById, getResultByStudentId } from "@/lib/mock-data/documents";
import { createElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const id = Number(studentId);

  const student = getStudentById(id);
  const result = getResultByStudentId(id);

  if (!student || !result) {
    return new Response(JSON.stringify({ error: "Student or result not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const element = createElement(ResultCardPDF, { student, result });
  const buffer = await renderToBuffer(element as any);

  const filename = `result-card-${student.username}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
