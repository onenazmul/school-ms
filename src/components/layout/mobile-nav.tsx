"use client";
// components/layout/mobile-nav.tsx

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, GraduationCap, DollarSign, Users, BookOpen, ListTodo,
  ClipboardList, Receipt, FileText, Settings, Wallet, Activity, Download,
  BarChart3, MoreHorizontal, CreditCard,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type NavItem = { label: string; href: string; icon: React.ElementType };

const PINNED: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard",  href: "/admin/dashboard",        icon: LayoutDashboard },
    { label: "Admissions", href: "/admin/admissions",       icon: ClipboardList   },
    { label: "Students",   href: "/admin/students",         icon: GraduationCap   },
    { label: "Finance",    href: "/admin/finance/overview", icon: DollarSign      },
  ],
  teacher: [
    { label: "Dashboard",  href: "/teacher/dashboard",   icon: LayoutDashboard },
    { label: "Classes",    href: "/teacher/classes",     icon: BookOpen        },
    { label: "Students",   href: "/teacher/students",    icon: Users           },
    { label: "Attendance", href: "/teacher/attendance",  icon: ListTodo        },
  ],
};

const MORE: Record<string, NavItem[]> = {
  admin: [
    { label: "Teachers",     href: "/admin/teachers",             icon: Users       },
    { label: "Classes",      href: "/admin/classes",              icon: BookOpen    },
    { label: "Exams",        href: "/admin/exams",                icon: FileText    },
    { label: "Fee Config",   href: "/admin/finance/fee-config",   icon: Settings    },
    { label: "Bulk Billing", href: "/admin/finance/bulk-billing", icon: ListTodo    },
    { label: "Ledger",       href: "/admin/finance/ledger",       icon: Wallet      },
    { label: "Receipts",     href: "/admin/finance/receipts",     icon: Receipt     },
    { label: "Payments",     href: "/admin/admissions/payments",  icon: CreditCard  },
    { label: "Documents",    href: "/admin/documents",            icon: Download    },
    { label: "Reports",      href: "/admin/reports",              icon: BarChart3   },
    { label: "Activity",     href: "/admin/activity-log",         icon: Activity    },
    { label: "Settings",     href: "/admin/settings",             icon: Settings    },
  ],
  teacher: [],
};

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname  = usePathname();
  const { data: session } = useSession();

  const sessionRole = (session?.user as any)?.role as string | undefined;
  const role: string =
    sessionRole ??
    (pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/teacher")
      ? "teacher"
      : "");

  const pinned = PINNED[role] ?? [];
  const more   = MORE[role]   ?? [];

  if (!pinned.length) return null;

  const moreActive = more.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
        <div className="flex items-stretch">
          {pinned.map((item) => {
            const Icon   = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                  active ? "text-indigo-600" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "text-indigo-600")} />
                {item.label}
              </Link>
            );
          })}

          {/* More button — only when there are overflow items */}
          {more.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                moreActive ? "text-indigo-600" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MoreHorizontal className={cn("size-5", moreActive && "text-indigo-600")} />
              More
            </button>
          )}
        </div>
      </nav>

      {more.length > 0 && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-sm font-semibold">More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-6">
              {more.map((item) => {
                const Icon   = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-medium text-center transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", active && "text-indigo-600")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
