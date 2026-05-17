// app/api/documents/admit-card/[studentId]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
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

  // Find published exam for this student's class
  const exam = await db.exam.findFirst({
    where: {
      status: "published",
      OR: [{ className: null }, { className: student.className }],
    },
    orderBy: { startDate: "desc" },
    include: { schedule: { orderBy: { sortOrder: "asc" } } },
  });

  if (!exam) {
    return new Response(JSON.stringify({ error: "No published exam found for this student's class" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const schoolInfo = {
    name: schoolSetting?.name ?? "School Name",
    address: [schoolSetting?.address, schoolSetting?.city].filter(Boolean).join(", ") || "—",
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
    photo,
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

  const element = createElement(AdmitCardPDF, { student: cardStudent, examCard, schoolInfo });
  const buffer = await renderToBuffer(element as any);

  const username = student.user?.username ?? student.id;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="admit-card-${username}.pdf"`,
    },
  });
}
