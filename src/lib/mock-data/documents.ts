// lib/mock-data/documents.ts
// Field names match the Admission type from admin/admissions/page.tsx

export type DocumentStudent = {
  id: number;
  username: string;
  name: string;
  class_name: string;
  section: string;
  roll_number: string;
  gender: string;
  dob: string;
  blood_group: string | null;
  stay_type: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_occupation: string | null;
  village_moholla: string | null;
  ward: string | null;
  union_pourosova: string | null;
  upozilla: string | null;
  student_photo_path: string | null;
  academic_year: string;
};

export type SubjectResult = {
  subject: string;
  max_marks: number;
  obtained_marks: number;
  grade: string;
  remarks: string;
};

export type StudentResult = {
  student_id: number;
  exam_term: string;
  academic_year: string;
  subjects: SubjectResult[];
  total_obtained: number;
  total_max: number;
  percentage: number;
  overall_grade: string;
  position: number;
  total_students: number;
  attendance_present: number;
  attendance_total: number;
  pass: boolean;
  teacher_remarks: string;
};

export type ExamScheduleEntry = {
  subject: string;
  date: string;
  day: string;
  time: string;
  room: string;
};

export type StudentExamCard = {
  student_id: number;
  exam_name: string;
  academic_year: string;
  schedule: ExamScheduleEntry[];
  instructions: string[];
};

// ── Students ──────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS: DocumentStudent[] = [
  {
    id: 1,
    username: "STU-2025-001",
    name: "Rahim Uddin",
    class_name: "Class 9",
    section: "A",
    roll_number: "01",
    gender: "Male",
    dob: "2010-03-15",
    blood_group: "B+",
    stay_type: "Home",
    father_name: "Abdul Uddin",
    mother_name: "Rahela Begum",
    guardian_name: "Abdul Uddin",
    guardian_phone: "01712345678",
    guardian_occupation: "Farmer",
    village_moholla: "Chanchkoir",
    ward: "06",
    union_pourosova: "Gurudaspur Pouroshova",
    upozilla: "Gurudaspur",
    student_photo_path: null,
    academic_year: "2025-26",
  },
  {
    id: 2,
    username: "STU-2025-002",
    name: "Fatema Begum",
    class_name: "Class 6",
    section: "B",
    roll_number: "08",
    gender: "Female",
    dob: "2013-07-22",
    blood_group: "O+",
    stay_type: "Home",
    father_name: "Kamal Hossain",
    mother_name: "Nasrin Akter",
    guardian_name: "Kamal Hossain",
    guardian_phone: "01898765432",
    guardian_occupation: "Businessman",
    village_moholla: "Baraigram",
    ward: "03",
    union_pourosova: "Baraigram Union",
    upozilla: "Baraigram",
    student_photo_path: null,
    academic_year: "2025-26",
  },
  {
    id: 3,
    username: "STU-2025-003",
    name: "Jamal Sheikh",
    class_name: "Class 10",
    section: "A",
    roll_number: "14",
    gender: "Male",
    dob: "2009-11-05",
    blood_group: "A+",
    stay_type: "Hostel",
    father_name: "Rafiqul Sheikh",
    mother_name: "Moriam Khatun",
    guardian_name: "Rafiqul Sheikh",
    guardian_phone: "01567891234",
    guardian_occupation: "Teacher",
    village_moholla: "Natore Sadar",
    ward: "01",
    union_pourosova: "Natore Pouroshova",
    upozilla: "Natore Sadar",
    student_photo_path: null,
    academic_year: "2025-26",
  },
  {
    id: 4,
    username: "STU-2025-004",
    name: "Ruma Khatun",
    class_name: "Class 5",
    section: "A",
    roll_number: "03",
    gender: "Female",
    dob: "2014-01-30",
    blood_group: "AB+",
    stay_type: "Home",
    father_name: "Mizanur Rahman",
    mother_name: "Shirin Akter",
    guardian_name: "Mizanur Rahman",
    guardian_phone: "01623456789",
    guardian_occupation: "Rickshaw Driver",
    village_moholla: "Ataikula",
    ward: "07",
    union_pourosova: "Ataikula Union",
    upozilla: "Gurudaspur",
    student_photo_path: null,
    academic_year: "2025-26",
  },
  {
    id: 5,
    username: "STU-2025-005",
    name: "Karim Hossain",
    class_name: "Class 9",
    section: "A",
    roll_number: "05",
    gender: "Male",
    dob: "2010-08-18",
    blood_group: "B-",
    stay_type: "Home",
    father_name: "Abul Hossain",
    mother_name: "Bilkis Begum",
    guardian_name: "Abul Hossain",
    guardian_phone: "01745678901",
    guardian_occupation: "Shop Owner",
    village_moholla: "Singra",
    ward: "02",
    union_pourosova: "Singra Union",
    upozilla: "Singra",
    student_photo_path: null,
    academic_year: "2025-26",
  },
  {
    id: 6,
    username: "STU-2025-006",
    name: "Nasrin Akter",
    class_name: "Class 8",
    section: "B",
    roll_number: "11",
    gender: "Female",
    dob: "2011-05-12",
    blood_group: "O-",
    stay_type: "Home",
    father_name: "Nurul Islam",
    mother_name: "Fatema Islam",
    guardian_name: "Nurul Islam",
    guardian_phone: "01934567890",
    guardian_occupation: "Government Employee",
    village_moholla: "Lalpur",
    ward: "04",
    union_pourosova: "Lalpur Union",
    upozilla: "Lalpur",
    student_photo_path: null,
    academic_year: "2025-26",
  },
];

