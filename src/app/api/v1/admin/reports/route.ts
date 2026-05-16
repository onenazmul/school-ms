import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const startOfYear = new Date(year, 0, 1);
  const endOfYear   = new Date(year + 1, 0, 1);
  const now         = new Date();

  // YTD stats
  const [ytdRevenue, totalStudents, outstandingAgg, totalBills, paidBills] = await Promise.all([
    db.receipt.aggregate({ _sum: { receivedAmount: true }, where: { createdAt: { gte: startOfYear, lt: endOfYear } } }),
    db.student.count({ where: { status: "Active" } }),
    db.bill.aggregate({ _sum: { amount: true, lateFee: true }, where: { status: { in: ["unpaid", "partial"] } } }),
    db.bill.count({ where: { createdAt: { gte: startOfYear, lt: endOfYear } } }),
    db.bill.count({ where: { status: "paid", updatedAt: { gte: startOfYear, lt: endOfYear } } }),
  ]);

  const collectionRate = totalBills > 0 ? Math.round((paidBills / totalBills) * 100) : 0;
  const outstanding = Number(outstandingAgg._sum.amount ?? 0) + Number(outstandingAgg._sum.lateFee ?? 0);

  // Monthly revenue (receipts by month)
  const monthlyRevenue = Array(12).fill(0);
  const monthlyCollectionNumerator   = Array(12).fill(0);
  const monthlyCollectionDenominator = Array(12).fill(0);

  const [monthlyReceiptsRaw, monthlyBillsPaidRaw, monthlyBillsTotalRaw] = await Promise.all([
    db.receipt.findMany({
      where: { createdAt: { gte: startOfYear, lt: endOfYear } },
      select: { receivedAmount: true, createdAt: true },
    }),
    db.bill.findMany({
      where: { status: "paid", updatedAt: { gte: startOfYear, lt: endOfYear } },
      select: { updatedAt: true },
    }),
    db.bill.findMany({
      where: { createdAt: { gte: startOfYear, lt: endOfYear } },
      select: { createdAt: true },
    }),
  ]);

  for (const r of monthlyReceiptsRaw) {
    const m = r.createdAt.getMonth();
    monthlyRevenue[m] += Number(r.receivedAmount);
  }
  for (const b of monthlyBillsPaidRaw) {
    const m = b.updatedAt.getMonth();
    monthlyCollectionNumerator[m]++;
  }
  for (const b of monthlyBillsTotalRaw) {
    const m = b.createdAt.getMonth();
    monthlyCollectionDenominator[m]++;
  }

  const monthlyRate = monthlyCollectionDenominator.map((denom, i) =>
    denom > 0 ? Math.round((monthlyCollectionNumerator[i] / denom) * 100) : 0,
  );

  // Zero out future months
  const currentMonth = year === now.getFullYear() ? now.getMonth() : 11;
  for (let i = currentMonth + 1; i < 12; i++) {
    monthlyRevenue[i] = 0;
    monthlyRate[i] = 0;
  }

  // Class-wise summary
  const classes = await db.schoolClass.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const classSummary = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount, classBills, classPaid, classOutstanding] = await Promise.all([
        db.student.count({ where: { className: cls.name, status: "Active" } }),
        db.bill.count({ where: { student: { className: cls.name }, academicYear: String(year) } }),
        db.bill.count({ where: { student: { className: cls.name }, status: "paid", academicYear: String(year) } }),
        db.bill.aggregate({
          _sum: { amount: true, lateFee: true },
          where: { student: { className: cls.name }, status: { in: ["unpaid", "partial"] } },
        }),
      ]);
      return {
        class: cls.name,
        students: studentCount,
        collection_rate: classBills > 0 ? Math.round((classPaid / classBills) * 100) : 0,
        outstanding: Number(classOutstanding._sum.amount ?? 0) + Number(classOutstanding._sum.lateFee ?? 0),
      };
    }),
  );

  return NextResponse.json({
    kpis: {
      ytd_revenue: Number(ytdRevenue._sum.receivedAmount ?? 0),
      total_students: totalStudents,
      outstanding_dues: outstanding,
      collection_rate: collectionRate,
    },
    monthly_revenue: monthlyRevenue,
    monthly_collection_rate: monthlyRate,
    class_summary: classSummary,
  });
}
