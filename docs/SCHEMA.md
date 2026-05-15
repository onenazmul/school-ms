# Prisma Schema Reference

Copy this to `prisma/schema.prisma`.

## Notes
- MySQL 8 on Hostinger
- Better Auth manages: `user`, `session`, `account`, `verification`, `twoFactor`
- All custom IDs use cuid2 (`createId()` from `@paralleldrive/cuid2`) except `Admission` (auto-increment int)
- Prisma version: ^6.19.3 (do NOT upgrade — later versions have issues)
- Table names lowercase (Better Auth convention) vs PascalCase for business tables

---

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// BETTER AUTH TABLES (do not rename these)
// ─────────────────────────────────────────────

model user {
  id               String    @id
  name             String
  email            String?   @unique   // nullable — students may not have email
  emailVerified    Boolean   @default(false)
  image            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // username plugin fields
  username         String?   @unique   // required for applicant/student
  displayUsername  String?

  // custom role field
  role             String    @default("applicant") // admin | teacher | applicant | student

  // 2FA
  twoFactorEnabled Boolean   @default(false)

  // Relations
  sessions         session[]
  accounts         account[]
  twoFactors       twoFactor[]

  // Business relations
  admission        Admission? @relation(fields: [admissionId], references: [id])
  admissionId      Int?       @unique
  student          Student?   @relation(fields: [studentId], references: [id])
  studentId        String?    @unique

  @@map("user")
}

model session {
  id           String   @id
  expiresAt    DateTime
  token        String   @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  ipAddress    String?
  userAgent    String?  @db.Text
  userId       String
  user         user     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  user      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  idToken               String?   @db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   @db.Text
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([providerId, accountId])
  @@map("account")
}

model verification {
  id         String    @id
  identifier String
  value      String    @db.Text
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt

  @@unique([identifier, value])
  @@map("verification")
}

model twoFactor {
  id          String @id
  secret      String @db.Text
  backupCodes String @db.Text
  userId      String @unique
  user        user   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("twoFactor")
}

// ─────────────────────────────────────────────
// BUSINESS TABLES
// ─────────────────────────────────────────────

model Admission {
  id   Int    @id @default(autoincrement())

  // ── Personal Info ──
  nameEn               String
  nameBn               String?
  nameAr               String?
  dob                  DateTime?
  birthCertificateNo   String?
  gender               String              // Male | Female | Other
  height               String?
  weight               String?
  nationality          String?
  bloodGroup           String?
  identifySign         String?

  // ── Present Address ──
  presentVillage       String?
  presentPost          String?
  presentUpazilla      String?
  presentPostCode      String?
  presentZilla         String?

  // ── Permanent Address ──
  permanentVillage     String?
  permanentPost        String?
  permanentUpazilla    String?
  permanentZilla       String?
  permanentPostCode    String?

  // ── Father Info ──
  fatherNameEn         String?
  fatherNameBn         String?
  fatherEducation      String?
  fatherOccupation     String?
  fatherMonthlyEarning String?
  fatherMobileNo       String?
  fatherNidNo          String?
  fatherDob            DateTime?

  // ── Mother Info ──
  motherNameEn         String?
  motherNameBn         String?
  motherEducation      String?
  motherOccupation     String?
  motherMonthlyEarning String?
  motherMobileNo       String?
  motherNidNo          String?
  motherDob            DateTime?

  // ── Guardian Info ──
  guardianName             String?
  guardianRelation         String?
  guardianPresentAddress   String?
  guardianPermanentAddress String?
  guardianEducation        String?
  guardianOccupation       String?
  guardianMonthlyEarning   String?
  guardianMobileNo         String?
  guardianNidNo            String?
  guardianDob              DateTime?

  // ── Academic ──
  className             String
  sessionName           String?
  division              String?
  previousInstituteName String?
  siblingDetails        String?

  // ── Application Status ──
  // Pending | Under Review | Shortlisted | Approved | Rejected | Enrolled
  status               String    @default("Pending")
  applicationFee       Decimal   @default(0) @db.Decimal(10, 2)
  paymentTrackingId    String?

  // ── Media ──
  studentPhoto         String?   // path relative to UPLOAD_DIR: photos/filename.webp
  studentSignature     String?   // path relative to UPLOAD_DIR: signatures/filename.webp

  // ── Admin Review ──
  adminNote            String?   @db.Text
  reviewedBy           String?   // user.id of reviewing admin
  reviewedAt           DateTime?

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // Relations
  user                 user?
  paymentSubmissions   PaymentSubmission[]
}