// ── Results (indexed by student ID) ──────────────────────────────────────────

export const MOCK_RESULTS: Record<number, StudentResult> = {
  1: {
    student_id: 1,
    exam_term: "Annual Examination",
    academic_year: "2025-26",
    subjects: [
      { subject: "Bangla", max_marks: 100, obtained_marks: 78, grade: "A", remarks: "Good" },
      { subject: "English", max_marks: 100, obtained_marks: 82, grade: "A+", remarks: "Excellent" },
      { subject: "Mathematics", max_marks: 100, obtained_marks: 91, grade: "A+", remarks: "Outstanding" },
      { subject: "Science", max_marks: 100, obtained_marks: 74, grade: "A", remarks: "Good" },
      { subject: "Social Studies", max_marks: 100, obtained_marks: 68, grade: "A-", remarks: "Satisfactory" },
      { subject: "Religion", max_marks: 100, obtained_marks: 85, grade: "A+", remarks: "Excellent" },
      { subject: "ICT", max_marks: 50, obtained_marks: 44, grade: "A+", remarks: "Excellent" },
    ],
    total_obtained: 522,
    total_max: 650,
    percentage: 80.3,
    overall_grade: "A",
    position: 3,
    total_students: 42,
    attendance_present: 178,
    attendance_total: 192,
    pass: true,
    teacher_remarks: "Rahim is a hardworking and dedicated student. He shows great potential in Mathematics and English.",
  },
  2: {
    student_id: 2,
    exam_term: "Annual Examination",
    academic_year: "2025-26",
    subjects: [
      { subject: "Bangla", max_marks: 100, obtained_marks: 72, grade: "A", remarks: "Good" },
      { subject: "English", max_marks: 100, obtained_marks: 65, grade: "A-", remarks: "Satisfactory" },
      { subject: "Mathematics", max_marks: 100, obtained_marks: 58, grade: "B", remarks: "Average" },
      { subject: "Science", max_marks: 100, obtained_marks: 80, grade: "A+", remarks: "Excellent" },
      { subject: "Social Studies", max_marks: 100, obtained_marks: 77, grade: "A", remarks: "Good" },
      { subject: "Religion", max_marks: 100, obtained_marks: 90, grade: "A+", remarks: "Excellent" },
    ],
    total_obtained: 442,
    total_max: 600,
    percentage: 73.7,
    overall_grade: "A",
    position: 8,
    total_students: 38,
    attendance_present: 165,
    attendance_total: 190,
    pass: true,
    teacher_remarks: "Fatema is attentive in class and participates actively. Needs improvement in Mathematics.",
  },
  3: {
    student_id: 3,
    exam_term: "Annual Examination",
    academic_year: "2025-26",
    subjects: [
      { subject: "Bangla", max_marks: 100, obtained_marks: 88, grade: "A+", remarks: "Excellent" },
      { subject: "English", max_marks: 100, obtained_marks: 91, grade: "A+", remarks: "Outstanding" },
      { subject: "Mathematics", max_marks: 100, obtained_marks: 95, grade: "A+", remarks: "Outstanding" },
      { subject: "Physics", max_marks: 100, obtained_marks: 87, grade: "A+", remarks: "Excellent" },
      { subject: "Chemistry", max_marks: 100, obtained_marks: 83, grade: "A+", remarks: "Excellent" },
      { subject: "Biology", max_marks: 100, obtained_marks: 79, grade: "A", remarks: "Good" },
      { subject: "ICT", max_marks: 50, obtained_marks: 48, grade: "A+", remarks: "Outstanding" },
    ],
    total_obtained: 571,
    total_max: 650,
    percentage: 87.8,
    overall_grade: "A+",
    position: 1,
    total_students: 45,
    attendance_present: 188,
    attendance_total: 192,
    pass: true,
    teacher_remarks: "Jamal is an exceptional student and a role model for the class. Consistently performs at the highest level.",
  },
  4: {
    student_id: 4,
    exam_term: "Annual Examination",
    academic_year: "2025-26",
    subjects: [
      { subject: "Bangla", max_marks: 100, obtained_marks: 65, grade: "A-", remarks: "Satisfactory" },
      { subject: "English", max_marks: 100, obtained_marks: 55, grade: "B", remarks: "Average" },
      { subject: "Mathematics", max_marks: 100, obtained_marks: 70, grade: "A", remarks: "Good" },
      { subject: "Science", max_marks: 100, obtained_marks: 68, grade: "A-", remarks: "Satisfactory" },
      { subject: "Social Studies", max_marks: 100, obtained_marks: 72, grade: "A", remarks: "Good" },
    ],
    total_obtained: 330,
    total_max: 500,
    percentage: 66.0,
    overall_grade: "A-",
    position: 12,
    total_students: 36,
    attendance_present: 155,
    attendance_total: 185,
    pass: true,
    teacher_remarks: "Ruma is improving steadily. With more focus on English, she can achieve much better results.",
  },
  5: {
    student_id: 5,
    exam_term: "Annual Examination",
    academic_year: "2025-26",
    subjects: [
      { subject: "Bangla", max_marks: 100, obtained_marks: 75, grade: "A", remarks: "Good" },
      { subject: "English", max_marks: 100, obtained_marks: 70, grade: "A", remarks: "Good" },
      { subject: "Mathematics", max_marks: 100, obtained_marks: 85, grade: "A+", remarks: "Excellent" },
      { subject: "Science", max_marks: 100, obtained_marks: 78, grade: "A", remarks: "Good" },
      { subject: "Social Studies", max_marks: 100, obtained_marks: 65, grade: "A-", remarks: "Satisfactory" },
      { subject: "Religion", max_marks: 100, obtained_marks: 80, grade: "A+", remarks: "Excellent" },
      { subject: "ICT", max_marks: 50, obtained_marks: 42, grade: "A+", remarks: "Excellent" },
    ],
    total_obtained: 495,
    total_max: 650,
    percentage: 76.2,
    overall_grade: "A",
    position: 5,
    total_students: 42,
    attendance_present: 182,
    attendance_total: 192,
    pass: true,
    teacher_remarks: "Karim is a consistent performer. His strength in Mathematics is commendable.",
  },
  6: {
    student_id: 6,
    exam_term: "Annual Examination",
    academic_year: "2025-26",
    subjects: [
      { subject: "Bangla", max_marks: 100, obtained_marks: 80, grade: "A+", remarks: "Excellent" },
      { subject: "English", max_marks: 100, obtained_marks: 74, grade: "A", remarks: "Good" },
      { subject: "Mathematics", max_marks: 100, obtained_marks: 62, grade: "A-", remarks: "Satisfactory" },
      { subject: "Science", max_marks: 100, obtained_marks: 84, grade: "A+", remarks: "Excellent" },
      { subject: "Social Studies", max_marks: 100, obtained_marks: 79, grade: "A", remarks: "Good" },
      { subject: "Religion", max_marks: 100, obtained_marks: 92, grade: "A+", remarks: "Outstanding" },
    ],
    total_obtained: 471,
    total_max: 600,
    percentage: 78.5,
    overall_grade: "A",
    position: 4,
    total_students: 40,
    attendance_present: 175,
    attendance_total: 188,
    pass: true,
    teacher_remarks: "Nasrin is a diligent student with excellent participation. Should focus more on Mathematics.",
  },
};

