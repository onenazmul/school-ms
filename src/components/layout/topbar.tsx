"use client";
// components/layout/topbar.tsx

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth/client";

function useBreadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    href: "/" + parts.slice(0, i + 1).join("/"),
    isCurrent: i === parts.length - 1,
  }));
}

export function Topbar() {
  const { data: session } = useSession();
  const crumbs = useBreadcrumb();
  const name = session?.user?.name ?? "";

  return (
    <header className="h-16 border-b bg-background flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Breadcrumb */}
      <nav className="flex-1 flex items-center gap-1 text-sm min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <span className="text-muted-foreground/50 shrink-0">/</span>
            )}
            <a
              href={crumb.href}
              className={
                crumb.isCurrent
                  ? "font-medium truncate"
                  : "text-muted-foreground hover:text-foreground transition-colors truncate"
              }
            >
              {crumb.label}
            </a>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="h-8 w-48 pl-8 text-sm bg-muted/50"
            placeholder="Search…"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8">
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-indigo-600 text-[9px] text-white flex items-center justify-center font-medium">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 border-b">
              <p className="font-medium text-sm">Notifications</p>
            </div>
            {[
              "Fee due for 45 students in Class 9",
              "New admission application received",
              "Monthly salary sheet ready for review",
            ].map((n) => (
              <DropdownMenuItem key={n} className="py-3 text-sm cursor-pointer">
                <span className="size-1.5 rounded-full bg-indigo-500 shrink-0 mt-0.5 mr-2" />
                {n}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
