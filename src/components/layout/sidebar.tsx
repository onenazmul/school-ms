"use client";
// components/layout/sidebar.tsx

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  FileText,
  ListTodo,
  UserCircle,
  ClipboardList,
  BarChart3,
  Wallet,
  Download,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ── Nav types ─────────────────────────────────────────────────────────────────

type NavLink = {
  kind?: "link";
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
};

type NavDivider = {
  kind: "divider";
  label: string;
};

type NavItem = NavLink | NavDivider;

// ── Nav definitions ───────────────────────────────────────────────────────────

const NAV: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard",   href: "/admin/dashboard",   icon: LayoutDashboard },
    { label: "Admissions",  href: "/admin/admissions",  icon: ClipboardList },
    { label: "Students",    href: "/admin/students",    icon: GraduationCap },
    { label: "Teachers",    href: "/admin/teachers",    icon: Users },
    { label: "Classes",     href: "/admin/classes",     icon: BookOpen },
    { kind: "divider", label: "Finance" },
    { label: "Fee Config",    href: "/admin/finance/fee-config",   icon: Settings },
    { label: "Bulk Billing",  href: "/admin/finance/bulk-billing", icon: ListTodo },
    { label: "Fee Overview",  href: "/admin/finance/overview",     icon: BarChart3 },
    { label: "Ledger",        href: "/admin/finance/ledger",       icon: Wallet },
    { label: "Receipts",      href: "/admin/finance/receipts",     icon: Receipt },
    { label: "Payments",      href: "/admin/admissions/payments",  icon: DollarSign },
    { label: "Adm. Settings", href: "/admin/admissions/settings", icon: Settings },
    { kind: "divider", label: "More" },
    { label: "Documents",     href: "/admin/documents",     icon: Download },
    { label: "Reports",       href: "/admin/reports",       icon: BarChart3 },
    { label: "Activity Log",  href: "/admin/activity-log",  icon: Activity },
    { label: "Settings",      href: "/admin/settings",      icon: Settings },
  ],
  teacher: [
    { label: "Dashboard",   href: "/teacher/dashboard",  icon: LayoutDashboard },
    { label: "My Classes",  href: "/teacher/classes",    icon: BookOpen },
    { label: "Students",    href: "/teacher/students",   icon: GraduationCap },
    { label: "Attendance",  href: "/teacher/attendance", icon: ListTodo },
  ],
  student: [
    { label: "Dashboard",    href: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Ledger",    href: "/student/ledger",    icon: DollarSign },
    { label: "Fee Receipts", href: "/student/receipts",  icon: Receipt },
    { label: "Profile",      href: "/student/profile",   icon: UserCircle },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  // Derive role from session; fall back to pathname for DEV_OPEN_STAFF mode
  // (middleware bypasses Better Auth in dev, so useSession() returns null)
  const sessionRole = (session?.user as any)?.role as string | undefined;
  const role: string =
    sessionRole ??
    (pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/teacher")
      ? "teacher"
      : pathname.startsWith("/student")
      ? "student"
      : "");

  const navItems = NAV[role] ?? [];

  // In dev mode the session user is null — show a placeholder
  const user = session?.user ?? (role ? { name: "Dev " + role, email: "" } : null);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo + collapse */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-semibold text-sm tracking-tight">
              SchoolOS
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("size-8 shrink-0", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <Menu className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, idx) => {
          // Section divider
          if (item.kind === "divider") {
            return collapsed ? (
              <div key={`div-${idx}`} className="my-2 mx-2 border-t" />
            ) : (
              <div key={`div-${idx}`} className="pt-3 pb-1 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {item.label}
                </p>
              </div>
            );
          }

          // Regular link
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("size-4 shrink-0", active && "text-indigo-600")} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge != null && (
                <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