// ── Exam schedules (indexed by student ID) ────────────────────────────────────

const CLASS_9_10_SCHEDULE: ExamScheduleEntry[] = [
  { subject: "Bangla",      date: "2026-02-02", day: "Monday",    time: "10:00 AM – 1:00 PM", room: "Hall A" },
  { subject: "English",     date: "2026-02-04", day: "Wednesday", time: "10:00 AM – 1:00 PM", room: "Hall A" },
  { subject: "Mathematics", date: "2026-02-06", day: "Friday",    time: "10:00 AM – 1:00 PM", room: "Hall B" },
  { subject: "Science",     date: "2026-02-09", day: "Monday",    time: "10:00 AM – 1:00 PM", room: "Hall A" },
  { subject: "Social Studies", date: "2026-02-11", day: "Wednesday", time: "10:00 AM – 1:00 PM", room: "Hall C" },
  { subject: "Religion",    date: "2026-02-13", day: "Friday",    time: "10:00 AM – 12:00 PM", room: "Hall B" },
  { subject: "ICT",         date: "2026-02-16", day: "Monday",    time: "10:00 AM – 12:00 PM", room: "Lab 1" },
];

const CLASS_6_8_SCHEDULE: ExamScheduleEntry[] = [
  { subject: "Bangla",      date: "2026-02-02", day: "Monday",    time: "10:00 AM – 1:00 PM", room: "Room 101" },
  { subject: "English",     date: "2026-02-04", day: "Wednesday", time: "10:00 AM – 1:00 PM", room: "Room 101" },
  { subject: "Mathematics", date: "2026-02-06", day: "Friday",    time: "10:00 AM – 1:00 PM", room: "Room 102" },
  { subject: "Science",     date: "2026-02-09", day: "Monday",    time: "10:00 AM – 1:00 PM", room: "Room 103" },
  { subject: "Social Studies", date: "2026-02-11", day: "Wednesday", time: "10:00 AM – 12:00 PM", room: "Room 101" },
  { subject: "Religion",    date: "2026-02-13", day: "Friday",    time: "10:00 AM – 11:30 AM", room: "Room 102" },
];

