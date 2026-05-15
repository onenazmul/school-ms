import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any).role !== "student")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      student: {
        include: {
          admission: true,
          bills: {
            include: { feeConfig: { select: { name: true, type: true } } },
            orderBy: { dueDate: "asc" },
          },
          receipts: {
            include: {
              items: {
                include: { bill: { include: { feeConfig: { select: { name: true } } } } },
              },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      },
    },
  });

  if (!user?.student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

  const s = user.student;
  const a = s.admission;

  const currentYear = new Date().getFullYear();
  const unpaidBills = s.bills.filter((b) => b.status === "unpaid" || b.status === "partial");
  const dueBalance = unpaidBills.reduce((sum, b) => sum + Number(b.amount) + Number(b.lateFee), 0);

  // Also include verified admission/enrollment payments in "paid this year"
  const admissionSubmissions = user.admissionId
    ? await db.paymentSubmission.findMany({
        where: {
          admissionId: user.admissionId,
          paymentContext: { in: ["admission", "enrollment"] },
          status: "verified",
        },
        orderBy: { verifiedAt: "desc" },
      })
    : [];

  const paidThisYearFromReceipts = s.receipts
    .filter((r) => r.paymentDate.getFullYear() === currentYear)
    .reduce((sum, r) => sum + Number(r.receivedAmount), 0);
  const paidThisYearFromSubmissions = admissionSubmissions
    .filter((s) => (s.verifiedAt ?? s.submittedAt).getFullYear() === currentYear)
    .reduce((sum, s) => sum + Number(s.amountSent), 0);
  const paidThisYear = paidThisYearFromReceipts + paidThisYearFromSubmissions;

  const nextDue = unpaidBills[0] ?? null;

  // Merge admin receipts + verified admission/enrollment submissions for recent display
  type RecentEntry = {
    id: string;
    source: "fee_receipt" | "admission_payment" | "enrollment_payment";
    receipt_number: string | null;
    amount: number;
    payment_date: string;
    payment_method: string;
  };

  const receiptEntries: RecentEntry[] = s.receipts.map((r) => ({
    id: r.id,
    source: "fee_receipt",
    receipt_number: r.receiptNumber,
    amount: Number(r.receivedAmount),
    payment_date: r.paymentDate.toISOString().split("T")[0],
    payment_method: r.paymentMethod,
  }));

  const submissionEntries: RecentEntry[] = admissionSubmissions.map((sub) => ({
    id: sub.id,
    source: sub.paymentContext === "enrollment" ? "enrollment_payment" : "admission_payment",
    receipt_number: sub.receiptNumber ?? null,
    amount: Number(sub.amountSent),
    payment_date: (sub.verifiedAt ?? sub.submittedAt).toISOString().split("T")[0],
    payment_method: sub.method,
  }));

  const recentReceipts = [...receiptEntries, ...submissionEntries]
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
    .slice(0, 3);

  return NextResponse.json({
    student: {
      id: s.id,
      name_en: a?.nameEn ?? user.name,
      name_bn: a?.nameBn ?? null,
      gender: a?.gender ?? null,
      dob: a?.dob?.toISOString().split("T")[0] ?? null,
      blood_group: a?.bloodGroup ?? null,
      nationality: a?.nationality ?? null,
      birth_certificate_no: a?.birthCertificateNo ?? null,
      class_name: s.className,
      section: s.section ?? null,
      roll_number: s.rollNumber ?? null,
      academic_year: s.academicYear,
      session_name: s.sessionName ?? null,
      status: s.status,
      enrolled_at: s.enrolledAt.toISOString(),
      username: user.username ?? null,
      email: user.email ?? null,
      present_village: a?.presentVillage ?? null,
      present_post: a?.presentPost ?? null,
      present_upazilla: a?.presentUpazilla ?? null,
      present_zilla: a?.presentZilla ?? null,
      guardian_name: a?.guardianName ?? null,
      guardian_mobile: a?.guardianMobileNo ?? null,
      guardian_relation: a?.guardianRelation ?? null,
      father_name: a?.fatherNameEn ?? null,
      father_mobile: a?.fatherMobileNo ?? null,
      mother_name: a?.motherNameEn ?? null,
      mother_mobile: a?.motherMobileNo ?? null,
    },
    summary: {
      due_balance: dueBalance,
      paid_this_year: paidThisYear,
      next_due: nextDue
        ? {
            id: nextDue.id,
            description:
              nextDue.feeConfig.name + (nextDue.month ? ` — ${nextDue.month}` : ""),
            amount: Number(nextDue.amount) + Number(nextDue.lateFee),
            due_date: nextDue.dueDate.toISOString().split("T")[0],
          }
        : null,
    },
    recent_receipts: recentReceipts,
  });
}
