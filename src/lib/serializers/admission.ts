import type { Admission } from "@prisma/client";

/** Serialize a Prisma Admission to the snake_case shape clients expect. */
export function serializeAdmission(a: Admission) {
  return {
    id: a.id,
    name_en: a.nameEn,
    name_bn: a.nameBn,
    name_ar: a.nameAr,
    dob: a.dob ? a.dob.toISOString().split("T")[0] : null,
    birth_certificate_no: a.birthCertificateNo,
    gender: a.gender,
    height: a.height,
    weight: a.weight,
    nationality: a.nationality,
    blood_group: a.bloodGroup,
    identify_sign: a.identifySign,

    present_village: a.presentVillage,
    present_post: a.presentPost,
    present_upazilla: a.presentUpazilla,
    present_post_code: a.presentPostCode,
    present_zilla: a.presentZilla,

    permanent_village: a.permanentVillage,
    permanent_post: a.permanentPost,
    permanent_upazilla: a.permanentUpazilla,
    permanent_zilla: a.permanentZilla,
    permanent_post_code: a.permanentPostCode,

    father_name_en: a.fatherNameEn,
    father_name_bn: a.fatherNameBn,
    father_education: a.fatherEducation,
    father_occupation: a.fatherOccupation,
    father_monthly_earning: a.fatherMonthlyEarning,
    father_mobile_no: a.fatherMobileNo,
    father_nid_no: a.fatherNidNo,
    father_dob: a.fatherDob ? a.fatherDob.toISOString().split("T")[0] : null,

    mother_name_en: a.motherNameEn,
    mother_name_bn: a.motherNameBn,
    mother_education: a.motherEducation,
    mother_occupation: a.motherOccupation,
    mother_monthly_earning: a.motherMonthlyEarning,
    mother_mobile_no: a.motherMobileNo,
    mother_nid_no: a.motherNidNo,
    mother_dob: a.motherDob ? a.motherDob.toISOString().split("T")[0] : null,

    guardian_name: a.guardianName,
    guardian_student_relation: a.guardianRelation,
    guardian_present_address: a.guardianPresentAddress,
    guardian_permanent_address: a.guardianPermanentAddress,
    guardian_education: a.guardianEducation,
    guardian_occupation: a.guardianOccupation,
    guardian_monthly_earning: a.guardianMonthlyEarning,
    guardian_mobile_no: a.guardianMobileNo,
    guardian_nid_no: a.guardianNidNo,
    guardian_dob: a.guardianDob ? a.guardianDob.toISOString().split("T")[0] : null,

    class_name: a.className,
    section: a.section,
    session_name: a.sessionName,
    division: a.division,
    previous_institute_name: a.previousInstituteName,
    sibling_details: a.siblingDetails,

    status: a.status,
    payment_status: a.paymentStatus,
    application_fee: a.applicationFee.toString(),
    payment_tracking_id: a.paymentTrackingId,
    enrollment_payment_status: a.enrollmentPaymentStatus,
    enrollment_payment_tracking_id: a.enrollmentPaymentTrackingId,

    student_photo: a.studentPhoto,
    student_signature: a.studentSignature,

    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  };
}

export type SerializedAdmission = ReturnType<typeof serializeAdmission>;
