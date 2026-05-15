import { db } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";

const API_URL = "https://bdbulksms.com/api.php";

interface SendResult {
  ok: boolean;
  error?: string;
}

async function sendRaw(apiKey: string, senderId: string, phone: string, message: string): Promise<SendResult> {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      type: "text",
      contacts: phone,
      senderid: senderId,
      msg: message,
    });
    const res = await fetch(`${API_URL}?${params.toString()}`, { method: "GET" });
    const text = await res.text();
    // bdbulksms returns "1001" or similar success codes; anything else is an error
    const ok = res.ok && !text.toLowerCase().includes("error");
    return ok ? { ok: true } : { ok: false, error: text.slice(0, 200) };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export type SmsType = "application_received" | "payment_status" | "test_day" | "result";

interface SendSmsOptions {
  admissionId?: number;
  phone: string;
  type: SmsType;
  message: string;
}

export async function sendSms(opts: SendSmsOptions): Promise<void> {
  const config = await db.smsConfig.findUnique({ where: { id: 1 } });
  if (!config?.apiKey || !config.senderId) return;

  // Check the toggle for this SMS type
  const enabled =
    (opts.type === "application_received" && config.applicationReceived) ||
    (opts.type === "payment_status"        && config.paymentStatus) ||
    (opts.type === "test_day"              && config.testDayReminder) ||
    (opts.type === "result"                && (config.resultRealTime || config.resultAtTime));

  if (!enabled) return;

  const result = await sendRaw(config.apiKey, config.senderId, opts.phone, opts.message);

  await db.smsLog.create({
    data: {
      id: createId(),
      admissionId: opts.admissionId ?? null,
      phone: opts.phone,
      type: opts.type,
      message: opts.message,
      status: result.ok ? "sent" : "failed",
      error: result.error ?? null,
    },
  });
}

/** For cron jobs — sends to multiple applicants, skips config toggle check per-call.
 *  Caller is responsible for checking the right toggle before calling this. */
export async function sendSmsDirect(
  apiKey: string,
  senderId: string,
  opts: SendSmsOptions,
): Promise<void> {
  const result = await sendRaw(apiKey, senderId, opts.phone, opts.message);
  await db.smsLog.create({
    data: {
      id: createId(),
      admissionId: opts.admissionId ?? null,
      phone: opts.phone,
      type: opts.type,
      message: opts.message,
      status: result.ok ? "sent" : "failed",
      error: result.error ?? null,
    },
  });
}
