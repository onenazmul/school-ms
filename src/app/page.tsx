// app/page.tsx
// Smart root redirect — checks both auth systems
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/helpers";

export default async function RootPage() {
  const session = await getSession();
  const role = (session?.user as any)?.role;

  if (role === "student") redirect("/student/dashboard");
  if (role === "applicant") redirect("/admission/dashboard");
  if (role === "admin") redirect("/admin/dashboard");
  if (role === "teacher") redirect("/teacher/dashboard");

  redirect("/login");
}
