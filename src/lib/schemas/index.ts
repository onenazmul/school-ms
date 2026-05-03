// lib/schemas/index.ts
import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

// Staff login (admin + teacher) — email + password
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Student login — username + password (separate portal)
export const studentLoginSchema = z.object({
  username: z.string().min(3, "Enter your student username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;

// ─── Admission (legacy edit form) ────────────────────────────────────────────
// Used by the edit-application page — keep in sync with old API fields.

export const admissionSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  class_name: z.string().min(1, "Please select a class"),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Date of birth is required"),
  stay_type: z.enum(["Home", "Hostel"]),
  village_moholla: z.string().min(1, "Village/Moholla is required"),
  ward: z.string().min(1, "Ward is required"),
  union_pourosova: z.string().min(1, "Union/Pouroshova is required"),
  upozilla: z.string().min(1, "Upozilla is required"),
  father_name: z.string().min(2, "Father's name is required"),
  mother_name: z.string().min(2, "Mother's name is required"),
  guardian_name: z.string().min(2, "Guardian name is required"),
  guardian_phone: z.string().min(10, "Enter a valid phone number"),
  guardian_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  guardian_occupation: z.string().optional(),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;

// ─── Admission Apply (new full form) ─────────────────────────────────────────
// Used by the public /apply page — expanded fields for the updated API.

export const admissionApplySchema = z.object({
  // Student info
  name_en:              z.string().min(2, "Full name in English is required"),
  name_bn:              z.string(),
  name_ar:              z.string(),
  dob:                  z.string().min(1, "Date of birth is required"),
  birth_certificate_no: z.string(),
  gender:               z.enum(["Male", "Female", "Other"]),
  height:               z.string(),
  weight:               z.string(),
  age:                  z.string(),
  nationality:          z.string(),
  blood_group:          z.string(),
  identify_sign:        z.string(),

  // Present address
  present_village:   z.string().min(1, "Village is required"),
  present_post:      z.string(),
  present_upazilla:  z.string().min(1, "Upazilla is required"),
  present_post_code: z.string(),
  present_zilla:     z.string().min(1, "Zilla is required"),

  // Permanent address
  permanent_village:   z.string(),
  permanent_post:      z.string(),
  permanent_upazilla:  z.string(),
  permanent_zilla:     z.string(),
  permanent_post_code: z.string(),

  // Father
  father_name_en:        z.string(),
  father_name_bn:        z.string(),
  father_education:      z.string(),
  father_occupation:     z.string(),
  father_monthly_earning: z.string(),
  father_mobile_no:      z.string(),
  father_nid_no:         z.string(),
  father_dob:            z.string(),

  // Mother
  mother_name_en:         z.string(),
  mother_name_bn:         z.string(),
  mother_education:       z.string(),
  mother_occupation:      z.string(),
  mother_monthly_earning: z.string(),
  mother_mobile_no:       z.string(),
  mother_nid_no:          z.string(),
  mother_dob:             z.string(),

  // Guardian
  guardian_name:              z.string().min(2, "Guardian name is required"),
  guardian_student_relation:  z.string(),
  guardian_present_address:   z.string(),
  guardian_permanent_address: z.string(),
  guardian_education:         z.string(),
  guardian_occupation:        z.string(),
  guardian_monthly_earning:   z.string(),
  guardian_mobile_no:         z.string().min(10, "Guardian mobile is required"),
  guardian_nid_no:            z.string(),
  guardian_dob:               z.string(),

  // Academic
  class_name:             z.string().min(1, "Please select a class"),
  session_name:           z.string(),
  division:               z.string(),
  previous_institute_name: z.string(),
  sibling_details:        z.string(),

  // Login
  password:         z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export type AdmissionApplyInput = z.infer<typeof admissionApplySchema>;

// Admission login (separate from staff login)
export const admissionLoginSchema = z.object({
  username: z.string().min(3, "Enter your username"),
  password: z.string().min(1, "Password is required"),
});

// ─── Finance ─────────────────────────────────────────────────────────────────

export const feeConfigSchema = z.object({
  name: z.string().min(2, "Fee name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
  applicableClasses: z.array(z.string()).min(1, "Select at least one class"),
  dueDay: z.coerce.number().min(1).max(31).optional(),
  lateFee: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
});
export type FeeConfigInput = z.infer<typeof feeConfigSchema>;

export const bulkBillingSchema = z.object({
  feeConfigId: z.string().min(1, "Select a fee type"),
  classes: z.array(z.string()).min(1, "Select at least one class"),
  month: z.string().min(1, "Select a month"),
  year: z.coerce.number(),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
});
export type BulkBillingInput = z.infer<typeof bulkBillingSchema>;

export const receiptSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  billIds: z.array(z.string()).min(1, "Select at least one bill"),
  paymentMethod: z.enum(["cash", "bank_transfer", "cheque", "online"]),
  receivedAmount: z.coerce.number().positive("Enter received amount"),
  paymentDate: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
});
export type ReceiptInput = z.infer<typeof receiptSchema>;
