import type { AdmissionEditInput } from "@/lib/schemas";

function nn(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function nd(v: unknown): Date | null {
  const s = nn(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Convert snake_case AdmissionEditInput to Prisma update data (camelCase). */
export function mapAdmissionInput(d: AdmissionEditInput) {
  return {
    nameEn: d.name_en,
    nameBn: nn(d.name_bn),
    nameAr: nn(d.name_ar),
    dob: nd(d.dob),
    birthCertificateNo: nn(d.birth_certificate_no),
    gender: d.gender,
    height: nn(d.height),
    weight: nn(d.weight),
    nationality: nn(d.nationality),
    bloodGroup: nn(d.blood_group),
    identifySign: nn(d.identify_sign),

    presentVillage: nn(d.present_village),
    presentPost: nn(d.present_post),
    presentUpazilla: nn(d.present_upazilla),
    presentPostCode: nn(d.present_post_code),
    presentZilla: nn(d.present_zilla),

    permanentVillage: nn(d.permanent_village),
    permanentPost: nn(d.permanent_post),
    permanentUpazilla: nn(d.permanent_upazilla),
    permanentZilla: nn(d.permanent_zilla),
    permanentPostCode: nn(d.permanent_post_code),

    fatherNameEn: nn(d.father_name_en),
    fatherNameBn: nn(d.father_name_bn),
    fatherEducation: nn(d.father_education),
    fatherOccupation: nn(d.father_occupation),
    fatherMonthlyEarning: nn(d.father_monthly_earning),
    fatherMobileNo: nn(d.father_mobile_no),
    fatherNidNo: nn(d.father_nid_no),
    fatherDob: nd(d.father_dob),

    motherNameEn: nn(d.mother_name_en),
    motherNameBn: nn(d.mother_name_bn),
    motherEducation: nn(d.mother_education),
    motherOccupation: nn(d.mother_occupation),
    motherMonthlyEarning: nn(d.mother_monthly_earning),
    motherMobileNo: nn(d.mother_mobile_no),
    motherNidNo: nn(d.mother_nid_no),
    motherDob: nd(d.mother_dob),

    guardianName: nn(d.guardian_name),
    guardianRelation: nn(d.guardian_student_relation),
    guardianPresentAddress: nn(d.guardian_present_address),
    guardianPermanentAddress: nn(d.guardian_permanent_address),
    guardianEducation: nn(d.guardian_education),
    guardianOccupation: nn(d.guardian_occupation),
    guardianMonthlyEarning: nn(d.guardian_monthly_earning),
    guardianMobileNo: nn(d.guardian_mobile_no),
    guardianNidNo: nn(d.guardian_nid_no),
    guardianDob: nd(d.guardian_dob),

    className: d.class_name,
    sessionName: nn(d.session_name),
    division: nn(d.division),
    previousInstituteName: nn(d.previous_institute_name),
    siblingDetails: nn(d.sibling_details),
  };
}
