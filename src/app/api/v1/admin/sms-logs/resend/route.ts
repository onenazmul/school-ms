import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { sendSms, type SmsType } from "@/lib/sms";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: { log_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!body.log_id)
    return NextResponse.json({ message: "log_id required" }, { status: 422 });

  const log = await db.smsLog.findUnique({ where: { id: body.log_id } });
  if (!log) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await sendSms({
    admissionId: log.admissionId ?? undefined,
    phone: log.phone,
    type: log.type as SmsType,
    message: log.message,
  });

  return NextResponse.json({ message: "SMS resent" });
}
