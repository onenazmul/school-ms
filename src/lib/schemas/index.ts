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

// ─── Admission ───────────────────────────────────────────────────────────────
// Fields match the Laravel API: POST /api/admission

export const admissionSchema = z.object({
  // Step 1 – Student details
  name: z.string().min(2, "Full name is required"),
  class_name: z.string().min(1, "Please select a class"),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Date of birth is required"),
  stay_type: z.enum(["Home", "Hostel"]),

  // Step 2 – Address
  village_moholla: z.string().min(1, "Village/Moholla is required"),
  ward: z.string().min(1, "Ward is required"),
  union_pourosova: z.string().min(1, "Union/Pouroshova is required"),
  upozilla: z.string().min(1, "Upozilla is required"),

  // Step 3 – Family / Guardian
  father_name: z.string().min(2, "Father's name is required"),
  mother_name: z.string().min(2, "Mother's name is required"),
  guardian_name: z.string().min(2, "Guardian name is required"),
  guardian_phone: z.string().min(10, "Enter a valid phone number"),
  guardian_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  guardian_occupation: z.string().optional(),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;

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
