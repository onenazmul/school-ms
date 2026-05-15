"use client";
// lib/queries/index.ts
// Phase 2 will replace these with SWR hooks pointing to /api/v1/* routes.
// For now, tokens return undefined — queries fail gracefully against the old API.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";

export const QK = {
  students:     ["students"]       as const,
  student:      (id: string)       => ["students", id]           as const,
  studentLedger:(id: string)       => ["students", id, "ledger"] as const,
  teachers:     ["teachers"]       as const,
  teacher:      (id: string)       => ["teachers", id]           as const,
  feeConfigs:   ["fee-configs"]    as const,
  bills:        ["bills"]          as const,
  bill:         (id: string)       => ["bills", id]              as const,
  receipts:     ["receipts"]       as const,
  receipt:      (id: string)       => ["receipts", id]           as const,
  ledger:       (f?: object)       => ["ledger", f]              as const,
  adminStats:   ["admin-stats"]    as const,
  studentStats: ["student-stats"]  as const,
  teacherStats: ["teacher-stats"]  as const,
  myLedger:     ["my-ledger"]      as const,
  myReceipts:   ["my-receipts"]    as const,
};

// Tokens removed — Phase 2 replaces API calls with own /api/v1/* routes
function useStaffToken(): string | undefined { return undefined; }
function useStudentToken(): string | undefined { return undefined; }

// ── Admin: Students ──────────────────────────────────────────────────────────

export function useStudents(params?: Record<string, string>) {
  const token = useStaffToken();
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery({ queryKey: [...QK.students, params], queryFn: () => api.get<any>(EP.STUDENTS + qs, token), enabled: !!token });
}

export function useStudent(id: string) {
  const token = useStaffToken();
  return useQuery({ queryKey: QK.student(id), queryFn: () => api.get<any>(EP.STUDENT(id), token), enabled: !!token && !!id });
}

export function useStudentLedgerAdmin(id: string) {
  const token = useStaffToken();
  return useQuery({ queryKey: QK.studentLedger(id), queryFn: () => api.get<any>(EP.STUDENT_LEDGER(id), token), enabled: !!token && !!id });
}

// ── Student portal ───────────────────────────────────────────────────────────

export function useMyLedger(filters?: Record<string, string>) {
  const token = useStudentToken();
  const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
  return useQuery({ queryKey: [...QK.myLedger, filters], queryFn: () => api.get<any>(EP.LEDGER + qs, token), enabled: !!token });
}

export function useMyReceipts(filters?: Record<string, string>) {
  const token = useStudentToken();
  const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
  return useQuery({ queryKey: [...QK.myReceipts, filters], queryFn: () => api.get<any>(EP.RECEIPTS + qs, token), enabled: !!token });
}

export function useStudentStats() {
  const token = useStudentToken();
  return useQuery({ queryKey: QK.studentStats, queryFn: () => api.get<any>(EP.STUDENT_STATS, token), enabled: !!token });
}

// ── Fee Configs ──────────────────────────────────────────────────────────────

export function useFeeConfigs() {
  const token = useStaffToken();
  return useQuery({ queryKey: QK.feeConfigs, queryFn: () => api.get<any>(EP.FEE_CONFIGS, token), enabled: !!token });
}

export function useCreateFeeConfig() {
  const token = useStaffToken(); const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>(EP.FEE_CONFIGS, data, token),
    onMutate: async (newConfig) => {
      await qc.cancelQueries({ queryKey: QK.feeConfigs });
      const prev = qc.getQueryData(QK.feeConfigs);
      qc.setQueryData(QK.feeConfigs, (old: any) => ({ ...old, data: [...(old?.data ?? []), { id: `opt-${Date.now()}`, ...newConfig }] }));
      return { prev };
    },
    onError:   (_e, _v, ctx) => ctx?.prev && qc.setQueryData(QK.feeConfigs, ctx.prev),
    onSettled: ()             => qc.invalidateQueries({ queryKey: QK.feeConfigs }),
  });
}

export function useUpdateFeeConfig(id: string) {
  const token = useStaffToken(); const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put<any>(EP.FEE_CONFIG(id), data, token),
    onMutate: async (updated) => {
      await qc.cancelQueries({ queryKey: QK.feeConfigs });
      const prev = qc.getQueryData(QK.feeConfigs);
      qc.setQueryData(QK.feeConfigs, (old: any) => ({ ...old, data: old?.data?.map((f: any) => f.id === id ? { ...f, ...updated } : f) }));
      return { prev };
    },
    onError:   (_e, _v, ctx) => ctx?.prev && qc.setQueryData(QK.feeConfigs, ctx.prev),
    onSettled: ()             => qc.invalidateQueries({ queryKey: QK.feeConfigs }),
  });
}

export function useDeleteFeeConfig() {
  const token = useStaffToken(); const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(EP.FEE_CONFIG(id), token),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.feeConfigs });
      const prev = qc.getQueryData(QK.feeConfigs);
      qc.setQueryData(QK.feeConfigs, (old: any) => ({ ...old, data: old?.data?.filter((f: any) => f.id !== id) }));
      return { prev };
    },
    onError:   (_e, _v, ctx) => ctx?.prev && qc.setQueryData(QK.feeConfigs, ctx.prev),
    onSettled: ()             => qc.invalidateQueries({ queryKey: QK.feeConfigs }),
  });
}

// ── Bills ────────────────────────────────────────────────────────────────────

export function useBills(filters?: Record<string, string>) {
  const token = useStaffToken();
  const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
  return useQuery({ queryKey: [...QK.bills, filters], queryFn: () => api.get<any>(EP.BILLS + qs, token), enabled: !!token });
}

export function useBulkBilling() {
  const token = useStaffToken(); const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>(EP.BULK_BILLING, data, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.bills }); qc.invalidateQueries({ queryKey: QK.ledger() }); },
  });
}

// ── Receipts ─────────────────────────────────────────────────────────────────

export function useReceipts(filters?: Record<string, string>) {
  const token = useStaffToken();
  const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
  return useQuery({ queryKey: [...QK.receipts, filters], queryFn: () => api.get<any>(EP.RECEIPTS + qs, token), enabled: !!token });
}

export function useCreateReceipt() {
  const token = useStaffToken(); const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>(EP.RECEIPTS, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.receipts });
      qc.invalidateQueries({ queryKey: QK.bills });
      qc.invalidateQueries({ queryKey: QK.ledger() });
    },
  });
}

// ── Ledger (admin) ───────────────────────────────────────────────────────────

export function useLedger(filters?: Record<string, string>) {
  const token = useStaffToken();
  const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
  return useQuery({ queryKey: QK.ledger(filters), queryFn: () => api.get<any>(EP.LEDGER + qs, token), enabled: !!token });
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export function useAdminStats() {
  const token = useStaffToken();
  return useQuery({ queryKey: QK.adminStats, queryFn: () => api.get<any>(EP.ADMIN_STATS, token), enabled: !!token, refetchInterval: 60_000 });
}

export function useTeacherStats() {
  const token = useStaffToken();
  return useQuery({ queryKey: QK.teacherStats, queryFn: () => api.get<any>(EP.TEACHER_STATS, token), enabled: !!token });
}
