// components/layout/student-panel-layout.tsx
// Separate panel layout for students — takes session as a server-passed prop
// so we don't need the Better Auth useSession() hook (students use their own auth).

import { StudentSidebar } from "./student-sidebar";
import { StudentTopbar } from "./student-topbar";
import { StudentMobileNav } from "./student-mobile-nav";
import type { StudentSession } from "@/lib/auth/student";

export function StudentPanelLayout({
  children,
  session,
}: {
  children: React.ReactNode;
  session: StudentSession;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <StudentSidebar session={session} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentTopbar session={session} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <StudentMobileNav />
    </div>
  );
}
