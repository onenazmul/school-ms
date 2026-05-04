// lib/api/endpoints.ts

export const EP = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",
  AUTH_REFRESH: "/auth/refresh",

  // Students
  STUDENTS: "/students",
  STUDENT: (id: string) => `/students/${id}`,
  STUDENT_LEDGER: (id: string) => `/students/${id}/ledger`,
  STUDENT_RECEIPTS: (id: string) => `/students/${id}/receipts`,

  // Teachers
  TEACHERS: "/teachers",
  TEACHER: (id: string) => `/teachers/${id}`,

  // Finance
  FEE_CONFIGS: "/finance/fee-configs",
  FEE_CONFIG: (id: string) => `/finance/fee-configs/${id}`,
  BILLS: "/finance/bills",
  BILL: (id: string) => `/finance/bills/${id}`,
  BULK_BILLING: "/finance/bulk-billing",
  RECEIPTS: "/finance/receipts",
  RECEIPT: (id: string) => `/finance/receipts/${id}`,
  LEDGER: "/finance/ledger",

  // Admission
  APPLY: "/admission",
  ADMISSIONS: "/admission",
  ADMISSION: (id: string | number) => `/admission/${id}`,
  STUDENT_LOGIN: "/admission/login",
  ADMISSION_PAYMENT: (id: string | number) => `/admission/${id}/payment`,
  ADMISSION_PAY: "/admission/payment",

  // Dashboard
  ADMIN_STATS: "/dashboard/admin",
  STUDENT_STATS: "/dashboard/student",
  TEACHER_STATS: "/dashboard/teacher",
} as const;
