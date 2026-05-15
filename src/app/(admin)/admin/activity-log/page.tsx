"use client";
// app/(admin)/admin/activity-log/page.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Filter } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LogEntry = {
  id: number;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string;
  description: string;
  metadata: unknown;
  created_at: string;
};

type LogsResponse = {
  logs: LogEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

// ── Module badge colors ───────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  admission: "bg-indigo-100 text-indigo-700 border-indigo-200",
  student:   "bg-green-100 text-green-700 border-green-200",
  payment:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  fee:       "bg-orange-100 text-orange-700 border-orange-200",
  exam:      "bg-purple-100 text-purple-700 border-purple-200",
  result:    "bg-pink-100 text-pink-700 border-pink-200",
  system:    "bg-gray-100 text-gray-700 border-gray-200",
};

const MODULES = [
  "all",
  "admission",
  "student",
  "payment",
  "fee",
  "exam",
  "result",
  "system",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ModuleBadge({ module }: { module: string }) {
  const cls = MODULE_COLORS[module] ?? MODULE_COLORS.system;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {module}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityLogPage() {
  const [module, setModule] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  // Build query string
  const buildQuery = () => {
    const p = new URLSearchParams();
    if (module && module !== "all") p.set("module", module);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", String(page));
    p.set("limit", "50");
    return p.toString();
  };

  const { data, isLoading, isFetching } = useQuery<LogsResponse>({
    queryKey: ["activity-log", module, from, to, page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/activity-log?${buildQuery()}`);
      if (!res.ok) throw new Error("Failed to fetch activity log");
      return res.json();
    },
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;
  const loading = isLoading || isFetching;

  function handleModuleChange(val: string) {
    setModule(val);
    setPage(1);
  }

  function handleFromChange(val: string) {
    setFrom(val);
    setPage(1);
  }

  function handleToChange(val: string) {
    setTo(val);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="size-5 text-indigo-600" />
            Activity Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit trail of all actions across the system
          </p>
        </div>
        {pagination && (
          <p className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString()} total entries
          </p>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
              <Filter className="size-3.5" />
              Filters
            </div>
            <Select value={module} onValueChange={handleModuleChange}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === "all" ? "All modules" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            {(module !== "all" || from || to) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setModule("all");
                  setFrom("");
                  setTo("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {loading ? "Loading…" : `${logs.length} entries`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground whitespace-nowrap">
                    Time
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                    Module
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                    Entity
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                    Actor
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground min-w-[240px]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading &&
                  [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                    </tr>
                  ))}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-muted-foreground"
                    >
                      <Activity className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No activity logs found</p>
                      {(module !== "all" || from || to) && (
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      )}
                    </td>
                  </tr>
                )}

                {!loading &&
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(log.created_at)}
                      </td>
                      <td className="py-2.5 px-4">
                        <ModuleBadge module={log.module} />
                      </td>
                      <td className="py-2.5 px-4">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          {log.action}
                        </code>
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        <span className="font-medium">{log.entity_type}</span>
                        <span className="text-muted-foreground"> #{log.entity_id}</span>
                        {log.entity_label && (
                          <div className="text-muted-foreground truncate max-w-[120px]">
                            {log.entity_label}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        {log.actor_name ? (
                          <>
                            <div className="font-medium">{log.actor_name}</div>
                            <div className="text-muted-foreground capitalize">
                              {log.actor_role}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground capitalize">
                            {log.actor_role}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-xs">
                        {log.description}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
