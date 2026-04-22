"use server";
// lib/actions/admission.ts
// Server action for admission form submission.
// Runs server-side → no CORS, no CSRF token required.

import type { AdmissionInput } from "@/lib/schemas";

const API_BASE = process.env.API_URL ?? "https://sms-api.chalanbeel.com";
const TENANT   = process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? "school1.com";

export type AdmissionRecord = {
  id: number;
  name: string;
  class_name: string;
  gender: string;
  dob: string;
  stay_type: string;
  father_name: string;
  mother_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  guardian_occupation: string | null;
  upozilla: string;
  union_pourosova: string;
  ward: string;
  village_moholla: string;
  username: string;
  password_text: string;
  application_fee: string;
  payment_tracking_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SubmitResult =
  | { success: true; admission: AdmissionRecord; token: string }
  | { success: false; message: string };

export async function submitAdmission(values: AdmissionInput): Promise<SubmitResult> {
  const params = new URLSearchParams({
    name:                   values.name,
    class_name:             values.class_name,
    gender:                 values.gender,
    dob:                    values.dob,
    stay_type:              values.stay_type,
    father_name:            values.father_name,
    mother_name:            values.mother_name,
    guardian_name:          values.guardian_name,
    guardian_phone:         values.guardian_phone,
    upozilla:               values.upozilla,
    union_pourosova:        values.union_pourosova,
    ward:                   values.ward,
    village_moholla:        values.village_moholla,
    student_photo_path:     "n/a",
    birth_certificate_path: "n/a",
    // status:                 "Active",
    application_fee:        "100",
    // payment_tracking_id:    "4",
  });

  if (values.guardian_email)      params.set("guardian_email",      values.guardian_email);
  if (values.guardian_occupation) params.set("guardian_occupation",  values.guardian_occupation);

  let res: Response;
  let data: any;

  try {
    res = await fetch(`${API_BASE}/api/admission?${params.toString()}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Tenant-Domain": TENANT,
      },
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

  // API returns { admission: {...}, token: "..." }
  // Normalise: some responses wrap under "admission", some return the record directly
  const record: AdmissionRecord | undefined =
    data?.admission?.id !== undefined
      ? data.admission            // { admission: { id, ... }, token }
      : data?.id !== undefined
      ? data                      // { id, username, ..., token }
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
