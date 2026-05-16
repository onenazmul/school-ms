import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 0, 1);

  const [
    totalStudents, newStudentsThisMonth,
    totalTeachers,
    pendingAdmissions,
    monthlyRevenue, ytdRevenue,
    outstanding, overdueCount,
    pendingVerifications,
    recentActivity,
  ] = await Promise.all([
    db.student.count({ where: { status: "Active" } }),
    db.student.count({ where: { enrolledAt: { gte: startOfMonth } } }),
    db.teacher.count({ where: { status: "active" } }),
    db.admission.count({ where: { status: { in: ["pending", "under_review"] } } }),
    db.receipt.aggregate({ _sum: { receivedAmount: true }, where: { createdAt: { gte: startOfMonth } } }),
    db.receipt.aggregate({ _sum: { receivedAmount: true }, where: { createdAt: { gte: startOfYear } } }),
    db.bill.aggregate({ _sum: { amount: true, lateFee: true }, where: { status: { in: ["unpaid", "partial"] } } }),
    db.bill.count({ where: { status: { in: ["unpaid", "partial"] }, dueDate: { lt: now } } }),
    db.paymentSubmission.count({ where: { status: "pending" } }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, module: true, action: true, description: true, actorName: true, createdAt: true },
    }),
  ]);

  // Collection rate: paid bills / (paid + unpaid) bills this month
  const [paidThisMonth, totalBillsThisMonth] = await Promise.all([
    db.bill.count({ where: { status: "paid", updatedAt: { gte: startOfMonth } } }),
    db.bill.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);
  const collectionRate = totalBillsThisMonth > 0
    ? Math.round((paidThisMonth / totalBillsThisMonth) * 100)
    : 0;

  return NextResponse.json({
    stats: {
      total_students: totalStudents,
      new_students_this_month: newStudentsThisMonth,
      total_teachers: totalTeachers,
      pending_admissions: pendingAdmissions,
      monthly_revenue: Number(monthlyRevenue._sum.receivedAmount ?? 0),
      ytd_revenue: Number(ytdRevenue._sum.receivedAmount ?? 0),
      outstanding_dues: Number(outstanding._sum.amount ?? 0) + Number(outstanding._sum.lateFee ?? 0),
      overdue_count: overdueCount,
      pending_verifications: pendingVerifications,
      collection_rate: collectionRate,
    },
    recent_activity: recentActivity.map((a) => ({
      id: a.id,
      module: a.module,
      action: a.action,
      description: a.description,
      actor_name: a.actorName,
      created_at: a.createdAt.toISOString(),
    })),
  });
}
