// app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server";
import { PanelLayout } from "@/components/layout/panel-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session || session.user.role !== "admin") redirect("/login");
  return <PanelLayout>{children}</PanelLayout>;
}
