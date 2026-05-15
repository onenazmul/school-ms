"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { admissionApplySchema } from "@/lib/schemas";
import { saveImage, deleteUpload } from "@/lib/upload";
import { sendSms } from "@/lib/sms";
import { logActivity } from "@/lib/activity-log";

export type AdmissionRecord = {
  id: number;
  username: string;
  name_en: string;
  class_name: string;
  application_fee: string;
  free_admission: boolean;
  status: string;
  gender: string;
  dob: string;
  guardian_name: string | null;
  guardian_mobile_no: string | null;
};

export type SubmitResult =
  | { success: true; admission: AdmissionRecord; password: string }
  | { success: false; message: string };

function emptyToNull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function emptyToNullDate(v: unknown): Date | null {
  const s = emptyToNull(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function generateUsername(): Promise<string> {
  const year = new Date().getFullYear();
  // Race-safe enough for low concurrency; can switch to sequence table later
  const count = await db.admission.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  return `APP-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function submitAdmission(formData: FormData): Promise<SubmitResult> {
  // Extract files first
  const photoFile = formData.get("student_photo") as File | null;
  const sigFile = formData.get("student_signature") as File | null;
  formData.delete("student_photo");
  formData.delete("student_signature");

  // Client strips confirm_password — schema's refine requires it, so back-fill from password
  if (!formData.get("confirm_password")) {
    formData.set("confirm_password", String(formData.get("password") ?? ""));
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = admissionApplySchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, message: `${first.path.join(".")}: ${first.message}` };
  }
  const d = parsed.data;

  // Upload photos before DB write (rollback below if anything fails)
  let studentPhoto: string | null = null;
  let studentSignature: string | null = null;
  try {
    if (photoFile && photoFile.size > 0) {
      studentPhoto = await saveImage(photoFile, { folder: "photos", maxWidth: 800 });
    }
    if (sigFile && sigFile.size > 0) {
      studentSignature = await saveImage(sigFile, { folder: "signatures", maxWidth: 800 });
    }
  } catch (err: any) {
    if (studentPhoto) await deleteUpload(studentPhoto);
    return { success: false, message: err?.message ?? "Image upload failed" };
  }

  // Resolve fee + deadline from active config
  const activeConfig = await db.admissionConfig.findFirst({
    where: { isActive: true },
    include: { classConfigs: { select: { className: true, fee: true } } },
  });

  if (activeConfig?.applicationEndDate && new Date() > new Date(activeConfig.applicationEndDate)) {
    return { success: false, message: "The application deadline has passed." };
  }

  let applicationFee = 0;
  if (activeConfig) {
    if (activeConfig.feeMode === "per_class") {
      const cc = activeConfig.classConfigs.find((c) => c.className === d.class_name);
      applicationFee = cc?.fee != null
        ? Number(cc.fee)
        : activeConfig.globalFee != null ? Number(activeConfig.globalFee) : 0;
    } else {
      applicationFee = activeConfig.globalFee != null ? Number(activeConfig.globalFee) : 0;
    }
  }

  const isFree = applicationFee === 0;

  const username = await generateUsername();
  const syntheticEmail = `${username.toLowerCase()}@applicant.local`;

  // Create admission record + Better Auth account
  let admissionId: number | null = null;
  try {
    const admission = await db.admission.create({
      data: {
        nameEn: d.name_en,
        nameBn: emptyToNull(d.name_bn),
        nameAr: emptyToNull(d.name_ar),
        dob: emptyToNullDate(d.dob),
        birthCertificateNo: emptyToNull(d.birth_certificate_no),
        gender: d.gender,
        height: emptyToNull(d.height),
        weight: emptyToNull(d.weight),
        nationality: emptyToNull(d.nationality),
        bloodGroup: emptyToNull(d.blood_group),
        identifySign: emptyToNull(d.identify_sign),

        presentVillage: emptyToNull(d.present_village),
        presentPost: emptyToNull(d.present_post),
        presentUpazilla: emptyToNull(d.present_upazilla),
        presentPostCode: emptyToNull(d.present_post_code),
        presentZilla: emptyToNull(d.present_zilla),

        permanentVillage: emptyToNull(d.permanent_village),
        permanentPost: emptyToNull(d.permanent_post),
        permanentUpazilla: emptyToNull(d.permanent_upazilla),
        permanentZilla: emptyToNull(d.permanent_zilla),
        permanentPostCode: emptyToNull(d.permanent_post_code),

        fatherNameEn: emptyToNull(d.father_name_en),
        fatherNameBn: emptyToNull(d.father_name_bn),
        fatherEducation: emptyToNull(d.father_education),
        fatherOccupation: emptyToNull(d.father_occupation),
        fatherMonthlyEarning: emptyToNull(d.father_monthly_earning),
        fatherMobileNo: emptyToNull(d.father_mobile_no),
        fatherNidNo: emptyToNull(d.father_nid_no),
        fatherDob: emptyToNullDate(d.father_dob),

        motherNameEn: emptyToNull(d.mother_name_en),
        motherNameBn: emptyToNull(d.mother_name_bn),
        motherEducation: emptyToNull(d.mother_education),
        motherOccupation: emptyToNull(d.mother_occupation),
        motherMonthlyEarning: emptyToNull(d.mother_monthly_earning),
        motherMobileNo: emptyToNull(d.mother_mobile_no),
        motherNidNo: emptyToNull(d.mother_nid_no),
        motherDob: emptyToNullDate(d.mother_dob),

        guardianName: emptyToNull(d.guardian_name),
        guardianRelation: emptyToNull(d.guardian_student_relation),
        guardianPresentAddress: emptyToNull(d.guardian_present_address),
        guardianPermanentAddress: emptyToNull(d.guardian_permanent_address),
        guardianEducation: emptyToNull(d.guardian_education),
        guardianOccupation: emptyToNull(d.guardian_occupation),
        guardianMonthlyEarning: emptyToNull(d.guardian_monthly_earning),
        guardianMobileNo: emptyToNull(d.guardian_mobile_no),
        guardianNidNo: emptyToNull(d.guardian_nid_no),
        guardianDob: emptyToNullDate(d.guardian_dob),

        className: d.class_name,
        sessionName: emptyToNull(d.session_name),
        division: emptyToNull(d.division),
        previousInstituteName: emptyToNull(d.previous_institute_name),
        siblingDetails: emptyToNull(d.sibling_details),

        studentPhoto,
        studentSignature,

        applicationFee,
        status: isFree ? "Under Review" : "Pending",
        paymentStatus: isFree ? "Paid" : "Unpaid",
        admissionConfigId: activeConfig?.id ?? null,
      },
    });
    admissionId = admission.id;

    // Create Better Auth user
    const signUp = await auth.api.signUpEmail({
      body: {
        email: syntheticEmail,
        password: d.password,
        name: d.name_en,
        username,
      } as any,
    });

    // Set role + link to admission (signUpEmail uses defaults for additionalFields)
    await db.user.update({
      where: { id: signUp.user.id },
      data: { role: "applicant", admissionId: admission.id },
    });

    logActivity({
      module: "admission",
      action: "application_submitted",
      entityType: "Admission",
      entityId: String(admission.id),
      entityLabel: `${username} · ${admission.nameEn}`,
      actorRole: "applicant",
      description: `New admission application submitted by ${admission.nameEn} for class ${admission.className}`,
      metadata: { class: admission.className, username },
    });

    // Send application received SMS (fire-and-forget)
    const phone = admission.guardianMobileNo ?? admission.fatherMobileNo ?? admission.motherMobileNo;
    if (phone) {
      sendSms({
        admissionId: admission.id,
        phone,
        type: "application_received",
        message: `Dear Guardian, application for ${admission.nameEn} (${admission.className}) has been received. Your applicant ID: ${username}. We will notify you about next steps.`,
      }).catch(() => {});
    }

    return {
      success: true,
      admission: {
        id: admission.id,
        username,
        name_en: admission.nameEn,
        class_name: admission.className,
        application_fee: String(applicationFee),
        free_admission: isFree,
        status: admission.status,
        gender: admission.gender,
        dob: admission.dob ? admission.dob.toISOString().split("T")[0] : "",
        guardian_name: admission.guardianName,
        guardian_mobile_no: admission.guardianMobileNo,
      },
      password: d.password,
    };
  } catch (err: any) {
    // Rollback on failure
    if (admissionId) {
      await db.admission.delete({ where: { id: admissionId } }).catch(() => {});
    }
    if (studentPhoto) await deleteUpload(studentPhoto);
    if (studentSignature) await deleteUpload(studentSignature);

    const msg =
      err?.body?.message ??
      err?.message ??
      "Submission failed. Please try again.";
    return { success: false, message: msg };
  }
}
