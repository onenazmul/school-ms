// app/(admission)/layout.tsx
// Admission portal layout — separate from the student panel.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/helpers";
import { AdmissionShell } from "@/components/layout/admission-shell";

export default async function AdmissionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/apply/login");

  const { id, name, email, username, role } = session.user as any;
  return (
    <AdmissionShell session={{ id, name, email, username, role }}>
      {children}
    </AdmissionShell>
  );
}
