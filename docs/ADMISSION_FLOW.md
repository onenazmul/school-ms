# Admission Flow — Design & Implementation Plan

## 1. Complete Flow Overview

### Phase 1: Application (`/apply`)
- Applicant fills the admission form
- **App Status:** `Pending` | **Payment Status:** `Unpaid`
- Applicant can freely edit their application info
- Warning shown prominently: *"Double-check your information before submitting payment — you cannot edit your application after payment is submitted"*

---

### Phase 2: Payment

Applicant submits payment proof → **App Status:** `Under Review` | **Payment Status:** `Payment Submitted`  
Application info is **locked** (no editing).

**Admin Payment Review Verdicts:**

| Verdict | Payment Status | App Status | Info Lock | Notes |
|---------|---------------|------------|-----------|-------|
| **Verified** | `Paid` | Auto → `Awaiting Test` *(if test day set for class)* or stays `Under Review` | Locked | System checks active admission config for class test day |
| **Fake** | `Unpaid` | Unchanged (stays `Under Review`) | Info stays locked; payment resubmit unlocked | Applicant submits new payment proof |
| **Return / Correct** | `Unpaid` | → `Pending` | Info unlocked + payment unlocked | Admin-supplied note required; applicant fixes and resubmits |

---

### Phase 3: Test *(Optional — based on Admission Config)*

- Admin configures test day(s) per class (or one global test day) in Admission Settings
- Test type per class: `Written` | `Viva` | `Both` — informational only (offline exam)
- Applicant sees their test day on: panel, downloadable receipt, printable application
- After test: Admin or Teacher enters marks per applicant
  - Written marks + Viva marks → Total marks
- **If marks threshold enabled:** auto approve/reject when marks are saved *(TBD: immediate or via "Process Results" button — see Open Questions)*
- **If threshold disabled:** admin manually approves/rejects (individual or bulk)

---

### Phase 4: Result

- Admin configures result day/time in Admission Settings
- **Result Visibility Mode** (setting):
  - `real_time` — applicant sees status as soon as admin updates it
  - `result_day` — result hidden until configured result datetime
- Applicant logs into panel → sees `Enrolled` or `Rejected`
- If test was conducted: marks shown alongside result

---

### Phase 5: Enrollment

- Admin approves → **App Status:** `Enrolled` → Student record created, user role → `student`
- Admin rejects → **App Status:** `Rejected`

---

## 2. Status Reference

### Application Status

| Status | Description |
|--------|-------------|
| `Pending` | Application submitted, payment not yet made (or returned for correction) |
| `Under Review` | Payment submitted or verified (no test day set) |
| `Awaiting Test` | Payment verified; test day exists for this class — waiting for exam |
| `Approved` | Passed test threshold; pending admin sign-off or enrollment fee (if applicable) |
| `Enrolled` | Fully enrolled — student record created |
| `Rejected` | Application rejected by admin |

### Payment Status

| Status | Description |
|--------|-------------|
| `Unpaid` | No payment submitted yet (initial, or reset after fake/return) |
| `Payment Submitted` | Applicant submitted proof; awaiting admin review |
| `Paid` | Payment verified by admin |
| `Fake Payment Proof` | Admin flagged as fake (applicant can resubmit payment) |

---

## 3. Admission Config (Admin Settings)

### Global Settings *(per Academic Year)*
- **Academic year** — e.g., `"2026"`
- **Active toggle** — only one config active at a time
- **Application window** — open date / close date
- **Fee mode** — `same_for_all` (one flat amount) | `per_class` (set individually per class)
- **Global test day** — single date, optional (applies to all classes unless overridden)
- **Global test type** — `written` | `viva` | `both`
- **Global max marks** — max written marks, max viva marks
- **Result day/time** — specific datetime, optional
- **Result visibility** — `real_time` | `result_day`
- **Marks threshold enabled** — boolean
- **Marks pass threshold** — number (total marks required to pass)
- **Threshold action** — `auto_enroll` (immediately create student) | `flag_review` (mark approved, hold for admin confirmation or enrollment fee)

### Per-Class Overrides *(ClassAdmissionConfig)*
- **Class name** — matches `appliedClass` values on Admission
- **Fee** — overrides global fee if set
- **Test day** — overrides global test day if set
- **Test type** — `written` | `viva` | `both`
- **Max written marks** / **Max viva marks**
- **Result day/time** — overrides global result day if set

> **One global test day is the common case.** Per-class override exists for edge cases (e.g., different classes test on different days).

---

## 4. SMS Notifications

