"use server";
// lib/actions/admission.ts

const API_BASE = process.env.API_URL ?? "https://sms-api.chalanbeel.com";
const TENANT   = process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? "school1.com";

export type AdmissionRecord = {
  id: number;
  // new API fields
  name_en?: string;
  // legacy field – some API versions return this
  name?: string;
  class_name: string;
  gender: string;
  dob: string;
  guardian_name?: string;
  guardian_mobile_no?: string;
  // legacy
  guardian_phone?: string;
  username: string;
  password_text?: string;
  application_fee?: string;
  payment_tracking_id?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type SubmitResult =
  | { success: true; admission: AdmissionRecord; token: string }
  | { success: false; message: string };

export async function submitAdmission(formData: FormData): Promise<SubmitResult> {
  formData.delete("confirm_password");
  if (!formData.get("application_fee")) formData.set("application_fee", "100");

  let res: Response;
  let data: any;

  try {
    res = await fetch(`${API_BASE}/api/admission`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Tenant-Domain": TENANT,
      },
      body: formData,
      cache: "no-store",
    });
  } catch (err) {
    console.error("[submitAdmission] Network error:", err);
    return { success: false, message: "Could not connect to server. Please try again." };
  }

  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    console.error("[submitAdmission] Non-JSON response:", res.status, text.slice(0, 300));
    return {
      success: false,
      message: `Server returned an unexpected response (HTTP ${res.status}). Please try again.`,
    };
  }

  if (!res.ok) {
    return { success: false, message: data?.message ?? `Request failed (HTTP ${res.status}).` };
  }

  const record: AdmissionRecord | undefined =
    data?.admission?.id !== undefined
      ? data.admission
      : data?.id !== undefined
      ? data
      : undefined;

  const token: string | undefined = data?.token ?? data?.admission?.token;

  if (!record || !token) {
    console.error("[submitAdmission] Unexpected response shape:", JSON.stringify(data).slice(0, 400));
    return {
      success: false,
      message: "Application may have been submitted, but the server response was unexpected. Please contact the school.",
    };
  }

  return { success: true, admission: record, token };
}
