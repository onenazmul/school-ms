import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const className = searchParams.get("className");
  const feeConfigId = searchParams.get("feeConfigId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const search = searchParams.get("search")?.trim();
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (status && status !== "all") {
    if (status === "overdue") {
      where.status = { in: ["unpaid", "partial"] };
      where.dueDate = { lt: new Date() };
    } else {
      where.status = status;
    }
  }
  if (className && className !== "all") where.student = { className };
  if (feeConfigId && feeConfigId !== "all") where.feeConfigId = feeConfigId;
  if (month && month !== "all") where.month = month;
  if (year && year !== "all") where.academicYear = year;

  const bills = await db.bill.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          className: true,
          section: true,
          rollNumber: true,
          admission: {
            select: {
              nameEn: true,
              fatherMobileNo: true,
              guardianMobileNo: true,
              motherMobileNo: true,
            },
          },
        },
      },
      feeConfig: { select: { id: true, name: true, type: true } },
    },
    orderBy: [{ dueDate: "asc" }, { student: { className: "asc" } }],
    take: 500,
  });

  const now = new Date();

  const result = bills
    .filter((b) => {
      if (!search) return true;
      const name = b.student.admission?.nameEn?.toLowerCase() ?? "";
      return name.includes(search.toLowerCase());
    })
    .map((b) => {
      const phone =
        b.student.admission?.fatherMobileNo ||
        b.student.admission?.guardianMobileNo ||
        b.student.admission?.motherMobileNo ||
        null;
      const isOverdue =
        (b.status === "unpaid" || b.status === "partial") && b.dueDate < now;

      return {
        id: b.id,
        student_id: b.student.id,
        student_name: b.student.admission?.nameEn ?? "Unknown",
        class: b.student.className,
        section: b.student.section ?? null,
        roll: b.student.rollNumber ?? null,
        fee_config_id: b.feeConfig.id,
        fee_name: b.feeConfig.name,
        fee_type: b.feeConfig.type,
        month: b.month ?? null,
        academic_year: b.academicYear,
        amount: Number(b.amount),
        late_fee: Number(b.lateFee),
        total: Number(b.amount) + Number(b.lateFee),
        due_date: b.dueDate.toISOString().split("T")[0],
        status: isOverdue ? "overdue" : b.status,
        db_status: b.status,
        phone,
        created_at: b.createdAt.toISOString(),
      };
    });

  return NextResponse.json({ bills: result });
}
