import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: { billIds?: string[]; messageTemplate?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { billIds, messageTemplate } = body;
  if (!billIds?.length)
    return NextResponse.json({ message: "billIds are required" }, { status: 422 });

  const config = await db.smsConfig.findUnique({ where: { id: 1 } });
  if (!config?.apiKey || !config.senderId)
    return NextResponse.json({ message: "SMS not configured. Set API key and sender ID in Settings → SMS." }, { status: 400 });

  // Load school name for message
  const school = await db.schoolSetting.findUnique({ where: { id: 1 }, select: { name: true } });
  const schoolName = school?.name ?? "School";

  // Fetch bills with student info
  const bills = await db.bill.findMany({
    where: { id: { in: billIds } },
    include: {
      feeConfig: { select: { name: true } },
      student: {
        select: {
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
    },
  });

  // Group by student, pick one phone per student
  const byStudent = new Map<
    string,
    { name: string; phone: string; fees: { name: string; total: number; dueDate: string }[] }
  >();

  for (const bill of bills) {
    const phone =
      bill.student.admission?.fatherMobileNo ||
      bill.student.admission?.guardianMobileNo ||
      bill.student.admission?.motherMobileNo;
    if (!phone) continue;

    const studentName = bill.student.admission?.nameEn ?? "Student";
    const sid = bill.studentId;
    if (!byStudent.has(sid)) {
      byStudent.set(sid, { name: studentName, phone, fees: [] });
    }
    byStudent.get(sid)!.fees.push({
      name: bill.feeConfig.name,
      total: Number(bill.amount) + Number(bill.lateFee),
      dueDate: bill.dueDate.toISOString().split("T")[0],
    });
  }

  const skipped = bills.filter((b) => {
    const phone =
      b.student.admission?.fatherMobileNo ||
      b.student.admission?.guardianMobileNo ||
      b.student.admission?.motherMobileNo;
    return !phone;
  }).length;

  let sent = 0;
  let failed = 0;
  const details: { studentName: string; phone: string; status: "sent" | "failed"; error?: string }[] = [];

  for (const [, { name, phone, fees }] of byStudent) {
    const totalAmount = fees.reduce((s, f) => s + f.total, 0);
    const feeNames = fees.map((f) => f.name).join(", ");
    const earliestDue = fees.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate;

    const message =
      messageTemplate
        ?.replace("{student_name}", name)
        .replace("{fee_names}", feeNames)
        .replace("{amount}", totalAmount.toLocaleString())
        .replace("{due_date}", earliestDue)
        .replace("{school_name}", schoolName) ??
      `Dear Parent, ${name}'s ${feeNames} fee of BDT ${totalAmount.toLocaleString()} is due by ${earliestDue}. Please pay promptly. -${schoolName}`;

    try {
      const params = new URLSearchParams({
        api_key: config.apiKey!,
        type: "text",
        contacts: phone,
        senderid: config.senderId!,
        msg: message,
      });
      const res = await fetch(`https://bdbulksms.com/api.php?${params.toString()}`);
      const text = await res.text();
      const ok = res.ok && !text.toLowerCase().includes("error");

      await db.smsLog.create({
        data: {
          id: createId(),
          phone,
          type: "fee_reminder",
          message,
          status: ok ? "sent" : "failed",
          error: ok ? null : text.slice(0, 200),
        },
      });

      if (ok) { sent++; details.push({ studentName: name, phone, status: "sent" }); }
      else { failed++; details.push({ studentName: name, phone, status: "failed", error: text.slice(0, 100) }); }
    } catch (e: unknown) {
      failed++;
      details.push({ studentName: name, phone, status: "failed", error: e instanceof Error ? e.message : "Network error" });
    }
  }

  return NextResponse.json({ sent, failed, skipped, details });
}
