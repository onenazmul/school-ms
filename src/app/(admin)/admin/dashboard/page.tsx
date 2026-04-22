"use client";
// app/(admin)/admin/dashboard/page.tsx

import { useAdminStats } from "@/lib/queries";
import {
  GraduationCap,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Mock data for demonstration (replace with real API data)
const MOCK_STATS = {
  totalStudents: 2417,
  totalTeachers: 184,
  monthlyRevenue: 1_245_000,
  pendingDues: 342_500,
  collectionRate: 87,
  newAdmissions: 12,
  overdueStudents: 45,
  paidThisMonth: 198,
};

const RECENT_ACTIVITY = [
  { type: "payment", student: "Rahim Uddin", class: "9A", amount: 5500, time: "2m ago" },
  { type: "admission", student: "Fatema Begum", class: "6B", amount: null, time: "18m ago" },
  { type: "overdue", student: "Karim Hossain", class: "10C", amount: 11000, time: "1h ago" },
  { type: "payment", student: "Nasrin Akter", class: "8A", amount: 5500, time: "2h ago" },
  { type: "payment", student: "Jamal Sheikh", class: "7B", amount: 5500, time: "3h ago" },
];

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color = "indigo",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`size-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  // const { data, isLoading } = useAdminStats();
  const stats = MOCK_STATS;

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
        <StatCard label="Total Students" value={stats.totalStudents.toLocaleString()} icon={GraduationCap} sub="+12 this month" />
        <StatCard label="Teachers" value={stats.totalTeachers} icon={Users} sub="Across all classes" />
        <StatCard
          label="Monthly Revenue"
          value={`৳${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
          icon={DollarSign}
          sub={`${stats.collectionRate}% collection rate`}
          color="green"
        />
        <StatCard
          label="Pending Dues"
          value={`৳${(stats.pendingDues / 1000).toFixed(0)}k`}
          icon={AlertTriangle}
          sub={`${stats.overdueStudents} students overdue`}
          color="amber"
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
            {RECENT_ACTIVITY.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    a.type === "payment"
                      ? "bg-green-50 text-green-600"
                      : a.type === "admission"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {a.type === "payment" ? (
                    <CheckCircle2 className="size-4" />
                  ) : a.type === "admission" ? (
                    <GraduationCap className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.student}</p>
                  <p className="text-xs text-muted-foreground">Class {a.class}</p>
                </div>
                {a.amount && (
                  <span className="text-sm font-medium shrink-0">
                    ৳{a.amount.toLocaleString()}
                  </span>
                )}
                {!a.amount && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    New
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground shrink-0">
                  {a.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Generate Monthly Bills", href: "/admin/finance/bulk-billing", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
              { label: "Create Receipt", href: "/admin/finance/receipts/new", color: "bg-green-600 hover:bg-green-700 text-white" },
              { label: "Add Student", href: "/admin/students/new", color: "bg-slate-900 hover:bg-slate-800 text-white" },
              { label: "Fee Configuration", href: "/admin/finance/fee-config", color: "border hover:bg-muted" },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className={`block w-full text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${a.color}`}
              >
                {a.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
