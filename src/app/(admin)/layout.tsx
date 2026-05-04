// app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { PanelLayout } from "@/components/layout/panel-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.DEV_OPEN_STAFF !== "true") {
    const session = await getAdminSession();
    if (!session) redirect("/login");
  }
  return <PanelLayout>{children}</PanelLayout>;
}
