"use client";
// components/layout/student-mobile-nav.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, DollarSign, Receipt, UserCircle } from "lucide-react";

const ITEMS = [
  { label: "Home",     href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Ledger",   href: "/student/ledger",    icon: DollarSign      },
  { label: "Receipts", href: "/student/receipts",   icon: Receipt         },
  { label: "Profile",  href: "/student/profile",    icon: UserCircle      },
];

export function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="flex items-stretch">
        {ITEMS.map(item => {
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
