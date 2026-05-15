// app/(student)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/helpers";
import { StudentPanelLayout } from "@/components/layout/student-panel-layout";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.user as any).role !== "student") redirect("/student-login");
  const { id, name, email, username, role } = session.user as any;
  return (
    <StudentPanelLayout session={{ id, name, email, username, role }}>
      {children}
    </StudentPanelLayout>
  );
}
