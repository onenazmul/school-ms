// app/api/documents/id-card/[studentId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { IDCardPDF } from "@/components/documents/pdf/IDCardPDF";
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
    blood_group: student.admission?.bloodGroup ?? null,
    guardian_name: student.admission?.guardianName ?? null,
    guardian_phone: student.admission?.guardianMobileNo ?? null,
    photo,
  };

  const element = createElement(IDCardPDF, { student: cardStudent, schoolInfo });
  const buffer = await renderToBuffer(element as any);

  const filename = `id-card-${cardStudent.username}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