**Provider:** [BDBulkSMS](https://bdbulksms.com/bd-bulk-sms-api.php)  
**Infrastructure:** Hostinger Cron + manual resend button fallback

### SMS Types & Toggles

| SMS Type | Trigger | Toggle |
|----------|---------|--------|
| Application Received | On `/apply` form submission | On/Off |
| Payment Status | On admin payment verdict (verified/fake/return) | On/Off |
| Test Day Reminder | Cron — configurable days before test day | On/Off |
| Admission Result — Real Time | When admin sets Enrolled/Rejected | On/Off |
| Admission Result — 6h Before | Cron — 6 hours before result datetime | On/Off |
| Admission Result — At Result Time | Cron — at result datetime | On/Off |
| Admission Result — 6h After | Cron — 6 hours after result datetime | On/Off |

### SMS Log (per applicant, per SMS type)
- Phone number used
- Message content
- Sent at / status (`sent` | `failed`)
- Error if failed
- Allow resend from admin panel

---

## 5. Database Schema Additions

### New Models

```prisma
model AdmissionConfig {
  id                    Int                    @id @default(autoincrement())
  academicYear          String                 // "2026"
  isActive              Boolean                @default(false)
  applicationStartDate  DateTime?
  applicationEndDate    DateTime?
  globalFee             Float?
  globalTestDay         DateTime?
  globalTestType        String?                // "written" | "viva" | "both"
  globalMaxWrittenMarks Float?
  globalMaxVivaMarks    Float?
  resultDay             DateTime?
  resultVisibility      String                 @default("real_time") // "real_time" | "result_day"
  feeMode               String                 @default("same_for_all") // "same_for_all" | "per_class"
  marksThresholdEnabled Boolean                @default(false)
  marksPassThreshold    Float?
  marksThresholdAction  String                 @default("flag_review") // "auto_enroll" | "flag_review"
  // flag_review = mark as approved but hold for enrollment fee or admin confirmation
  // auto_enroll = immediately create student record when threshold met
  classConfigs          ClassAdmissionConfig[]
  admissions            Admission[]
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
}

model ClassAdmissionConfig {
  id                Int             @id @default(autoincrement())
  admissionConfig   AdmissionConfig @relation(fields: [admissionConfigId], references: [id])
  admissionConfigId Int
  className         String          // matches appliedClass on Admission
  fee               Float?
  testDay           DateTime?
  testType          String?         // "written" | "viva" | "both"
  maxWrittenMarks   Float?
  maxVivaMarks      Float?
  resultDay         DateTime?
}

model AdmissionMark {
  id           Int       @id @default(autoincrement())
  admissionId  Int       @unique
  admission    Admission @relation(fields: [admissionId], references: [id])
  writtenMarks Float?
  vivaMarks    Float?
  totalMarks   Float?
  enteredBy    String?
  enteredAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model SmsConfig {
  id                   Int     @id @default(1)
  apiKey               String?
  senderId             String?
  applicationReceived  Boolean @default(true)
  paymentStatus        Boolean @default(true)
  testDayReminder      Boolean @default(false)
  resultRealTime       Boolean @default(false)
  resultSixHourBefore  Boolean @default(false)
  resultAtTime         Boolean @default(true)
  resultSixHourAfter   Boolean @default(false)
}

model SmsLog {
  id          String   @id @default(cuid())
  admissionId Int?
  phone       String
  type        String   // "application_received" | "payment_status" | "test_day" | "result"
  message     String   @db.Text
  status      String   @default("sent") // "sent" | "failed"
  sentAt      DateTime @default(now())
  error       String?
}
```

### Additions to Existing Models

```prisma
// Admission model — add these fields:
admissionConfigId Int?
admissionConfig   AdmissionConfig? @relation(fields: [admissionConfigId], references: [id])
mark              AdmissionMark?

// Status comment update:
// status: Pending | Under Review | Awaiting Test | Enrolled | Rejected
```

---

## 6. Implementation Steps (Ordered)

### Step 1 — Schema Updates
- Add all new models above to `prisma/schema.prisma`
- Add `admissionConfigId` to `Admission`
- Add `Awaiting Test` to status comment
- Run `npx prisma db push`

### Step 2 — Fix Fake Payment Verdict
- Update `PATCH /api/v1/admin/payment-submissions/[id]`
- `fake` verdict: payment status → `Unpaid`, app status **unchanged**, info lock **unchanged**
- *(currently `fake` sets "Fake Payment Proof" label but doesn't fully reset — verify behavior)*

### Step 3 — Admission Config API (Admin CRUD)
- `GET/POST /api/v1/admin/admission-config` — list / create
- `GET/PATCH /api/v1/admin/admission-config/[id]` — view / update
- `POST /api/v1/admin/admission-config/[id]/activate` — set active (deactivate others)
- `GET/POST /api/v1/admin/admission-config/[id]/class-configs` — per-class overrides
- `PATCH/DELETE /api/v1/admin/admission-config/[id]/class-configs/[classId]`

### Step 4 — Admission Config Admin UI
- Page: `/admin/settings/admission` (or `/admin/admissions/settings`)
- Global settings form + per-class overrides table
- Test day picker, fee input, result day/time picker
- Threshold toggle + value input
- Result visibility toggle

### Step 5 — Auto "Awaiting Test" on Payment Verified
- After payment verified → look up active `AdmissionConfig`
- Find `ClassAdmissionConfig` for applicant's `appliedClass`
- If test day exists → set `status = "Awaiting Test"`
- Otherwise → stay `Under Review`
- Run as part of the payment-submissions PATCH transaction

### Step 6 — Marks Entry API & UI
- `POST/PATCH /api/v1/admin/admissions/[id]/marks` — enter/update marks
- Accessible by admin and teacher roles
- Auto-threshold check on save (if enabled)
- Admin UI: marks input columns on admissions list or applicant sheet
- Bulk marks entry UI (table with inline inputs)

### Step 7 — Approve/Reject from Marks
- Manual: individual "Approve"/"Reject" buttons + bulk action
- Auto (if threshold enabled):
  - `flag_review`: status → `Approved` (new status — passed test, pending enrollment fee or admin sign-off)
  - `auto_enroll`: immediately run enrollment transaction
  - *(Future: enrollment fee step between Approved and Enrolled)*
- Enrollment transaction: create Student, update user role

### Step 8 — Result Visibility Gating (Applicant Panel)
- Check active `AdmissionConfig.resultVisibility`
- If `result_day`: compare current datetime to `resultDay` — hide result if before
- If `real_time`: show current status immediately
- Show marks on result panel if `AdmissionMark` exists

### Step 9 — Applicant Panel Updates
- Edit lock: disable application info form after payment submitted (payment status ≠ Unpaid)
- Show test day info if set for their class
- Show marks on result
- Result visibility gating (Step 8)

### Step 10 — Receipt & Printable Application
- Include test day + test type from class config if set
- Include admission fee from class config or global

### Step 11 — SMS Integration
- Add bdbulksms.com HTTP client utility (`src/lib/sms.ts`)
- `GET/PATCH /api/v1/admin/sms-config` — view/update SMS settings
- Wire SMS triggers at each event:
  - Application submit → application received SMS
  - Payment verdict → payment status SMS
  - Marks/result update → result SMS (if real_time mode)
- Log every SMS attempt to `SmsLog`
- Admin SMS log page with resend button

### Step 12 — Cron Jobs (Hostinger)
- Cron endpoint: `GET /api/v1/cron/sms?type=test_day_reminder&secret=CRON_SECRET`
- Types: `test_day_reminder` | `result_6h_before` | `result_at_time` | `result_6h_after`
- Secret validated against env var `CRON_SECRET`
- Each run: query eligible admissions → send SMS → log

---

## 7. Resolved Decisions

- [x] **Auto-threshold action:** Configurable setting — `auto_enroll` (immediate student creation) | `flag_review` (pass marks but hold for enrollment fee / admin sign-off). Future hook: enrollment fee step between Approved and Enrolled.
- [x] **Fee mode:** Admin explicitly chooses — `same_for_all` (one flat fee) | `per_class` (individual fee per class).

## 8. Future / Deferred

- Enrollment fee (session fee, boarding fee, development fee) — paid after admission approval, before full enrollment
- 6-month / term-based admission cycles
- Per-session fee variations

---

## 8. Key Design Decisions

| Decision | Choice |
|----------|--------|
| Edit lock trigger | Payment status ≠ `Unpaid` (any submission locks info) |
| Fake vs Return | Fake = payment unlock only; Return = full reset (info + payment) |
| Test day binding | Tied to `appliedClass` via `ClassAdmissionConfig` |
| Marks granularity | Written + Viva individually stored, total also stored |
| Academic cycle | Yearly only for now (6-month cycles deferred) |
| Result day | Specific datetime (not just date) for cron precision |
| Cron auth | `CRON_SECRET` env var validated on each cron request |
