// app/api/documents/admit-card/[studentId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { AdmitCardPDF } from "@/components/documents/pdf/AdmitCardPDF";
import { getStudentById, getExamCardByStudentId } from "@/lib/mock-data/documents";
import { createElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const id = Number(studentId);

  const student = getStudentById(id);
  const examCard = getExamCardByStudentId(id);

  if (!student || !examCard) {
    return new Response(JSON.stringify({ error: "Student or exam card not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const element = createElement(AdmitCardPDF, { student, examCard });
  const buffer = await renderToBuffer(element as any);

  const filename = `admit-card-${student.username}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
