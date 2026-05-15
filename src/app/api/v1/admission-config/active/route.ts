import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const config = await db.admissionConfig.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        academicYear: true,
        applicationStartDate: true,
        applicationEndDate: true,
        feeMode: true,
        globalFee: true,
        classConfigs: {
          select: { className: true, fee: true },
        },
      },
    });

    if (!config) return NextResponse.json({ config: null });

    return NextResponse.json({
      config: {
        id: config.id,
        academicYear: config.academicYear,
        applicationStartDate: config.applicationStartDate?.toISOString() ?? null,
        applicationEndDate: config.applicationEndDate?.toISOString() ?? null,
        feeMode: config.feeMode,
        globalFee: config.globalFee != null ? Number(config.globalFee) : null,
        classConfigs: config.classConfigs.map((c) => ({
          className: c.className,
          fee: c.fee != null ? Number(c.fee) : null,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/v1/admission-config/active:", err);
    return NextResponse.json({ config: null });
  }
}
