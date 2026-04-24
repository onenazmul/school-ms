// app/api/documents/id-card/[studentId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { IDCardPDF } from "@/components/documents/pdf/IDCardPDF";
import { getStudentById } from "@/lib/mock-data/documents";
import { createElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const id = Number(studentId);

  const student = getStudentById(id);
  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const element = createElement(IDCardPDF, { student });
  const buffer = await renderToBuffer(element as any);

  const filename = `id-card-${student.username}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
