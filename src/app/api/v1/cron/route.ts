import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSmsDirect } from "@/lib/sms";

const VALID_TYPES = ["test_day_reminder", "result_6h_before", "result_at_time", "result_6h_after"] as const;
type CronType = (typeof VALID_TYPES)[number];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const type   = searchParams.get("type") as CronType | null;

  if (!secret || secret !== process.env.CRON_SECRET)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (!type || !VALID_TYPES.includes(type))
    return NextResponse.json({ message: "Invalid type" }, { status: 422 });

  const config = await db.smsConfig.findUnique({ where: { id: 1 } });
  if (!config?.apiKey || !config.senderId)
    return NextResponse.json({ sent: 0, reason: "SMS not configured" });

  const now = new Date();
  let sent = 0;

  if (type === "test_day_reminder" && config.testDayReminder) {
    // Find admissions whose class test day is tomorrow (within 20–28 h window)
    const lo = new Date(now.getTime() + 20 * 3600_000);
    const hi = new Date(now.getTime() + 28 * 3600_000);

    const activeConfig = await db.admissionConfig.findFirst({
      where: { isActive: true },
      include: { classConfigs: true },
    });
    if (!activeConfig) return NextResponse.json({ sent, reason: "No active config" });

    const admissions = await db.admission.findMany({
      where: {
        status: "Awaiting Test",
        admissionConfigId: activeConfig.id,
      },
      select: { id: true, nameEn: true, className: true, guardianMobileNo: true, fatherMobileNo: true },
    });

    for (const adm of admissions) {
      const classOverride = activeConfig.classConfigs.find((c) => c.className === adm.className);
      const testDay = classOverride?.testDay ?? activeConfig.globalTestDay;
      if (!testDay || testDay < lo || testDay > hi) continue;

      const phone = adm.guardianMobileNo ?? adm.fatherMobileNo;
      if (!phone) continue;

      const testDt = testDay.toLocaleDateString("en-BD", { dateStyle: "medium" });
      const testTm = testDay.toLocaleTimeString("en-BD", { timeStyle: "short" });
      await sendSmsDirect(config.apiKey!, config.senderId!, {
        admissionId: adm.id,
        phone,
        type: "test_day",
        message: `Dear Guardian, reminder: admission test for ${adm.nameEn} (${adm.className}) is on ${testDt} at ${testTm}. Please arrive on time.`,
      });
      sent++;
    }
  }

  if (type === "result_6h_before" && config.resultSixHourBefore) {
    sent += await sendResultSms(config.apiKey!, config.senderId!, now, -6, "result");
  }
  if (type === "result_at_time" && config.resultAtTime) {
    sent += await sendResultSms(config.apiKey!, config.senderId!, now, 0, "result");
  }
  if (type === "result_6h_after" && config.resultSixHourAfter) {
    sent += await sendResultSms(config.apiKey!, config.senderId!, now, 6, "result");
  }

  return NextResponse.json({ sent });
}

async function sendResultSms(
  apiKey: string,
  senderId: string,
  now: Date,
  hourOffset: number,
  type: "result",
): Promise<number> {
  // Find active config whose resultDay falls within a 40-minute window around (now + offset)
  const target = new Date(now.getTime() + hourOffset * 3600_000);
  const lo = new Date(target.getTime() - 20 * 60_000);
  const hi = new Date(target.getTime() + 20 * 60_000);

  const configs = await db.admissionConfig.findMany({
    where: {
      isActive: true,
      resultVisibility: "result_day",
      resultDay: { gte: lo, lte: hi },
    },
  });
  if (configs.length === 0) return 0;

  let sent = 0;
  for (const cfg of configs) {
    const admissions = await db.admission.findMany({
      where: {
        admissionConfigId: cfg.id,
        status: { in: ["Enrolled", "Rejected", "Approved"] },
      },
      select: { id: true, nameEn: true, status: true, guardianMobileNo: true, fatherMobileNo: true },
    });

    for (const adm of admissions) {
      const phone = adm.guardianMobileNo ?? adm.fatherMobileNo;
      if (!phone) continue;

      const outcome =
        adm.status === "Enrolled" || adm.status === "Approved"
          ? "Congratulations! Your child has been selected."
          : "We regret to inform you that your child was not selected this cycle.";

      await sendSmsDirect(apiKey, senderId, {
        admissionId: adm.id,
        phone,
        type,
        message: `Dear Guardian, the admission result for ${adm.nameEn} is now available. ${outcome} Please log in to your panel to see details.`,
      });
      sent++;
    }
  }
  return sent;
}
