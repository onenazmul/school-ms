// components/documents/pdf/PaymentReceiptPDF.tsx
// Money Receipt PDF — follows the same pattern as IDCardPDF / ResultCardPDF.
// Uses shared design tokens from pdfStyles.ts.

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type ReceiptSubmissionItem = {
  id: string;
  status: string;
  method: string;
  transactionId: string;
  phoneNumber: string | null;
  amountSent: number;
  paymentDate: string;
};
import {
  BRAND_COLOR, BRAND_LIGHT, BRAND_BORDER,
  MUTED_COLOR, TEXT_COLOR, BORDER_COLOR, BG_MUTED,
  SUCCESS_COLOR,
  FONT_BOLD, FONT_NORMAL,
} from "./shared/pdfStyles";

const S = StyleSheet.create({
  page: {
    fontFamily: FONT_NORMAL,
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 36,
    fontSize: 8,
    color: TEXT_COLOR,
  },
  // ── School header ──────────────────────────────────────────────────────────
  schoolHeader: {
    borderBottom: `2pt solid ${BRAND_COLOR}`,
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  schoolName: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: BRAND_COLOR,
  },
  schoolSub: {
    fontSize: 7.5,
    color: MUTED_COLOR,
    marginTop: 2,
  },
  receiptTitle: {
    fontSize: 12,
    fontFamily: FONT_BOLD,
    color: TEXT_COLOR,
    textAlign: "right",
  },
  receiptMeta: {
    fontSize: 7.5,
    color: MUTED_COLOR,
    textAlign: "right",
    marginTop: 2,
  },
  // ── Section divider ────────────────────────────────────────────────────────
  divider: {
    borderBottom: `0.5pt solid ${BORDER_COLOR}`,
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: FONT_BOLD,
    color: MUTED_COLOR,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  // ── Info rows ──────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 90,
    fontSize: 8,
    color: MUTED_COLOR,
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: TEXT_COLOR,
  },
  // ── Payment table ──────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_COLOR,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 7.5,
    fontFamily: FONT_BOLD,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: `0.5pt solid ${BORDER_COLOR}`,
  },
  tableRowAlt: {
    backgroundColor: BG_MUTED,
  },
  tableCell: {
    fontSize: 7.5,
    color: TEXT_COLOR,
  },
  colNo:      { width: "5%" },
  colMethod:  { width: "18%" },
  colTrxId:   { width: "25%" },
  colPhone:   { width: "20%" },
  colAmount:  { width: "17%", textAlign: "right" },
  colDate:    { width: "15%", textAlign: "right" },
  // ── Fee summary ────────────────────────────────────────────────────────────
  summaryBox: {
    marginTop: 10,
    backgroundColor: BRAND_LIGHT,
    border: `1pt solid ${BRAND_BORDER}`,
    borderRadius: 4,
    padding: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 30,
  },
  summaryItem: {
    alignItems: "flex-end",
  },
  summaryLabel: {
    fontSize: 7.5,
    color: MUTED_COLOR,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: FONT_BOLD,
    color: TEXT_COLOR,
  },
  summaryValueGreen: {
    fontSize: 11,
    fontFamily: FONT_BOLD,
    color: SUCCESS_COLOR,
  },
  // ── Verification footer ────────────────────────────────────────────────────
  verifiedBox: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  verifiedLeft: {
    fontSize: 7.5,
    color: MUTED_COLOR,
    lineHeight: 1.6,
  },
  sigBox: {
    alignItems: "center",
    width: 110,
  },
  sigLine: {
    width: 100,
    borderBottom: `0.5pt solid ${MUTED_COLOR}`,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 7,
    color: MUTED_COLOR,
  },
  // ── Status banner ──────────────────────────────────────────────────────────
  statusBannerVerified: {
    marginBottom: 12,
    backgroundColor: "#F0FDF4",
    border: "1pt solid #86EFAC",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBannerPending: {
    marginBottom: 12,
    backgroundColor: "#FFFBEB",
    border: "1pt solid #FCD34D",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBannerTextVerified: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: "#15803D",
  },
  statusBannerTextPending: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: "#B45309",
  },
  statusBannerSub: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 1,
  },
  // ── Notice ─────────────────────────────────────────────────────────────────
  notice: {
    marginTop: 14,
    borderTop: `0.5pt solid ${BORDER_COLOR}`,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noticeText: {
    fontSize: 6.5,
    color: MUTED_COLOR,
    flex: 1,
  },
});

