import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const config = await db.smsConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

  // Never expose the API key in the response
  const { apiKey: _, ...safe } = config;
  return NextResponse.json({ config: { ...safe, has_api_key: !!config.apiKey } });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if ((session.user as any)?.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.api_key    !== undefined) data.apiKey    = body.api_key    ? String(body.api_key)    : null;
  if (body.sender_id  !== undefined) data.senderId  = body.sender_id  ? String(body.sender_id)  : null;
  if (body.application_received  !== undefined) data.applicationReceived  = Boolean(body.application_received);
  if (body.payment_status        !== undefined) data.paymentStatus        = Boolean(body.payment_status);
  if (body.test_day_reminder     !== undefined) data.testDayReminder      = Boolean(body.test_day_reminder);
  if (body.result_real_time      !== undefined) data.resultRealTime       = Boolean(body.result_real_time);
  if (body.result_six_hour_before !== undefined) data.resultSixHourBefore = Boolean(body.result_six_hour_before);
  if (body.result_at_time        !== undefined) data.resultAtTime         = Boolean(body.result_at_time);
  if (body.result_six_hour_after !== undefined) data.resultSixHourAfter   = Boolean(body.result_six_hour_after);

  await db.smsConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  return NextResponse.json({ message: "SMS config updated" });
}
