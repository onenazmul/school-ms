import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if ((session.user as any)?.role !== "admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const q        = url.searchParams.get("q")?.trim() ?? "";
    const cls      = url.searchParams.get("class") ?? "";
    const status   = url.searchParams.get("status") ?? "";
    const page     = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit    = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

    const where: Record<string, unknown> = {};

    if (cls) where.className = cls;
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
              nameEn: true,
              nameBn: true,
              gender: true,
              dob: true,
              bloodGroup: true,
              guardianName: true,
              guardianMobileNo: true,
              guardianRelation: true,
              fatherNameEn: true,
              fatherMobileNo: true,
              motherNameEn: true,
              motherMobileNo: true,
              studentPhoto: true,
              presentZilla: true,
              presentUpazilla: true,
            },
          },
          user: {
            select: { username: true },
          },
        },
      }),
    ]);

    const serialized = students.map((s) => ({
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
    }));

    return NextResponse.json({
      students: serialized,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/v1/admin/students:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