export type ReceiptData = {
  receiptNumber: string;
  receiptDate: string;
  payerName: string;
  paymentContext: "admission" | "exam_fee" | "enrollment";
  applicationId?: string;
  classApplied?: string;
  studentId?: string;
  studentClass?: string;
  rollNumber?: string;
  examName?: string;
  academicYear: string;
  feeType: string;
  totalFee: number;
  amountPaid: number;
  balanceDue: number;
  submissions: ReceiptSubmissionItem[];
  status?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  schoolInfo: { name: string; address: string; phone: string; email: string };
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtMethod(m: string) {
  if (m === "bkash") return "bKash";
  if (m === "rocket") return "Rocket";
  return "Bank Transfer";
}

export function PaymentReceiptPDF({ data }: { data: ReceiptData }) {
  const isVerified = data.status === "verified";
  const isPending  = data.status === "pending" || data.status === "under_review";
  const { schoolInfo } = data;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* School header */}
        <View style={S.schoolHeader}>
          <View>
            <Text style={S.schoolName}>{schoolInfo.name}</Text>
            <Text style={S.schoolSub}>{schoolInfo.address}</Text>
            <Text style={S.schoolSub}>{schoolInfo.phone} · {schoolInfo.email}</Text>
          </View>
          <View>
            <Text style={S.receiptTitle}>PAYMENT RECEIPT</Text>
            <Text style={S.receiptMeta}>Receipt No: {data.receiptNumber}</Text>
            <Text style={S.receiptMeta}>Date: {fmtDate(data.receiptDate)}</Text>
          </View>
        </View>

        {/* Status banner */}
        {isVerified && (
          <View style={S.statusBannerVerified}>
            <View>
              <Text style={S.statusBannerTextVerified}>✓  PAYMENT VERIFIED</Text>
              {data.verifiedAt && (
                <Text style={S.statusBannerSub}>
                  Verified on {fmtDate(data.verifiedAt)}{data.verifiedBy ? `  ·  By ${data.verifiedBy}` : ""}
                </Text>
              )}
            </View>
          </View>
        )}
        {isPending && (
          <View style={S.statusBannerPending}>
            <View>
              <Text style={S.statusBannerTextPending}>⏳  PAYMENT UNDER REVIEW</Text>
              <Text style={S.statusBannerSub}>
                Payment proof submitted. This is a provisional receipt pending admin verification.
              </Text>
            </View>
          </View>
        )}

        {/* Received from */}
        <Text style={S.sectionLabel}>RECEIVED FROM</Text>
        <View style={S.infoRow}>
          <Text style={S.infoLabel}>Name</Text>
          <Text style={S.infoValue}>{data.payerName}</Text>
        </View>

        {data.paymentContext === "admission" ? (
          <>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Application ID</Text>
              <Text style={S.infoValue}>{data.applicationId ?? "—"}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Class Applied</Text>
              <Text style={S.infoValue}>{data.classApplied ?? "—"}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Student ID</Text>
              <Text style={S.infoValue}>{data.studentId ?? "—"}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Class / Roll</Text>
              <Text style={S.infoValue}>
                {data.studentClass ?? "—"}{data.rollNumber ? ` · Roll ${data.rollNumber}` : ""}
              </Text>
            </View>
            {data.examName && (
              <View style={S.infoRow}>
                <Text style={S.infoLabel}>Exam</Text>
                <Text style={S.infoValue}>{data.examName}</Text>
              </View>
            )}
          </>
        )}

        <View style={S.infoRow}>
          <Text style={S.infoLabel}>Academic Year</Text>
          <Text style={S.infoValue}>{data.academicYear}</Text>
        </View>
        <View style={S.infoRow}>
          <Text style={S.infoLabel}>Fee Type</Text>
          <Text style={S.infoValue}>{data.feeType}</Text>
        </View>

        <View style={S.divider} />

        {/* Payment details table */}
        <Text style={S.sectionLabel}>PAYMENT DETAILS</Text>

        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderText, S.colNo as any]}>#</Text>
          <Text style={[S.tableHeaderText, S.colMethod as any]}>Method</Text>
          <Text style={[S.tableHeaderText, S.colTrxId as any]}>Transaction ID</Text>
          <Text style={[S.tableHeaderText, S.colPhone as any]}>Phone Used</Text>
          <Text style={[S.tableHeaderText, S.colAmount as any]}>Amount</Text>
          <Text style={[S.tableHeaderText, S.colDate as any]}>Date</Text>
        </View>

        {data.submissions.map((sub, i) => (
          <View key={sub.id} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
            <Text style={[S.tableCell, S.colNo as any]}>{i + 1}</Text>
            <Text style={[S.tableCell, S.colMethod as any]}>{fmtMethod(sub.method)}</Text>
            <Text style={[S.tableCell, S.colTrxId as any]}>{sub.transactionId}</Text>
            <Text style={[S.tableCell, S.colPhone as any]}>{sub.phoneNumber || "—"}</Text>
            <Text style={[S.tableCell, S.colAmount as any]}>BDT {sub.amountSent.toLocaleString("en-IN")}</Text>
            <Text style={[S.tableCell, S.colDate as any]}>{fmtDate(sub.paymentDate)}</Text>
          </View>
        ))}

        {/* Fee summary */}
        <View style={S.summaryBox}>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>Total Fee</Text>
            <Text style={S.summaryValue}>BDT {data.totalFee.toLocaleString("en-IN")}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>Amount Paid</Text>
            <Text style={S.summaryValueGreen}>BDT {data.amountPaid.toLocaleString("en-IN")}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>Balance Due</Text>
            <Text style={[S.summaryValue, { color: data.balanceDue > 0 ? "#DC2626" : TEXT_COLOR }]}>
              BDT {data.balanceDue.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* Signature */}
        <View style={S.verifiedBox}>
          <View>
            <Text style={S.verifiedLeft}>
              {isPending
                ? "This provisional receipt is subject to admin verification."
                : "This receipt is computer-generated and valid without a physical signature."}
            </Text>
          </View>
          <View style={S.sigBox}>
            <View style={S.sigLine} />
            <Text style={S.sigLabel}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Notice footer */}
        <View style={S.notice}>
          <Text style={S.noticeText}>
            This receipt is computer-generated and valid without a physical signature.
            {"\n"}{schoolInfo.name} · {schoolInfo.address} · {schoolInfo.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
