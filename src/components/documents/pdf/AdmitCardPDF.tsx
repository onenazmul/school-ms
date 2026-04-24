// components/documents/pdf/AdmitCardPDF.tsx
import {
  Document, Page, View, Text, StyleSheet,
} from "@react-pdf/renderer";
import type { DocumentStudent, StudentExamCard } from "@/lib/mock-data/documents";
import { SCHOOL_INFO } from "@/lib/mock-data/documents";

const BRAND = SCHOOL_INFO.color;

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    fontFamily: "Helvetica",
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  // Outer border
  outerBorder: {
    border: "2pt solid " + BRAND,
    borderRadius: 5,
    padding: 14,
    flex: 1,
  },
  // Heading strip
  headingStrip: {
    backgroundColor: BRAND,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 3,
    marginBottom: 10,
    alignItems: "center",
  },
  headingText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
  },
  // School info row
  schoolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "0.5pt solid #E5E7EB",
  },
  schoolName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  schoolSub: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 2,
  },
  examBadge: {
    backgroundColor: "#EEF2FF",
    border: "0.5pt solid #C7D2FE",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "right",
  },
  examBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  examBadgeSub: {
    fontSize: 7,
    color: "#6366F1",
    marginTop: 1,
    textAlign: "right",
  },
  // Student info + photo
  studentRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
    border: "0.5pt solid #E5E7EB",
    borderRadius: 3,
    padding: 8,
  },
  studentInfo: {
    flex: 1,
  },
  infoLine: {
    flexDirection: "row",
    marginBottom: 3.5,
  },
  infoLabel: {
    fontSize: 7.5,
    color: "#6B7280",
    width: 70,
  },
  infoValue: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
  },
  photoBox: {
    width: 60,
    height: 76,
    backgroundColor: "#E0E7FF",
    border: "0.5pt solid #A5B4FC",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  photoLabel: {
    fontSize: 6,
    color: "#6366F1",
    textAlign: "center",
  },
  // Schedule table
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 2,
  },
  scheduleHeader: {
    flexDirection: "row",
    backgroundColor: "#374151",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 2,
    marginBottom: 1,
  },
  scheduleHeaderText: {
    color: "#fff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  scheduleRow: {
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    borderBottom: "0.5pt solid #F3F4F6",
  },
  scheduleRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  scheduleCell: {
    fontSize: 7,
    color: "#374151",
  },
  col_sub:  { width: "22%" },
  col_date: { width: "20%" },
  col_day:  { width: "16%" },
  col_time: { width: "28%" },
  col_room: { width: "14%", textAlign: "right" },
  // Instructions
  instructionsBox: {
    marginTop: 8,
    backgroundColor: "#FFFBEB",
    border: "0.5pt solid #FDE68A",
    borderRadius: 3,
    padding: 7,
  },
  instructionsTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#92400E",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  instructionLine: {
    flexDirection: "row",
    marginBottom: 2.5,
    gap: 4,
  },
  bulletDot: {
    fontSize: 7,
    color: "#B45309",
    width: 8,
    marginTop: 1,
  },
  instructionText: {
    fontSize: 6.5,
    color: "#78350F",
    flex: 1,
    lineHeight: 1.4,
  },
  // Notice bar
  noticeBar: {
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    border: "0.5pt solid #FCA5A5",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  noticeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#991B1B",
    textAlign: "center",
  },
  // Signatures
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  sigBlock: {
    alignItems: "center",
    width: 90,
  },
  sigLine: {
    width: 85,
    borderBottom: "0.5pt solid #9CA3AF",
    marginBottom: 3,
  },
  sigLabel: {
    fontSize: 6.5,
    color: "#6B7280",
    textAlign: "center",
  },
  // Footer
  cardFooter: {
    marginTop: 8,
    borderTop: "0.5pt solid #E5E7EB",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 6,
    color: "#9CA3AF",
  },
});

type Props = { student: DocumentStudent; examCard: StudentExamCard };

export function AdmitCardPDF({ student, examCard }: Props) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.outerBorder}>
          {/* Heading */}
          <View style={styles.headingStrip}>
            <Text style={styles.headingText}>ADMIT CARD</Text>
          </View>

          {/* School + exam info */}
          <View style={styles.schoolRow}>
            <View>
              <Text style={styles.schoolName}>{SCHOOL_INFO.name}</Text>
              <Text style={styles.schoolSub}>{SCHOOL_INFO.address}</Text>
            </View>
            <View style={styles.examBadge}>
              <Text style={styles.examBadgeText}>{examCard.exam_name}</Text>
              <Text style={styles.examBadgeSub}>{examCard.academic_year}</Text>
            </View>
          </View>

          {/* Student info + photo */}
          <View style={styles.studentRow}>
            <View style={styles.studentInfo}>
              {[
                ["Student Name",    student.name],
                ["Class / Section", `${student.class_name} — Sec ${student.section}`],
                ["Roll Number",     student.roll_number],
                ["Student ID",      student.username],
                ["Date of Birth",   student.dob],
                ["Gender",          student.gender],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoLine}>
                  <Text style={styles.infoLabel}>{label}:</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.photoBox}>
              <Text style={styles.photoLabel}>PHOTO</Text>
            </View>
          </View>

          {/* Exam schedule */}
          <Text style={styles.sectionLabel}>EXAMINATION SCHEDULE</Text>
          <View style={styles.scheduleHeader}>
            <Text style={[styles.scheduleHeaderText, styles.col_sub as any]}>Subject</Text>
            <Text style={[styles.scheduleHeaderText, styles.col_date as any]}>Date</Text>
            <Text style={[styles.scheduleHeaderText, styles.col_day as any]}>Day</Text>
            <Text style={[styles.scheduleHeaderText, styles.col_time as any]}>Time</Text>
            <Text style={[styles.scheduleHeaderText, styles.col_room as any]}>Room</Text>
          </View>
          {examCard.schedule.map((entry, i) => (
            <View key={entry.subject} style={[styles.scheduleRow, i % 2 === 1 ? styles.scheduleRowAlt : {}]}>
              <Text style={[styles.scheduleCell, styles.col_sub as any]}>{entry.subject}</Text>
              <Text style={[styles.scheduleCell, styles.col_date as any]}>{entry.date}</Text>
              <Text style={[styles.scheduleCell, styles.col_day as any]}>{entry.day}</Text>
              <Text style={[styles.scheduleCell, styles.col_time as any]}>{entry.time}</Text>
              <Text style={[styles.scheduleCell, styles.col_room as any]}>{entry.room}</Text>
            </View>
          ))}

          {/* Instructions */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>IMPORTANT INSTRUCTIONS</Text>
            {examCard.instructions.slice(0, 5).map((inst, i) => (
              <View key={i} style={styles.instructionLine}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.instructionText}>{inst}</Text>
              </View>
            ))}
          </View>

          {/* Notice */}
          <View style={styles.noticeBar}>
            <Text style={styles.noticeText}>
              This card must be presented at the examination hall. No entry without this card.
            </Text>
          </View>

          {/* Signatures */}
          <View style={styles.signaturesRow}>
            {["Student Signature", "Parent / Guardian", "Principal Signature"].map((sig) => (
              <View key={sig} style={styles.sigBlock}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>{sig}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>
              Generated: {new Date().toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
            </Text>
            <Text style={styles.footerText}>{SCHOOL_INFO.name} — Official Admit Card</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
