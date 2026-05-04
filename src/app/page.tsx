// app/page.tsx
// Smart root redirect — checks both auth systems
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getStudentSession } from "@/lib/auth/student";

export default async function RootPage() {
  const studentSession = await getStudentSession();
  if (studentSession) redirect("/student/dashboard");

  const adminSession = await getAdminSession();
  if (adminSession?.role === "admin") redirect("/admin/dashboard");

  redirect("/login");
}