const CLASS_1_5_SCHEDULE: ExamScheduleEntry[] = [
  { subject: "Bangla",         date: "2026-02-02", day: "Monday",    time: "9:00 AM – 11:00 AM", room: "Room 201" },
  { subject: "English",        date: "2026-02-04", day: "Wednesday", time: "9:00 AM – 11:00 AM", room: "Room 201" },
  { subject: "Mathematics",    date: "2026-02-06", day: "Friday",    time: "9:00 AM – 11:00 AM", room: "Room 202" },
  { subject: "Science",        date: "2026-02-09", day: "Monday",    time: "9:00 AM – 11:00 AM", room: "Room 203" },
  { subject: "Social Studies", date: "2026-02-11", day: "Wednesday", time: "9:00 AM – 11:00 AM", room: "Room 201" },
];

const EXAM_INSTRUCTIONS = [
  "Bring this admit card to the examination hall. Entry will not be permitted without it.",
  "Arrive at the hall at least 15 minutes before the examination starts.",
  "Mobile phones, calculators (unless permitted), and electronic devices are strictly prohibited.",
  "Sit only in the seat assigned to your roll number.",
  "Write your roll number clearly on the answer script.",
  "Do not communicate with other candidates during the examination.",
  "The candidate must sign on this card in the presence of the invigilator.",
];

export const MOCK_EXAM_CARDS: Record<number, StudentExamCard> = {
  1: { student_id: 1, exam_name: "Annual Examination 2025–26", academic_year: "2025-26", schedule: CLASS_9_10_SCHEDULE, instructions: EXAM_INSTRUCTIONS },
  2: { student_id: 2, exam_name: "Annual Examination 2025–26", academic_year: "2025-26", schedule: CLASS_6_8_SCHEDULE,  instructions: EXAM_INSTRUCTIONS },
  3: { student_id: 3, exam_name: "Annual Examination 2025–26", academic_year: "2025-26", schedule: CLASS_9_10_SCHEDULE, instructions: EXAM_INSTRUCTIONS },
  4: { student_id: 4, exam_name: "Annual Examination 2025–26", academic_year: "2025-26", schedule: CLASS_1_5_SCHEDULE,  instructions: EXAM_INSTRUCTIONS },
  5: { student_id: 5, exam_name: "Annual Examination 2025–26", academic_year: "2025-26", schedule: CLASS_9_10_SCHEDULE, instructions: EXAM_INSTRUCTIONS },
  6: { student_id: 6, exam_name: "Annual Examination 2025–26", academic_year: "2025-26", schedule: CLASS_6_8_SCHEDULE,  instructions: EXAM_INSTRUCTIONS },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getStudentById(id: number): DocumentStudent | undefined {
  return MOCK_STUDENTS.find((s) => s.id === id);
}

export function getResultByStudentId(id: number): StudentResult | undefined {
  return MOCK_RESULTS[id];
}

export function getExamCardByStudentId(id: number): StudentExamCard | undefined {
  return MOCK_EXAM_CARDS[id];
}

export function getStudentsByClass(class_name: string, section?: string): DocumentStudent[] {
  return MOCK_STUDENTS.filter(
    (s) =>
      s.class_name.toLowerCase() === class_name.toLowerCase() &&
      (!section || s.section.toLowerCase() === section.toLowerCase())
  );
}

export const SCHOOL_INFO = {
  name: "Bright Future School",
  address: "Gurudaspur, Natore, Rajshahi",
  phone: "01XXXXXXXXX",
  email: "info@brightfutureschool.edu.bd",
  color: "#4F46E5",
} as const;
