import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const submissions = await db.paymentSubmission.findMany({
    include: {
      admission: {
        select: {
          nameEn: true,
          user: { select: { username: true } },
        },
      },
      student: {
        select: {
          admission: { select: { nameEn: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const data = submissions.map((s) => ({
    id: s.id,
    admission_id: s.admissionId,
    student_id: s.studentId,
    applicant_username: s.admission?.user?.username ?? null,
    applicant_name: s.admission?.nameEn ?? s.student?.admission?.nameEn ?? null,
    payment_context: s.paymentContext,
    method: s.method,
    transaction_id: s.transactionId,
    phone_number: s.phoneNumber,
    amount_sent: s.amountSent.toString(),
    payment_date: s.paymentDate.toISOString().split("T")[0],
    notes: s.notes,
    screenshot_url: s.screenshotUrl,
    status: s.status,
    admin_note: s.adminNote,
    verified_by: s.verifiedBy,
    verified_at: s.verifiedAt?.toISOString() ?? null,
    submitted_at: s.submittedAt.toISOString(),
  }));

  return NextResponse.json({ submissions: data });
}
