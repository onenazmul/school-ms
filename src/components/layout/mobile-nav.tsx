"use client";
// components/layout/mobile-nav.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/admin-client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, GraduationCap, DollarSign, Receipt, Users,
  BookOpen, ListTodo, UserCircle, Settings,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

const MOBILE_NAV: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard",        icon: LayoutDashboard },
    { label: "Students",  href: "/admin/students",         icon: GraduationCap   },
    { label: "Finance",   href: "/admin/finance/ledger",   icon: DollarSign      },
    { label: "Receipts",  href: "/admin/finance/receipts", icon: Receipt         },
    { label: "Settings",  href: "/admin/settings",         icon: Settings        },
  ],
  teacher: [
    { label: "Dashboard",   href: "/teacher/dashboard",   icon: LayoutDashboard },
    { label: "Classes",     href: "/teacher/classes",     icon: BookOpen        },
    { label: "Students",    href: "/teacher/students",    icon: Users           },
    { label: "Attendance",  href: "/teacher/attendance",  icon: ListTodo        },
  ],
  student: [
    { label: "Home",      href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Ledger",    href: "/student/ledger",    icon: DollarSign      },
    { label: "Receipts",  href: "/student/receipts",  icon: Receipt         },
    { label: "Profile",   href: "/student/profile",   icon: UserCircle      },
  ],
};

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Fall back to pathname-derived role when session is null (DEV_OPEN_STAFF mode)
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

  const items = MOBILE_NAV[role] ?? [];

  if (!items.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="flex items-stretch">
        {items.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                active ? "text-indigo-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "text-indigo-600")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
