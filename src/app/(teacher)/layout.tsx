// app/(teacher)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/helpers";
import { PanelLayout } from "@/components/layout/panel-layout";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.user as any).role !== "teacher") redirect("/login");
  return <PanelLayout>{children}</PanelLayout>;
}
