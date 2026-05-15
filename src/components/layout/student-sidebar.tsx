"use client";
// components/layout/student-sidebar.tsx

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/auth/types";
import { signOut } from "@/lib/auth/client";
import {
  LayoutDashboard, DollarSign, Receipt, UserCircle,
  ChevronLeft, Menu, LogOut, BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Ledger",  href: "/student/ledger",   icon: DollarSign      },
  { label: "Receipts",   href: "/student/receipts",  icon: Receipt         },
  { label: "Exam Fees",  href: "/student/payments",  icon: BookOpen        },
  { label: "Profile",    href: "/student/profile",   icon: UserCircle      },
];

export function StudentSidebar({ session }: { session: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const initials = session.name
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/student-login");
          router.refresh();
        },
      },
    });
  }

  return (
    <aside className={cn(
      "flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-55"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
            <div>
              <p className="font-semibold text-xs tracking-tight leading-none">SchoolOS</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Student Portal</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("size-8 shrink-0", collapsed && "mx-auto")}
        >
          {collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && "text-indigo-600")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Student info footer */}
      <div className="border-t p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2", collapsed && "justify-center")}>
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{session.name}</p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">
                {session.username}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive shrink-0"
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
