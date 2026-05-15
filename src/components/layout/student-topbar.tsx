"use client";
// components/layout/student-topbar.tsx

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/lib/auth/types";
import { signOut } from "@/lib/auth/client";

function useBreadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    href: "/" + parts.slice(0, i + 1).join("/"),
    isCurrent: i === parts.length - 1,
  }));
}

export function StudentTopbar({ session }: { session: SessionUser }) {
  const router = useRouter();
  const crumbs = useBreadcrumb();

  const initials = session.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut({ fetchOptions: { onSuccess: () => { router.push("/student-login"); router.refresh(); } } });
  }

  return (
    <header className="h-16 border-b bg-background flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Breadcrumb */}
      <nav className="flex-1 flex items-center gap-1 text-sm min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && <span className="text-muted-foreground/50 shrink-0">/</span>}
            <a
              href={crumb.href}
              className={crumb.isCurrent
                ? "font-medium truncate"
                : "text-muted-foreground hover:text-foreground transition-colors truncate"}
            >
              {crumb.label}
            </a>
          </span>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications placeholder */}
        <Button variant="ghost" size="icon" className="size-8">
          <Bell className="size-4" />
        </Button>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors outline-none">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium leading-none">{session.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {session.username}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-medium">{session.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                @{session.username}
              </p>
            </div>
            <DropdownMenuItem asChild>
              <a href="/student/profile">My Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/student/ledger">Fee Ledger</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
