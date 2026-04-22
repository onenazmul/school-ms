// app/(admission)/layout.tsx
// Admission portal layout — separate from the student panel.

import { getStudentSession } from "@/lib/auth/student";
import { redirect } from "next/navigation";
import { AdmissionShell } from "@/components/layout/admission-shell";

export default async function AdmissionLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();
  if (!session) redirect("/apply/login");

  return <AdmissionShell session={session}>{children}</AdmissionShell>;
}
