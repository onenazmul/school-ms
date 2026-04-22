// app/(student)/layout.tsx
import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student";
import { StudentPanelLayout } from "@/components/layout/student-panel-layout";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();
  if (!session) redirect("/student-login");
  return <StudentPanelLayout session={session}>{children}</StudentPanelLayout>;
}
