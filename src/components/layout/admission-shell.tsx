"use client";
// components/layout/admission-shell.tsx
// Lightweight shell for the admission portal (applicants, not yet enrolled students).

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/auth/types";
import { signOut } from "@/lib/auth/client";
import {
  GraduationCap, LayoutDashboard, FileText, Receipt, LogOut, ExternalLink,
} from "lucide-react";

const NAV = [
  { label: "Overview",     href: "/admission/dashboard",             icon: LayoutDashboard },
  { label: "My Application", href: "/admission/application",         icon: FileText        },
  { label: "Receipt",      href: "/admission/application/receipt",   icon: Receipt         },
];

function AdmissionNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex items-center gap-1">
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/admission/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdmissionShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const initials = session.name
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/apply/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* ── Topbar ── */}
      <header className="h-14 border-b bg-background flex items-center px-4 gap-4 print:hidden">
        {/* Logo */}
        <Link href="/admission/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            <GraduationCap className="size-4" />
          </div>
          <div className="hidden sm:block">
            <p className="font-semibold text-xs tracking-tight leading-none">SchoolOS</p>
            <p className="text-[10px] text-muted-foreground">Admission Portal</p>
          </div>
        </Link>

        {/* Nav */}
        <div className="flex-1 hidden sm:flex items-center gap-1">
          <AdmissionNav pathname={pathname} />
          <a
            href="/student/dashboard"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors ml-1"
          >
            <GraduationCap className="size-3.5 shrink-0" />
            Student Panel
            <ExternalLink className="size-3 opacity-60" />
          </a>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium leading-none">{session.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{session.username}</p>
          </div>
          <Avatar className="size-7">
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 print:hidden">
        <div className="flex items-stretch">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/admission/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                  active ? "text-indigo-600" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "text-indigo-600")} />
                {label}
              </Link>
            );
          })}
          <a
            href="/student/dashboard"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium text-indigo-600 transition-colors"
          >
            <GraduationCap className="size-5" />
            Student
          </a>
        </div>
      </nav>
    </div>
  );
}
