// components/documents/pdf/ResultCardPDF.tsx
import {
  Document, Page, View, Text, StyleSheet,
} from "@react-pdf/renderer";
import type { DocumentStudent, StudentResult } from "@/lib/mock-data/documents";
import { SCHOOL_INFO } from "@/lib/mock-data/documents";

const BRAND = SCHOOL_INFO.color;

const styles = StyleSheet.create({
  page: {
    size: "A4",
    backgroundColor: "#fff",
    fontFamily: "Helvetica",
    paddingHorizontal: 36,
    paddingVertical: 32,
  },
  // School header
  schoolHeader: {
    borderBottom: "2pt solid " + BRAND,
    paddingBottom: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  schoolName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  schoolSub: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    textAlign: "right",
  },
  reportSubTitle: {
    fontSize: 8,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 2,
  },
  // Student info block
  studentInfoBox: {
    backgroundColor: "#F9FAFB",
    border: "1pt solid #E5E7EB",
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    width: 70,
    height: 88,
    backgroundColor: "#E0E7FF",
    border: "1pt solid #A5B4FC",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  photoLabel: {
    fontSize: 6,
    color: "#6366F1",
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6B7280",
    width: 80,
  },
  infoValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #E5E7EB",
  },
  tableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  col_subject: { width: "35%" },
  col_max:     { width: "15%", textAlign: "right" },
  col_obt:     { width: "15%", textAlign: "right" },
  col_grade:   { width: "15%", textAlign: "center" },
  col_remarks: { width: "20%", textAlign: "center" },
  cellText: {
    fontSize: 7.5,
    color: "#374151",
  },
  // Summary row
  summaryBox: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    border: "1pt solid #BAE6FD",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 7,
    color: "#0369A1",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0C4A6E",
  },
  // Result stamp
  passStamp: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: "#DCFCE7",
    border: "1.5pt solid #16A34A",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  failStamp: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: "#FEE2E2",
    border: "1.5pt solid #DC2626",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  stampText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  // Attendance
  attendanceRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  attendanceBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    border: "0.5pt solid #FDE68A",
    borderRadius: 3,
    padding: 6,
    gap: 6,
  },
  attendanceLabel: {
    fontSize: 7,
    color: "#92400E",
  },
  attendanceValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#78350F",
  },
  // Remarks
  remarksBox: {
    marginTop: 12,
    padding: 8,
    border: "0.5pt solid #E5E7EB",
    borderRadius: 3,
    backgroundColor: "#FAFAFA",
  },
  remarksLabel: {
    fontSize: 7,
    color: "#9CA3AF",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  remarksText: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.5,
  },
  // Signatures
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  sigLine: {
    alignItems: "center",
    width: 100,
  },
  sigLineBar: {
    width: 90,
    borderBottom: "0.5pt solid #9CA3AF",
    marginBottom: 3,
  },
  sigLineLabel: {
    fontSize: 7,
    color: "#6B7280",
  },
  // Footer
  pageFooter: {
    marginTop: 16,
    borderTop: "0.5pt solid #E5E7EB",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 6.5,
    color: "#9CA3AF",
  },
});

type Props = { student: DocumentStudent; result: StudentResult };

export function ResultCardPDF({ student, result }: Props) {
  const attendancePct = result.attendance_total > 0
    ? Math.round((result.attendance_present / result.attendance_total) * 100)
    : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School header */}
        <View style={styles.schoolHeader}>
          <View>
            <Text style={styles.schoolName}>{SCHOOL_INFO.name}</Text>
            <Text style={styles.schoolSub}>{SCHOOL_INFO.address} · {SCHOOL_INFO.phone}</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>RESULT CARD</Text>
            <Text style={styles.reportSubTitle}>{result.exam_term} · {result.academic_year}</Text>
          </View>
        </View>

        {/* Student info */}
        <View style={styles.studentInfoBox}>
          <View style={styles.infoLeft}>
            {[
              ["Student Name", student.name],
              ["Class / Section", `${student.class_name} — Section ${student.section}`],
              ["Roll Number", student.roll_number],
              ["Student ID", student.username],
              ["Date of Birth", student.dob],
              ["Gender", student.gender],
              ["Guardian", student.guardian_name ?? "—"],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}:</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.photoLabel}>PHOTO</Text>
          </View>
        </View>

        {/* Marks table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col_subject as any]}>Subject</Text>
          <Text style={[styles.tableHeaderText, styles.col_max as any]}>Max</Text>
          <Text style={[styles.tableHeaderText, styles.col_obt as any]}>Obtained</Text>
          <Text style={[styles.tableHeaderText, styles.col_grade as any]}>Grade</Text>
          <Text style={[styles.tableHeaderText, styles.col_remarks as any]}>Remarks</Text>
        </View>
        {result.subjects.map((s, i) => (
          <View key={s.subject} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.cellText, styles.col_subject as any]}>{s.subject}</Text>
            <Text style={[styles.cellText, styles.col_max as any]}>{s.max_marks}</Text>
            <Text style={[styles.cellText, styles.col_obt as any]}>{s.obtained_marks}</Text>
            <Text style={[styles.cellText, styles.col_grade as any]}>{s.grade}</Text>
            <Text style={[styles.cellText, styles.col_remarks as any]}>{s.remarks}</Text>
          </View>
        ))}

        {/* Summary cards */}
        <View style={styles.summaryBox}>
          {[
            ["Total Marks", `${result.total_obtained} / ${result.total_max}`],
            ["Percentage", `${result.percentage.toFixed(1)}%`],
            ["Overall Grade", result.overall_grade],
            ["Position", `${result.position} of ${result.total_students}`],
          ].map(([label, value]) => (
            <View key={label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Attendance */}
        <View style={styles.attendanceRow}>
          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceLabel}>Days Present</Text>
            <Text style={styles.attendanceValue}>{result.attendance_present}</Text>
          </View>
          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceLabel}>Total Days</Text>
            <Text style={styles.attendanceValue}>{result.attendance_total}</Text>
          </View>
          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceLabel}>Attendance %</Text>
            <Text style={styles.attendanceValue}>{attendancePct}%</Text>
          </View>
        </View>

        {/* Pass/Fail stamp */}
        <View style={result.pass ? styles.passStamp : styles.failStamp}>
          <Text style={[styles.stampText, { color: result.pass ? "#16A34A" : "#DC2626" }]}>
            {result.pass ? "PASSED" : "FAILED"}
          </Text>
        </View>

        {/* Teacher remarks */}
        {result.teacher_remarks && (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>CLASS TEACHER REMARKS</Text>
            <Text style={styles.remarksText}>{result.teacher_remarks}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signaturesRow}>
          {["Class Teacher", "Head of Department", "Principal"].map((sig) => (
            <View key={sig} style={styles.sigLine}>
              <View style={styles.sigLineBar} />
              <Text style={styles.sigLineLabel}>{sig}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
          <Text style={styles.footerText}>{SCHOOL_INFO.name} — Official Result Card</Text>
          <Text style={styles.footerText}>{SCHOOL_INFO.phone}</Text>
        </View>
      </Page>
    </Document>
  );
}