model Student {
  id           String   @id   // cuid2
  admissionId  Int      @unique
  admission    Admission @relation(fields: [admissionId], references: [id])

  // Academic placement (set when converting from admission)
  className    String
  section      String?
  rollNumber   String?
  academicYear String
  sessionName  String?

  // Status
  // Active | Inactive | Graduated | Transferred
  status       String   @default("Active")

  enrolledAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  user         user?
  bills        Bill[]
  receipts     Receipt[]
  results      ExamResult[]
  paymentSubmissions PaymentSubmission[]
}

model FeeConfig {
  id               String   @id   // cuid2
  name             String
  amount           Decimal  @db.Decimal(10, 2)
  // monthly | quarterly | yearly | one_time
  type             String
  applicableClasses Json    // String[] — array of class names
  dueDay           Int?     // day of month bills are due
  lateFee          Decimal? @db.Decimal(10, 2)
  isActive         Boolean  @default(true)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  bills            Bill[]
}

model Bill {
  id           String    @id   // cuid2
  studentId    String
  student      Student   @relation(fields: [studentId], references: [id])
  feeConfigId  String
  feeConfig    FeeConfig @relation(fields: [feeConfigId], references: [id])

  amount       Decimal   @db.Decimal(10, 2)
  lateFee      Decimal   @default(0) @db.Decimal(10, 2)
  dueDate      DateTime
  month        String?   // e.g. "2025-01" for monthly fees
  academicYear String
  // unpaid | partial | paid | waived
  status       String    @default("unpaid")

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  receiptItems ReceiptItem[]
}

model Receipt {
  id             String   @id   // cuid2
  studentId      String
  student        Student  @relation(fields: [studentId], references: [id])

  receiptNumber  String   @unique   // e.g. RCP-2025-00001
  // cash | bank_transfer | cheque | online
  paymentMethod  String
  receivedAmount Decimal  @db.Decimal(10, 2)
  paymentDate    DateTime
  createdBy      String   // user.id of admin who created

  notes          String?  @db.Text

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  items          ReceiptItem[]
}

model ReceiptItem {
  id        String  @id   // cuid2
  receiptId String
  receipt   Receipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  billId    String
  bill      Bill    @relation(fields: [billId], references: [id])
  amount    Decimal @db.Decimal(10, 2)
}

model PaymentSubmission {
  id             String    @id   // cuid2

  // Context: who submitted this
  admissionId    Int?
  admission      Admission? @relation(fields: [admissionId], references: [id])
  studentId      String?
  student        Student?   @relation(fields: [studentId], references: [id])

  // admission | exam_fee
  paymentContext String

  // ── Payment Details ──
  // bkash | rocket | bank_transfer
  method         String
  transactionId  String
  phoneNumber    String?
  amountSent     Decimal   @db.Decimal(10, 2)
  paymentDate    DateTime
  notes          String?   @db.Text
  screenshotUrl  String?   // relative path to uploaded screenshot

  // Bank transfer specific
  accountHolderName String?
  branch         String?
  depositSlipNo  String?

  // ── Admin Review ──
  // pending | under_review | verified | rejected
  status         String    @default("pending")
  adminNote      String?   @db.Text
  verifiedBy     String?   // user.id
  verifiedAt     DateTime?
  receiptNumber  String?

  submittedAt    DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model ExamResult {
  id           String   @id   // cuid2
  studentId    String
  student      Student  @relation(fields: [studentId], references: [id])

  examName     String
  academicYear String
  // JSON: [{ subject: string, fullMarks: number, obtainedMarks: number, grade: string }]
  subjects     Json

  totalMarks   Decimal? @db.Decimal(10, 2)
  gpa          Decimal? @db.Decimal(4, 2)
  grade        String?
  position     Int?

  publishedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## Seed File (`prisma/seed.ts`)

```ts
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth/server'

const db = new PrismaClient()

async function main() {
  // Create initial admin account via Better Auth
  await auth.api.signUpEmail({
    body: {
      email: 'admin@school.com',
      password: 'change-me-immediately',
      name: 'Admin',
      role: 'admin',
    }
  })
  console.log('Admin seeded')
}

main().catch(console.error).finally(() => db.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

---

## Admission → Student conversion flow

When admin clicks "Approve":

```ts
// In API route or server action
await db.$transaction(async (tx) => {
  // 1. Create Student record
  const student = await tx.student.create({
    data: {
      id: createId(),
      admissionId: admission.id,
      className: admission.className,
      academicYear: currentYear,
      rollNumber: await generateRollNumber(tx, admission.className),
    }
  })

  // 2. Update Admission status
  await tx.admission.update({
    where: { id: admission.id },
    data: { status: 'Enrolled', reviewedBy: adminUserId, reviewedAt: new Date() }
  })

  // 3. Upgrade Better Auth user role
  await tx.user.update({
    where: { admissionId: admission.id },
    data: { role: 'student', studentId: student.id }
  })
})
```
