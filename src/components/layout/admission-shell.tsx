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
  GraduationCap, LayoutDashboard, FileText, Receipt, LogOut,
} from "lucide-react";

const NAV = [
  { label: "Overview",     href: "/admission/dashboard",             icon: LayoutDashboard },
  { label: "Application",  href: "/admission/application",           icon: FileText        },
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
        <div className="flex-1 hidden sm:block">
          <AdmissionNav pathname={pathname} />
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

      {/* ── Mobile nav ── */}
      <nav className="sm:hidden border-b bg-background px-3 py-1.5 flex gap-1 overflow-x-auto print:hidden">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admission/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
