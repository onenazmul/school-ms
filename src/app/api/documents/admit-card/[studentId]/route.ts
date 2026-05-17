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
  const url = new URL(req.url);
  const examId = url.searchParams.get("examId") ?? "";

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

  // Find exam: specific by ID if provided, otherwise most recent published for student's class
  const exam = examId
    ? await db.exam.findUnique({
        where: { id: examId },
        include: { schedule: { orderBy: { sortOrder: "asc" } } },
      })
    : await db.exam.findFirst({
        where: {
          status: "published",
          OR: [{ className: null }, { className: student.className }],
        },
        orderBy: { startDate: "desc" },
        include: { schedule: { orderBy: { sortOrder: "asc" } } },
      });

  if (!exam) {
    return new Response(
      JSON.stringify({ error: examId ? "Exam not found" : "No published exam found for this student's class" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const dbRules = schoolSetting?.admitCardRules
    ? (JSON.parse(schoolSetting.admitCardRules) as string[])
    : [];

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

  // For per-class exams, filter to this student's class (or entries with no class = shared)
  const filteredSchedule = exam.schedule.filter(
    (s) => s.className === "" || s.className === student.className
  );

  const examCard = {
    exam_name: exam.name,
    academic_year: exam.academicYear,
    schedule: filteredSchedule.map((s) => ({
      subject: s.subject,
      date: s.examDate.toISOString().split("T")[0],
      day: s.examDate.toLocaleDateString("en-US", { weekday: "long" }),
      time: `${s.startTime} – ${s.endTime}`,
      room: s.room ?? "—",
    })),
    instructions: dbRules.length > 0 ? dbRules : ((exam.instructions as string[] | null) ?? DEFAULT_INSTRUCTIONS),
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
