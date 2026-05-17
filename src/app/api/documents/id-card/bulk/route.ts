// app/api/documents/id-card/bulk/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
import { IDCardPDF } from "@/components/documents/pdf/IDCardPDF";
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
        blood_group: student.admission?.bloodGroup ?? null,
        guardian_name: student.admission?.guardianName ?? null,
        guardian_phone: student.admission?.guardianMobileNo ?? null,
        photo,
      };
      const element = createElement(IDCardPDF, { student: cardStudent, schoolInfo });
      const buf = await renderToBuffer(element as any);
      archive.append(buf, { name: `id-card-${cardStudent.username}.pdf` });
    });

    Promise.all(pdfPromises).then(() => archive.finalize()).catch(reject);
  });

  const label = class_name
    ? `${class_name.replace(/\s+/g, "-").toLowerCase()}${section ? `-${section}` : ""}`
    : "all-students";

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="id-cards-${label}.zip"`,
      "X-Student-Count": String(students.length),
    },
  });
}
