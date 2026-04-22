// app/page.tsx
// Smart root redirect — checks both auth systems
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server";
import { getStudentSession } from "@/lib/auth/student";

export default async function RootPage() {
  // Check student cookie first (its own JWT)
  const studentSession = await getStudentSession();
  if (studentSession) redirect("/student/dashboard");

  // Then check staff Better Auth session
  const staffSession = await getServerSession();
  if (staffSession?.user?.role === "admin")   redirect("/admin/dashboard");
  if (staffSession?.user?.role === "teacher") redirect("/teacher/dashboard");

  // No session — send to staff login (students have their own link there)
  redirect("/login");
}
