import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";

// ── Helpers ────────────────────────────────────────────────────────────────────

function en(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function enDate(v: unknown): Date | null {
  const s = en(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function generateStudentUsername(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.student.count({
    where: { enrolledAt: { gte: new Date(`${year}-01-01`) } },
  });
  return `STU-${year}-${String(count + 1).padStart(5, "0")}`;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const q      = url.searchParams.get("q")?.trim() ?? "";
    const cls    = url.searchParams.get("class") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const page   = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

    const section = url.searchParams.get("section") ?? "";

    const where: Record<string, unknown> = {};
    if (cls) where.className = cls;
    if (section) where.section = section;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { admission: { nameEn: { contains: q } } },
        { admission: { nameBn: { contains: q } } },
        { user: { username: { contains: q } } },
        { admission: { guardianName: { contains: q } } },
        { admission: { guardianMobileNo: { contains: q } } },
        { admission: { fatherMobileNo: { contains: q } } },
        { id: { contains: q } },
      ];
    }

    const [total, students] = await Promise.all([
      db.student.count({ where }),
      db.student.findMany({
        where,
        orderBy: { enrolledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admission: {
            select: {
              nameEn: true, nameBn: true, gender: true, dob: true, bloodGroup: true,
              guardianName: true, guardianMobileNo: true, guardianRelation: true,
              fatherNameEn: true, fatherMobileNo: true,
              motherNameEn: true, motherMobileNo: true,
              studentPhoto: true, presentZilla: true, presentUpazilla: true,
            },
          },
          user: { select: { username: true } },
        },
      }),
    ]);

    return NextResponse.json({
      students: students.map((s) => ({
        id: s.id,
        admission_id: s.admissionId,
        class_name: s.className,
        section: s.section,
        roll_number: s.rollNumber,
        academic_year: s.academicYear,
        session_name: s.sessionName,
        status: s.status,
        enrolled_at: s.enrolledAt.toISOString(),
        username: s.user?.username ?? null,
        name_en: s.admission?.nameEn ?? "",
        name_bn: s.admission?.nameBn ?? null,
        gender: s.admission?.gender ?? null,
        dob: s.admission?.dob ? s.admission.dob.toISOString() : null,
        blood_group: s.admission?.bloodGroup ?? null,
        guardian_name: s.admission?.guardianName ?? null,
        guardian_mobile: s.admission?.guardianMobileNo ?? null,
        guardian_relation: s.admission?.guardianRelation ?? null,
        father_name: s.admission?.fatherNameEn ?? null,
        father_mobile: s.admission?.fatherMobileNo ?? null,
        mother_name: s.admission?.motherNameEn ?? null,
        mother_mobile: s.admission?.motherMobileNo ?? null,
        photo: s.admission?.studentPhoto ?? null,
        present_zilla: s.admission?.presentZilla ?? null,
        present_upazilla: s.admission?.presentUpazilla ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/v1/admin/students:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const nameEn    = en(body.name_en);
    const gender    = en(body.gender);
    const className = en(body.class_name);
    const password  = en(body.password);

    if (!nameEn)    return NextResponse.json({ message: "name_en is required" }, { status: 422 });
    if (!gender)    return NextResponse.json({ message: "gender is required" }, { status: 422 });
    if (!className) return NextResponse.json({ message: "class_name is required" }, { status: 422 });
    if (!password || password.length < 8)
      return NextResponse.json({ message: "password must be at least 8 characters" }, { status: 422 });

    const username  = await generateStudentUsername();
    const email     = `${username.toLowerCase()}@student.local`;
    const year      = en(body.academic_year) ?? String(new Date().getFullYear());

    const hashedPassword = await bcrypt.hash(password, 10);
    const studentId = createId();
    const userId    = createId();

    const student = await db.$transaction(async (tx) => {
      const admission = await tx.admission.create({
        data: {
          nameEn,
          nameBn:    en(body.name_bn),
          nameAr:    en(body.name_ar),
          dob:       enDate(body.dob),
          birthCertificateNo: en(body.birth_certificate_no),
          gender,
          height:    en(body.height),
          weight:    en(body.weight),
          nationality: en(body.nationality),
          bloodGroup:  en(body.blood_group),
          identifySign: en(body.identify_sign),

          presentVillage:  en(body.present_village),
          presentPost:     en(body.present_post),
          presentUpazilla: en(body.present_upazilla),
          presentPostCode: en(body.present_post_code),
          presentZilla:    en(body.present_zilla),

          permanentVillage:  en(body.permanent_village),
          permanentPost:     en(body.permanent_post),
          permanentUpazilla: en(body.permanent_upazilla),
          permanentZilla:    en(body.permanent_zilla),
          permanentPostCode: en(body.permanent_post_code),

          fatherNameEn:       en(body.father_name_en),
          fatherNameBn:       en(body.father_name_bn),
          fatherEducation:    en(body.father_education),
          fatherOccupation:   en(body.father_occupation),
          fatherMonthlyEarning: en(body.father_monthly_earning),
          fatherMobileNo:     en(body.father_mobile_no),
          fatherNidNo:        en(body.father_nid_no),
          fatherDob:          enDate(body.father_dob),

          motherNameEn:       en(body.mother_name_en),
          motherNameBn:       en(body.mother_name_bn),
          motherEducation:    en(body.mother_education),
          motherOccupation:   en(body.mother_occupation),
          motherMonthlyEarning: en(body.mother_monthly_earning),
          motherMobileNo:     en(body.mother_mobile_no),
          motherNidNo:        en(body.mother_nid_no),
          motherDob:          enDate(body.mother_dob),

          guardianName:             en(body.guardian_name),
          guardianRelation:         en(body.guardian_student_relation),
          guardianPresentAddress:   en(body.guardian_present_address),
          guardianPermanentAddress: en(body.guardian_permanent_address),
          guardianEducation:        en(body.guardian_education),
          guardianOccupation:       en(body.guardian_occupation),
          guardianMonthlyEarning:   en(body.guardian_monthly_earning),
          guardianMobileNo:         en(body.guardian_mobile_no),
          guardianNidNo:            en(body.guardian_nid_no),
          guardianDob:              enDate(body.guardian_dob),

          className,
          sessionName:           en(body.session_name),
          division:              en(body.division),
          previousInstituteName: en(body.previous_institute_name),
          siblingDetails:        en(body.sibling_details),

          status: "Enrolled",
          paymentStatus: "Paid",
          enrollmentPaymentStatus: "Paid",
        },
      });

      // Student must be created before user (user.studentId is a FK to Student)
      const stud = await tx.student.create({
        data: {
          id: studentId,
          admissionId: admission.id,
          className,
          section:     en(body.section) ?? null,
          rollNumber:  en(body.roll_number) ?? null,
          academicYear: year,
          sessionName: en(body.session_name) ?? null,
          status: "Active",
        },
      });

      await tx.user.create({
        data: {
          id: userId,
          name: nameEn,
          email,
          username,
          role: "student",
          admissionId: admission.id,
          studentId: stud.id,
        },
      });

      await tx.account.create({
        data: {
          id: createId(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return stud;
    });

    logActivity({
      module: "student",
      action: "student_created",
      entityType: "Student",
      entityId: student.id,
      entityLabel: `${nameEn} · ${className}`,
      actorId: session.user.id,
      actorName: (session.user as any)?.name ?? undefined,
      actorRole: "admin",
      description: `Admin created student ${nameEn} for class ${className}`,
      metadata: { studentId: student.id, className, username },
    });

    return NextResponse.json({
      student: {
        id: student.id,
        username,
        name_en: nameEn,
        class_name: student.className,
        section: student.section,
        roll_number: student.rollNumber,
        academic_year: student.academicYear,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/admin/students:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
