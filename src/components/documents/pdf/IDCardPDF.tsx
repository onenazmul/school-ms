// components/documents/pdf/IDCardPDF.tsx
import {
  Document, Page, View, Text, StyleSheet,
} from "@react-pdf/renderer";
import type { DocumentStudent } from "@/lib/mock-data/documents";
import { SCHOOL_INFO } from "@/lib/mock-data/documents";

const BRAND = SCHOOL_INFO.color;

const styles = StyleSheet.create({
  page: {
    width: 243,
    height: 153,
    backgroundColor: "#fff",
    fontFamily: "Helvetica",
    border: "2pt solid " + BRAND,
    borderRadius: 6,
  },
  // Top color band
  header: {
    backgroundColor: BRAND,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  schoolName: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
    maxWidth: 120,
  },
  idCardLabel: {
    color: "#fff",
    fontSize: 6,
    opacity: 0.9,
    letterSpacing: 1,
  },
  // Body
  body: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 8,
  },
  // Photo placeholder
  photoBox: {
    width: 46,
    height: 58,
    backgroundColor: "#E0E7FF",
    border: "1pt solid #A5B4FC",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  photoLabel: {
    fontSize: 5,
    color: "#6366F1",
    textAlign: "center",
    marginTop: 2,
  },
  // Info area
  info: {
    flex: 1,
  },
  studentName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 1.2,
  },
  row: {
    flexDirection: "row",
    marginBottom: 2.5,
    alignItems: "center",
  },
  label: {
    fontSize: 6,
    color: "#6B7280",
    width: 54,
    flexShrink: 0,
  },
  value: {
    fontSize: 6.5,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  // Footer
  footer: {
    backgroundColor: "#F5F3FF",
    borderTop: "1pt solid #C4B5FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 5,
    color: "#6B7280",
  },
  idBadge: {
    backgroundColor: BRAND,
    color: "#fff",
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

type Props = { student: DocumentStudent };

export function IDCardPDF({ student }: Props) {
  return (
    <Document>
      <Page size={[243, 153]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{SCHOOL_INFO.name}</Text>
          <Text style={styles.idCardLabel}>STUDENT ID</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Photo */}
          <View style={styles.photoBox}>
            <Text style={[styles.photoLabel, { fontSize: 6 }]}>📷</Text>
            <Text style={styles.photoLabel}>PHOTO</Text>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.studentName}>{student.name}</Text>
            <InfoRow label="Class"       value={`${student.class_name} — Sec ${student.section}`} />
            <InfoRow label="Roll No."    value={student.roll_number} />
            <InfoRow label="Date of Birth" value={student.dob} />
            {student.blood_group && (
              <InfoRow label="Blood Group" value={student.blood_group} />
            )}
            <InfoRow label="Guardian"    value={student.guardian_name ?? ""} />
            <InfoRow label="Contact"     value={student.guardian_phone ?? ""} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {SCHOOL_INFO.address} · {SCHOOL_INFO.phone}
          </Text>
          <Text style={styles.idBadge}>{student.username}</Text>
        </View>
      </Page>
    </Document>
  );
}
