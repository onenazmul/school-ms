// app/(admission)/layout.tsx
// Admission portal layout — separate from the student panel.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { AdmissionShell } from "@/components/layout/admission-shell";

export default async function AdmissionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/apply/login");

  const { id, name, email, username, role } = session.user as any;

  const user = await db.user.findUnique({
    where: { id },
    select: { admission: { select: { status: true } } },
  });
  const isEnrolled = user?.admission?.status === "Enrolled";

  return (
    <AdmissionShell session={{ id, name, email, username, role }} isEnrolled={isEnrolled}>
      {children}
    </AdmissionShell>
  );
}
