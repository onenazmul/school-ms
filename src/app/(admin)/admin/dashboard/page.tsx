"use client";
// app/(admin)/admin/dashboard/page.tsx

import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, Users, DollarSign, AlertTriangle,
  CheckCircle2, Clock, ClipboardList, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_students: number;
  new_students_this_month: number;
  total_teachers: number;
  pending_admissions: number;
  monthly_revenue: number;
  ytd_revenue: number;
  outstanding_dues: number;
  overdue_count: number;
  pending_verifications: number;
  collection_rate: number;
}

interface Activity {
  id: number;
  module: string;
  action: string;
  description: string;
  actor_name: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function activityIcon(module: string) {
  switch (module) {
    case "payment": case "fee": return { Icon: CheckCircle2, cls: "bg-green-50 text-green-600" };
    case "admission": case "student": return { Icon: GraduationCap, cls: "bg-indigo-50 text-indigo-600" };
    default: return { Icon: Clock, cls: "bg-amber-50 text-amber-600" };
  }
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, sub, color = "indigo", loading }: {
  label: string; value: string | number; icon: React.ElementType;
  sub?: string; color?: string; loading?: boolean;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green:  "bg-green-50 text-green-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading
              ? <Skeleton className="h-7 w-20 mt-1" />
              : <p className="text-2xl font-semibold">{value}</p>}
            {sub && !loading && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("size-10 rounded-xl flex items-center justify-center", colors[color])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<{ stats: DashboardStats; recent_activity: Activity[] }>({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetch("/api/v1/admin/dashboard").then((r) => r.json()),
    refetchInterval: 60_000,
  });

  const stats = data?.stats;
  const activity = data?.recent_activity ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview for {new Date().toLocaleDateString("en-BD", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students" icon={GraduationCap} loading={isLoading}
          value={stats?.total_students.toLocaleString() ?? "—"}
          sub={stats ? `+${stats.new_students_this_month} this month` : undefined}
        />
        <StatCard
          label="Teachers" icon={Users} loading={isLoading}
          value={stats?.total_teachers ?? "—"}
          sub="Active staff"
        />
        <StatCard
          label="Monthly Revenue" icon={DollarSign} color="green" loading={isLoading}
          value={stats ? `৳${(stats.monthly_revenue / 1000).toFixed(0)}k` : "—"}
          sub={stats ? `${stats.collection_rate}% collection rate` : undefined}
        />
        <StatCard
          label="Pending Dues" icon={AlertTriangle} color="amber" loading={isLoading}
          value={stats ? `৳${(stats.outstanding_dues / 1000).toFixed(0)}k` : "—"}
          sub={stats ? `${stats.overdue_count} students overdue` : undefined}
        />
      </div>

      {/* Lower grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-2">
                    <Skeleton className="size-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-3 w-10 shrink-0" />
                  </div>
                ))
              : activity.length === 0
              ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
              )
              : activity.map((a) => {
                  const { Icon, cls } = activityIcon(a.module);
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", cls)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground">by {a.actor_name ?? "System"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.created_at)}</span>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Alerts */}
          {!isLoading && stats && (stats.pending_admissions > 0 || stats.pending_verifications > 0) && (
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.pending_admissions > 0 && (
                  <a href="/admin/admissions" className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 hover:bg-indigo-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                      <ClipboardList className="size-3.5" />
                      Pending admissions
                    </div>
                    <Badge className="bg-indigo-600 text-white text-xs">{stats.pending_admissions}</Badge>
                  </a>
                )}
                {stats.pending_verifications > 0 && (
                  <a href="/admin/admissions/payments" className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 hover:bg-amber-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Clock className="size-3.5" />
                      Payment verifications
                    </div>
                    <Badge className="bg-amber-600 text-white text-xs">{stats.pending_verifications}</Badge>
                  </a>
                )}
                {stats.overdue_count > 0 && (
                  <a href="/admin/finance/overview?status=overdue" className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="size-3.5" />
                      Overdue bills
                    </div>
                    <Badge className="bg-red-600 text-white text-xs">{stats.overdue_count}</Badge>
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="size-4" />Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Generate Monthly Bills", href: "/admin/finance/bulk-billing", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
                { label: "Create Receipt",         href: "/admin/finance/receipts",     color: "bg-green-600 hover:bg-green-700 text-white" },
                { label: "Add Student",            href: "/admin/students/new",         color: "bg-slate-900 hover:bg-slate-800 text-white" },
                { label: "Fee Overview",           href: "/admin/finance/overview",     color: "border hover:bg-muted" },
              ].map((a) => (
                <a key={a.label} href={a.href}
                  className={cn("block w-full text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors", a.color)}>
                  {a.label}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
