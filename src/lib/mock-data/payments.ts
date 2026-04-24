// lib/mock-data/payments.ts
// Mock payment data matching the PaymentSubmission and ExamFee data models.
// Field names exactly match the API spec from the task.

export type PaymentContext = "admission" | "exam_fee";

export type PaymentMethod = "bkash" | "rocket" | "bank_transfer";

export type PaymentStatus = "pending" | "under_review" | "verified" | "rejected";

export interface PaymentSubmission {
  id: string;
  paymentContext: PaymentContext;
  applicationId?: string;   // admission context
  examFeeId?: string;       // exam_fee context
  studentId?: string;       // exam_fee context
  method: PaymentMethod;
  transactionId: string;
  phoneNumber: string;
  amountSent: number;
  paymentDate: string;      // ISO date
  notes?: string;
  screenshotUrl?: string;
  // bank_transfer specific
  accountHolderName?: string;
  branch?: string;
  depositSlipNo?: string;
  status: PaymentStatus;
  adminNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;      // ISO datetime
  submittedAt: string;      // ISO datetime
  receiptNumber?: string;
}

export interface ExamFee {
  id: string;
  studentId: string;
  examName: string;
  academicYear: string;
  feeAmount: number;
  dueDate: string;
  status: "unpaid" | "pending" | "verified" | "overdue";
  submissions: PaymentSubmission[];
}

// TODO: Fetch from GET /api/config/payment-accounts when API is ready
export const PAYMENT_ACCOUNT_CONFIG = {
  bkash: {
    number: "01712-345678",
    accountType: "personal" as const,
    instructions:
      "Dial *247# or open bKash app → Send Money → enter the number above → enter the exact amount → use your admission/student ID as reference.",
  },
  rocket: {
    number: "01511-234567",
    instructions:
      "Dial *322# or open Rocket app → Send Money → enter the number above → enter the exact amount → use your admission/student ID as reference.",
  },
  bank: {
    bankName: "Sonali Bank PLC",
    branchName: "Gurudaspur Branch",
    accountName: "Bright Future School",
    accountNumber: "2017110003456",
    routingNumber: "200270546",
    swiftCode: "",
    instructions:
      "Transfer the exact fee amount to the account above. Keep your deposit slip and write your admission/student ID in the reference field.",
  },
} as const;

// ── Mock Payment Submissions ──────────────────────────────────────────────────

export const MOCK_PAYMENT_SUBMISSIONS: PaymentSubmission[] = [
  {
    id: "PS-001",
    paymentContext: "admission",
    applicationId: "STU-2025-001",
    method: "bkash",
    transactionId: "TXN8K7J2X1M9",
    phoneNumber: "01712345678",
    amountSent: 500,
    paymentDate: "2026-01-15",
    notes: "Paid via bKash personal",
    status: "verified",
    verifiedBy: "Admin",
    verifiedAt: "2026-01-16T10:30:00Z",
    submittedAt: "2026-01-15T14:22:00Z",
    receiptNumber: "RCP-2026-0001",
  },
  {
    id: "PS-002",
    paymentContext: "admission",
    applicationId: "STU-2025-002",
    method: "rocket",
    transactionId: "RKT99X2M441",
    phoneNumber: "01898765432",
    amountSent: 500,
    paymentDate: "2026-01-18",
    status: "pending",
    submittedAt: "2026-01-18T09:05:00Z",
  },
  {
    id: "PS-003",
    paymentContext: "admission",
    applicationId: "STU-2025-003",
    method: "bank_transfer",
    transactionId: "SNLB202601234",
    phoneNumber: "01567891234",
    amountSent: 500,
    paymentDate: "2026-01-20",
    notes: "Deposited at Gurudaspur branch",
    status: "rejected",
    adminNote: "Transaction ID not found in our records. Please resubmit with the correct TrxID from your bank slip.",
    submittedAt: "2026-01-20T11:45:00Z",
  },
  {
    id: "PS-004",
    paymentContext: "admission",
    applicationId: "STU-2025-004",
    method: "bkash",
    transactionId: "TXN5P3Q9R0W7",
    phoneNumber: "01623456789",
    amountSent: 500,
    paymentDate: "2026-01-22",
    status: "pending",
    submittedAt: "2026-01-22T16:10:00Z",
  },
  {
    id: "PS-005",
    paymentContext: "admission",
    applicationId: "STU-2025-005",
    method: "bkash",
    transactionId: "TXN2L8H4N6K3",
    phoneNumber: "01745678901",
    amountSent: 500,
    paymentDate: "2026-01-24",
    status: "under_review",
    submittedAt: "2026-01-24T08:55:00Z",
  },
  {
    id: "PS-006",
    paymentContext: "exam_fee",
    examFeeId: "EF-001",
    studentId: "1",
    method: "bkash",
    transactionId: "TXN1A2B3C4D5",
    phoneNumber: "01712345678",
    amountSent: 2500,
    paymentDate: "2025-11-10",
    status: "verified",
    verifiedBy: "Admin",
    verifiedAt: "2025-11-11T09:00:00Z",
    submittedAt: "2025-11-10T15:30:00Z",
    receiptNumber: "RCP-2025-S001",
  },
  {
    id: "PS-007",
    paymentContext: "exam_fee",
    examFeeId: "EF-002",
    studentId: "1",
    method: "rocket",
    transactionId: "RKT77X9Y2Z4",
    phoneNumber: "01712345678",
    amountSent: 2500,
    paymentDate: "2026-04-05",
    status: "pending",
    submittedAt: "2026-04-05T13:00:00Z",
  },
];

// ── Mock Exam Fees ─────────────────────────────────────────────────────────────

export const MOCK_EXAM_FEES: ExamFee[] = [
  {
    id: "EF-001",
    studentId: "1",
    examName: "Half-Yearly Examination 2025",
    academicYear: "2025-26",
    feeAmount: 2500,
    dueDate: "2025-11-15",
    status: "verified",
    submissions: MOCK_PAYMENT_SUBMISSIONS.filter((s) => s.examFeeId === "EF-001"),
  },
  {
    id: "EF-002",
    studentId: "1",
    examName: "Annual Examination 2025–26",
    academicYear: "2025-26",
    feeAmount: 2500,
    dueDate: "2026-05-15",
    status: "pending",
    submissions: MOCK_PAYMENT_SUBMISSIONS.filter((s) => s.examFeeId === "EF-002"),
  },
  {
    id: "EF-003",
    studentId: "2",
    examName: "Annual Examination 2025–26",
    academicYear: "2025-26",
    feeAmount: 2500,
    dueDate: "2026-05-15",
    status: "unpaid",
    submissions: [],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getSubmissionsByApplicationId(appId: string): PaymentSubmission[] {
  return MOCK_PAYMENT_SUBMISSIONS.filter((s) => s.applicationId === appId);
}

export function getSubmissionsByExamFeeId(examFeeId: string): PaymentSubmission[] {
  return MOCK_PAYMENT_SUBMISSIONS.filter((s) => s.examFeeId === examFeeId);
}

export function getSubmissionById(id: string): PaymentSubmission | undefined {
  return MOCK_PAYMENT_SUBMISSIONS.find((s) => s.id === id);
}

export function getExamFeesByStudentId(studentId: string): ExamFee[] {
  return MOCK_EXAM_FEES.filter((f) => f.studentId === studentId);
}

export function getAdmissionSubmissions(): PaymentSubmission[] {
  return MOCK_PAYMENT_SUBMISSIONS.filter((s) => s.paymentContext === "admission");
}

export function getAllSubmissions(): PaymentSubmission[] {
  return MOCK_PAYMENT_SUBMISSIONS;
}
