"use client";
// app/(admin)/admin/reports/page.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, Users, DollarSign, GraduationCap, BarChart2 } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLLECTION_DATA = [82,78,91,88,94,0,0,0,0,0,0,0]; // % collected per month
const REVENUE_DATA    = [980000,920000,1050000,1010000,1245000,0,0,0,0,0,0,0];

const CLASS_SUMMARY = [
  { class:"6",  sections:2, students:80,  collectionRate:92, outstanding:44000 },
  { class:"7",  sections:2, students:86,  collectionRate:89, outstanding:52300 },
  { class:"8",  sections:2, students:83,  collectionRate:95, outstanding:23100 },
  { class:"9",  sections:2, students:100, collectionRate:87, outstanding:71500 },
  { class:"10", sections:2, students:108, collectionRate:82, outstanding:107640 },
];

const QUICK_REPORTS = [
  { label:"Monthly Collection Report",   desc:"Fee collection summary by class/month",  icon:DollarSign,    color:"indigo" },
  { label:"Student Strength Report",     desc:"Enrollment by class, section, gender",   icon:GraduationCap, color:"violet" },
  { label:"Outstanding Dues Report",     desc:"Students with pending balances",          icon:TrendingDown,  color:"red" },
  { label:"Attendance Summary",          desc:"Class-wise attendance for selected period", icon:BarChart2,   color:"green" },
];

function MiniBar({ value, max, color="bg-indigo-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

export default function ReportsPage() {
  const [year, setYear] = useState("2025");
  const maxRevenue = Math.max(...REVENUE_DATA.filter(v=>v>0));
  const currentMonth = new Date().getMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports &amp; Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">School-wide performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2025","2024","2023"].map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <Download className="size-3.5" />Export All
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total Revenue (YTD)", value:"৳52.1L", change:"+8.3%", up:true, icon:DollarSign },
          { label:"Collection Rate",     value:"87%",      change:"+2.1%", up:true, icon:TrendingUp  },
          { label:"Total Students",      value:"2,417",    change:"+5.2%", up:true, icon:Users        },
          { label:"Outstanding Dues",    value:"৳2.98L",  change:"+1.4%", up:false,icon:TrendingDown },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-semibold mt-0.5">{kpi.value}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? "text-green-600" : "text-red-600"}`}>
                      {kpi.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {kpi.change} vs last year
                    </div>
                  </div>
                  <div className="size-9 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Monthly revenue chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Monthly Revenue — {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-36">
              {REVENUE_DATA.map((val, i) => {
                const height = val > 0 ? Math.max((val / maxRevenue) * 100, 4) : 0;
                const isCurrent = i === currentMonth - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
                      <div
                        className={`w-full rounded-t-md transition-all ${val > 0 ? (isCurrent ? "bg-indigo-600" : "bg-indigo-200 group-hover:bg-indigo-400") : "bg-transparent"}`}
                        style={{ height: `${height}%` }}
                        title={val > 0 ? `৳${(val/1000).toFixed(0)}k` : ""}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-indigo-600 inline-block" />Current month</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-indigo-200 inline-block" />Past months</span>
            </div>
          </CardContent>
        </Card>

        {/* Collection rate by month */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Collection Rate by Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {COLLECTION_DATA.slice(0, 5).map((rate, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{MONTHS[i]}</span>
                  <span className={`font-medium ${rate >= 90 ? "text-green-600" : rate >= 80 ? "text-amber-600" : "text-red-600"}`}>{rate}%</span>
                </div>
                <MiniBar value={rate} max={100} color={rate >= 90 ? "bg-green-500" : rate >= 80 ? "bg-amber-500" : "bg-red-500"} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Class-wise summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Class-wise Collection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Class</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Sections</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Students</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-40">Collection Rate</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {CLASS_SUMMARY.map(row => (
                  <tr key={row.class} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-medium">Class {row.class}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{row.sections}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{row.students}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${row.collectionRate >= 90 ? "bg-green-500" : row.collectionRate >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                               style={{ width: `${row.collectionRate}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8">{row.collectionRate}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-red-600">
                      ৳{row.outstanding.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick report downloads */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Generate Reports</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {QUICK_REPORTS.map(r => {
            const Icon = r.icon;
            const colors: Record<string,string> = { indigo:"bg-indigo-50 text-indigo-600", violet:"bg-violet-50 text-violet-600", red:"bg-red-50 text-red-600", green:"bg-green-50 text-green-600" };
            return (
              <div key={r.label} className="flex items-center gap-3 rounded-xl border p-4 hover:shadow-sm transition-shadow">
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${colors[r.color]}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <Download className="size-3.5" />PDF
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
