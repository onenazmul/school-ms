"use client";
// components/layout/student-mobile-nav.tsx

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, DollarSign, Receipt, UserCircle, CreditCard, MoreHorizontal,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PINNED = [
  { label: "Home",     href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Ledger",   href: "/student/ledger",    icon: DollarSign      },
  { label: "Receipts", href: "/student/receipts",  icon: Receipt         },
  { label: "Profile",  href: "/student/profile",   icon: UserCircle      },
];

// Grows as new student features are added (results, exams, attendance, etc.)
const MORE = [
  { label: "Payments", href: "/student/payments", icon: CreditCard },
];

export function StudentMobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();

  const moreActive = MORE.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
        <div className="flex items-stretch">
          {PINNED.map((item) => {
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
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-sm font-semibold">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-6">
            {MORE.map((item) => {
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
    </>
  );
}
