"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Trash2, CheckCircle2, Loader2, Save, X, Pencil,
  CalendarDays, DollarSign, ClipboardList, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassConfig {
  id: number;
  className: string;
  fee: number | null;
  enrollmentFeeAmount: number | null;
  testDay: string | null;
  testType: string | null;
  maxWrittenMarks: number | null;
  maxVivaMarks: number | null;
  resultDay: string | null;
}

interface AdmissionConfig {
  id: number;
  academicYear: string;
  isActive: boolean;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  feeMode: string;
  globalFee: number | null;
  globalTestDay: string | null;
  globalTestType: string | null;
  globalMaxWrittenMarks: number | null;
  globalMaxVivaMarks: number | null;
  resultDay: string | null;
  resultVisibility: string;
  marksThresholdEnabled: boolean;
  marksPassThreshold: number | null;
  marksThresholdAction: string;
  enrollmentFeeMode: string;
  enrollmentFeeRequired: boolean;
  enrollmentFeeAmount: number | null;
  classConfigs: ClassConfig[];
}

interface SchoolClass { id: number; name: string; isActive: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

const BLANK_FORM = {
  academic_year: String(new Date().getFullYear()),
  application_start_date: "",
  application_end_date: "",
  fee_mode: "same_for_all",
  global_fee: "",
  global_test_day: "",
  global_test_type: "",
  global_max_written_marks: "",
  global_max_viva_marks: "",
  result_day: "",
  result_visibility: "real_time",
  marks_threshold_enabled: false,
  marks_pass_threshold: "",
  marks_threshold_action: "flag_review",
  enrollment_fee_mode: "same_for_all",
  enrollment_fee_required: false,
  enrollment_fee_amount: "",
};
type ConfigForm = typeof BLANK_FORM;

const BLANK_CLASS_ROW = {
  class_name: "",
  fee: "",
  enrollment_fee_amount: "",
  test_day: "",
  test_type: "",
  max_written_marks: "",
  max_viva_marks: "",
  result_day: "",
};
type ClassRow = typeof BLANK_CLASS_ROW;

function cfgToForm(cfg: AdmissionConfig): ConfigForm {
  return {
    academic_year: cfg.academicYear,
    application_start_date: toLocal(cfg.applicationStartDate),
    application_end_date: toLocal(cfg.applicationEndDate),
    fee_mode: cfg.feeMode,
    global_fee: cfg.globalFee != null ? String(cfg.globalFee) : "",
    global_test_day: toLocal(cfg.globalTestDay),
    global_test_type: cfg.globalTestType ?? "",
    global_max_written_marks: cfg.globalMaxWrittenMarks != null ? String(cfg.globalMaxWrittenMarks) : "",
    global_max_viva_marks: cfg.globalMaxVivaMarks != null ? String(cfg.globalMaxVivaMarks) : "",
    result_day: toLocal(cfg.resultDay),
    result_visibility: cfg.resultVisibility,
    marks_threshold_enabled: cfg.marksThresholdEnabled,
    marks_pass_threshold: cfg.marksPassThreshold != null ? String(cfg.marksPassThreshold) : "",
    marks_threshold_action: cfg.marksThresholdAction,
    enrollment_fee_mode: cfg.enrollmentFeeMode,
    enrollment_fee_required: cfg.enrollmentFeeRequired,
    enrollment_fee_amount: cfg.enrollmentFeeAmount != null ? String(cfg.enrollmentFeeAmount) : "",
  };
}

function formToBody(f: ConfigForm): Record<string, unknown> {
  return {
    academic_year: f.academic_year,
    application_start_date: f.application_start_date || null,
    application_end_date: f.application_end_date || null,
    fee_mode: f.fee_mode,
    global_fee: f.global_fee !== "" ? Number(f.global_fee) : null,
    global_test_day: f.global_test_day || null,
    global_test_type: f.global_test_type || null,
    global_max_written_marks: f.global_max_written_marks !== "" ? Number(f.global_max_written_marks) : null,
    global_max_viva_marks: f.global_max_viva_marks !== "" ? Number(f.global_max_viva_marks) : null,
    result_day: f.result_day || null,
    result_visibility: f.result_visibility,
    marks_threshold_enabled: f.marks_threshold_enabled,
    marks_pass_threshold: f.marks_pass_threshold !== "" ? Number(f.marks_pass_threshold) : null,
    marks_threshold_action: f.marks_threshold_action,
    enrollment_fee_mode: f.enrollment_fee_mode,
    enrollment_fee_required: f.enrollment_fee_required,
    enrollment_fee_amount: f.enrollment_fee_amount !== "" ? Number(f.enrollment_fee_amount) : null,
  };
}

// ─── Field / Section helpers ──────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {icon} {title}
    </div>
  );
}

// ─── Inline Config Form ───────────────────────────────────────────────────────

function ConfigForm({
  form,
  onChange,
}: {
  form: ConfigForm;
  onChange: (f: ConfigForm) => void;
}) {
  const set = (patch: Partial<ConfigForm>) => onChange({ ...form, ...patch });

  return (
    <div className="space-y-6">
      {/* General */}
      <div>
        <SectionTitle icon={<CalendarDays className="size-3.5" />} title="General" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Academic Year">
            <Input
              value={form.academic_year}
              onChange={(e) => set({ academic_year: e.target.value })}
              placeholder="2026"
            />
          </Field>
          <Field label="Application Start">
            <Input
              type="datetime-local"
              value={form.application_start_date}
              onChange={(e) => set({ application_start_date: e.target.value })}
            />
          </Field>
          <Field label="Application End">
            <Input
              type="datetime-local"
              value={form.application_end_date}
              onChange={(e) => set({ application_end_date: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Admission Fee */}
      <div>
        <SectionTitle icon={<DollarSign className="size-3.5" />} title="Admission Fee" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Fee Mode">
            <Select value={form.fee_mode} onValueChange={(v) => set({ fee_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="same_for_all">Same fee for all classes</SelectItem>
                <SelectItem value="per_class">Set fee per class (see overrides below)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.fee_mode === "same_for_all" && (
            <Field label="Fee Amount (৳)">
              <Input
                type="number" min="0"
                value={form.global_fee}
                onChange={(e) => set({ global_fee: e.target.value })}
                placeholder="500"
              />
            </Field>
          )}
        </div>
        {form.fee_mode === "per_class" && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Save this config, then set each class&apos;s application fee in the{" "}
            <strong>Application Fee Overrides</strong> section at the bottom of this panel.
          </p>
        )}
      </div>

      <Separator />

      {/* Test */}
      <div>
        <SectionTitle icon={<ClipboardList className="size-3.5" />} title="Admission Test (optional)" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Test Date/Time">
            <Input
              type="datetime-local"
              value={form.global_test_day}
              onChange={(e) => set({ global_test_day: e.target.value })}
            />
          </Field>
          <Field label="Test Type">
            <Select
              value={form.global_test_type || "__none__"}
              onValueChange={(v) => set({ global_test_type: v === "__none__" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="written">Written only</SelectItem>
                <SelectItem value="viva">Viva only</SelectItem>
                <SelectItem value="both">Written + Viva</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Max Written Marks">
            <Input
              type="number" min="0"
              value={form.global_max_written_marks}
              onChange={(e) => set({ global_max_written_marks: e.target.value })}
              placeholder="100"
            />
          </Field>
          <Field label="Max Viva Marks">
            <Input
              type="number" min="0"
              value={form.global_max_viva_marks}
              onChange={(e) => set({ global_max_viva_marks: e.target.value })}
              placeholder="50"
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Result */}
      <div>
        <SectionTitle icon={<CalendarDays className="size-3.5" />} title="Result" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Result Date/Time">
            <Input
              type="datetime-local"
              value={form.result_day}
              onChange={(e) => set({ result_day: e.target.value })}
            />
          </Field>
          <Field label="Result Visibility">
            <Select value={form.result_visibility} onValueChange={(v) => set({ result_visibility: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="real_time">Real-time (show when updated)</SelectItem>
                <SelectItem value="result_day">Show only on result date/time</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <Separator />

      {/* Marks Threshold */}
      <div>
        <SectionTitle icon={<BarChart3 className="size-3.5" />} title="Marks Threshold" />
        <div className="flex items-center gap-3 mb-4">
          <Switch
            checked={form.marks_threshold_enabled}
            onCheckedChange={(v) => set({ marks_threshold_enabled: v })}
          />
          <Label className="text-sm">Enable auto pass/fail threshold</Label>
        </div>
        {form.marks_threshold_enabled && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pass Threshold (total marks)">
              <Input
                type="number" min="0"
                value={form.marks_pass_threshold}
                onChange={(e) => set({ marks_pass_threshold: e.target.value })}
                placeholder="e.g. 60"
              />
            </Field>
            <Field label="Action when threshold met">
              <Select value={form.marks_threshold_action} onValueChange={(v) => set({ marks_threshold_action: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flag_review">Flag as Approved (admin confirms)</SelectItem>
                  <SelectItem value="auto_enroll">Auto Enroll immediately</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </div>

      <Separator />

      {/* Enrollment Fee */}
      <div>
        <SectionTitle icon={<DollarSign className="size-3.5" />} title="Enrollment Fee" />
        <div className="flex items-center gap-3 mb-4">
          <Switch
            checked={form.enrollment_fee_required}
            onCheckedChange={(v) => set({ enrollment_fee_required: v })}
          />
          <Label className="text-sm">Require enrollment fee payment before creating student account</Label>
        </div>
        {form.enrollment_fee_required && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Fee Mode">
              <Select value={form.enrollment_fee_mode} onValueChange={(v) => set({ enrollment_fee_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_for_all">Same fee for all classes</SelectItem>
                  <SelectItem value="per_class">Set fee per class (see overrides below)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.enrollment_fee_mode === "same_for_all" && (
              <Field label="Enrollment Fee Amount (৳)">
                <Input
                  type="number" min="0"
                  value={form.enrollment_fee_amount}
                  onChange={(e) => set({ enrollment_fee_amount: e.target.value })}
                  placeholder="e.g. 2000"
                />
              </Field>
            )}
          </div>
        )}
        {form.enrollment_fee_required && form.enrollment_fee_mode === "per_class" && (
          <p className="mt-3 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-3 py-2">
            Save this config, then set each class&apos;s enrollment fee in the{" "}
            <strong>Enrollment Fee Overrides</strong> section at the bottom of this panel.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Class Override Row ───────────────────────────────────────────────────────

function ClassOverrideAddRow({
  configId,
  existingClasses,
  availableClasses,
  feeMode,
  enrollmentFeeMode,
  onDone,
}: {
  configId: number;
  existingClasses: string[];
  availableClasses: string[];
  feeMode: string;
  enrollmentFeeMode: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [row, setRow] = useState<ClassRow>({ ...BLANK_CLASS_ROW });
  const [saving, setSaving] = useState(false);

  const remaining = availableClasses.filter((n) => !existingClasses.includes(n));

  async function save() {
    if (!row.class_name) { toast.error("Select a class"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/admission-config/${configId}/class-configs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name: row.class_name,
          fee: row.fee !== "" ? Number(row.fee) : null,
          enrollment_fee_amount: row.enrollment_fee_amount !== "" ? Number(row.enrollment_fee_amount) : null,
          test_day: row.test_day || null,
          test_type: row.test_type || null,
          max_written_marks: row.max_written_marks !== "" ? Number(row.max_written_marks) : null,
          max_viva_marks: row.max_viva_marks !== "" ? Number(row.max_viva_marks) : null,
          result_day: row.result_day || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      qc.invalidateQueries({ queryKey: ["admission-configs"] });
      toast.success("Class override added");
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const set = (patch: Partial<ClassRow>) => setRow({ ...row, ...patch });

  if (remaining.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-3 py-2">
        All active classes already have overrides.
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">New class override</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className="text-xs">Class</Label>
          <Select value={row.class_name} onValueChange={(v) => set({ class_name: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {remaining.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className={`text-xs ${feeMode === "per_class" ? "text-amber-700 font-semibold" : ""}`}>
            App Fee (৳){feeMode === "per_class" ? " *" : ""}
          </Label>
          <Input
            className={`h-8 text-xs ${feeMode === "per_class" ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
            type="number" min="0"
            placeholder={feeMode === "per_class" ? "Required" : "—"}
            value={row.fee}
            onChange={(e) => set({ fee: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className={`text-xs ${enrollmentFeeMode === "per_class" ? "text-teal-700 font-semibold" : ""}`}>
            Enroll Fee (৳){enrollmentFeeMode === "per_class" ? " *" : ""}
          </Label>
          <Input
            className={`h-8 text-xs ${enrollmentFeeMode === "per_class" ? "border-teal-400 focus-visible:ring-teal-400" : ""}`}
            type="number" min="0"
            placeholder={enrollmentFeeMode === "per_class" ? "Required" : "—"}
            value={row.enrollment_fee_amount}
            onChange={(e) => set({ enrollment_fee_amount: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Test Date</Label>
          <Input className="h-8 text-xs" type="datetime-local" value={row.test_day} onChange={(e) => set({ test_day: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Test Type</Label>
          <Select value={row.test_type || "__none__"} onValueChange={(v) => set({ test_type: v === "__none__" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Inherit</SelectItem>
              <SelectItem value="written">Written</SelectItem>
              <SelectItem value="viva">Viva</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">W. Marks</Label>
          <Input className="h-8 text-xs" type="number" min="0" placeholder="—" value={row.max_written_marks} onChange={(e) => set({ max_written_marks: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">V. Marks</Label>
          <Input className="h-8 text-xs" type="number" min="0" placeholder="—" value={row.max_viva_marks} onChange={(e) => set({ max_viva_marks: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Result Day</Label>
          <Input className="h-8 text-xs" type="datetime-local" value={row.result_day} onChange={(e) => set({ result_day: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-3 mr-1 animate-spin" />} Add
        </Button>
      </div>
    </div>
  );
}

// ─── Single Config Panel ──────────────────────────────────────────────────────

function ConfigPanel({
  cfg,
  availableClasses,
  isNew,
  onCancelNew,
}: {
  cfg: AdmissionConfig | null;
  availableClasses: string[];
  isNew?: boolean;
  onCancelNew?: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(isNew ?? false);
  const [form, setForm] = useState<ConfigForm>(cfg ? cfgToForm(cfg) : { ...BLANK_FORM });
  const [showAddRow, setShowAddRow] = useState(false);
  const [deleteClassTarget, setDeleteClassTarget] = useState<{ id: number; configId: number } | null>(null);
  const [deleteConfig, setDeleteConfig] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = cfg ? `/api/v1/admin/admission-config/${cfg.id}` : "/api/v1/admin/admission-config";
      const res = await fetch(url, {
        method: cfg ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToBody(form)),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-configs"] });
      setEditing(false);
      if (isNew) onCancelNew?.();
      toast.success(cfg ? "Config saved" : "Config created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/v1/admin/admission-config/${cfg!.id}/activate`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-configs"] });
      toast.success("Config activated");
    },
    onError: () => toast.error("Failed to activate"),
  });

  const deleteConfigMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/v1/admin/admission-config/${cfg!.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-configs"] });
      setDeleteConfig(false);
      toast.success("Config deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const deleteClassMutation = useMutation({
    mutationFn: ({ id, configId }: { id: number; configId: number }) =>
      fetch(`/api/v1/admin/admission-config/${configId}/class-configs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-configs"] });
      setDeleteClassTarget(null);
      toast.success("Class override removed");
    },
    onError: () => toast.error("Failed to remove"),
  });

  const isEditable = editing || isNew;
  const existingClassNames = (cfg?.classConfigs ?? []).map((c) => c.className);

  return (
    <div className={`rounded-xl border bg-background ${cfg?.isActive ? "border-green-500 shadow-sm" : ""}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">
            {isNew ? "New Admission Config" : `${cfg!.academicYear} Admission Cycle`}
          </h3>
          {cfg && (
            cfg.isActive
              ? <Badge className="bg-green-600 text-white">Active</Badge>
              : <Badge variant="outline">Inactive</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cfg && !cfg.isActive && !isEditable && (
            <Button
              size="sm" variant="outline"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending
                ? <Loader2 className="size-3.5 animate-spin" />
                : <CheckCircle2 className="size-3.5 mr-1" />}
              Activate
            </Button>
          )}
          {cfg && !isEditable && (
            <Button size="sm" variant="outline" onClick={() => { setForm(cfgToForm(cfg)); setEditing(true); }}>
              <Pencil className="size-3.5 mr-1" /> Edit
            </Button>
          )}
          {cfg && !cfg.isActive && !isEditable && (
            <Button
              size="sm" variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteConfig(true)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {isEditable && (
            <>
              <Button
                size="sm" variant="outline"
                onClick={() => { setEditing(false); if (isNew) onCancelNew?.(); }}
              >
                <X className="size-3.5 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <Loader2 className="size-3.5 mr-1 animate-spin" />
                  : <Save className="size-3.5 mr-1" />}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Form or summary */}
      <div className="px-5 py-5">
        {isEditable ? (
          <ConfigForm form={form} onChange={setForm} />
        ) : cfg ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Application Window
              </p>
              <p className="font-medium">
                {cfg.applicationStartDate || cfg.applicationEndDate
                  ? `${fmt(cfg.applicationStartDate)} → ${fmt(cfg.applicationEndDate)}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <DollarSign className="size-3.5" /> Fee
              </p>
              <p className="font-medium">
                {cfg.feeMode === "per_class"
                  ? "Per class (see overrides)"
                  : cfg.globalFee != null ? `৳${cfg.globalFee}` : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <ClipboardList className="size-3.5" /> Test Day
              </p>
              <p className="font-medium">
                {cfg.globalTestDay
                  ? `${fmt(cfg.globalTestDay)} · ${cfg.globalTestType ?? "—"}`
                  : "No test"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Result
              </p>
              <p className="font-medium">
                {cfg.resultDay
                  ? `${fmt(cfg.resultDay)} · ${cfg.resultVisibility === "result_day" ? "On result day" : "Real-time"}`
                  : "Not set (real-time)"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <BarChart3 className="size-3.5" /> Marks Threshold
              </p>
              <p className="font-medium">
                {cfg.marksThresholdEnabled && cfg.marksPassThreshold != null
                  ? `Pass ≥ ${cfg.marksPassThreshold} → ${cfg.marksThresholdAction === "auto_enroll" ? "Auto Enroll" : "Flag for Review"}`
                  : "Not enabled"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <DollarSign className="size-3.5" /> Enrollment Fee
              </p>
              <p className="font-medium">
                {cfg.enrollmentFeeRequired
                  ? cfg.enrollmentFeeMode === "per_class"
                    ? "Required · Per class (see overrides)"
                    : cfg.enrollmentFeeAmount != null
                      ? `Required · ৳${cfg.enrollmentFeeAmount} (all classes)`
                      : "Required · Amount not set"
                  : "Not required"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Per-class overrides (only when config exists) */}
      {cfg && (
        <>
          <Separator />
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Per-Class Overrides</p>
              {!showAddRow && (
                <Button size="sm" variant="outline" onClick={() => setShowAddRow(true)}>
                  <Plus className="size-3.5 mr-1" /> Add Class
                </Button>
              )}
            </div>

            {showAddRow && (
              <ClassOverrideAddRow
                configId={cfg.id}
                existingClasses={existingClassNames}
                availableClasses={availableClasses}
                feeMode={cfg.feeMode}
                enrollmentFeeMode={cfg.enrollmentFeeMode}
                onDone={() => setShowAddRow(false)}
              />
            )}

            {cfg.classConfigs.length === 0 && !showAddRow ? (
              <p className="text-xs text-muted-foreground">
                No class overrides — global settings apply to all classes.
              </p>
            ) : cfg.classConfigs.length > 0 ? (
              <div className="space-y-4">
                {/* Application Fee sub-section */}
                {cfg.feeMode === "per_class" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                      <DollarSign className="size-3" /> Application Fee Overrides
                    </p>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-amber-50/60">
                            <th className="px-3 py-2 text-left font-medium">Class</th>
                            <th className="px-3 py-2 text-left font-medium">Application Fee (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cfg.classConfigs.map((cc) => (
                            <tr key={cc.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-2 font-medium">{cc.className}</td>
                              <td className="px-3 py-2">{cc.fee != null ? `৳${cc.fee}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Enrollment Fee sub-section */}
                {cfg.enrollmentFeeRequired && cfg.enrollmentFeeMode === "per_class" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide flex items-center gap-1">
                      <DollarSign className="size-3" /> Enrollment Fee Overrides
                    </p>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-teal-50/60">
                            <th className="px-3 py-2 text-left font-medium">Class</th>
                            <th className="px-3 py-2 text-left font-medium">Enrollment Fee (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cfg.classConfigs.map((cc) => (
                            <tr key={cc.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-2 font-medium">{cc.className}</td>
                              <td className="px-3 py-2">{cc.enrollmentFeeAmount != null ? `৳${cc.enrollmentFeeAmount}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Test & Result sub-section — only when at least one class has values */}
                {cfg.classConfigs.some((cc) =>
                  cc.testDay || cc.testType || cc.maxWrittenMarks != null || cc.maxVivaMarks != null || cc.resultDay
                ) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ClipboardList className="size-3" /> Test & Result Overrides
                    </p>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="px-3 py-2 text-left font-medium">Class</th>
                            <th className="px-3 py-2 text-left font-medium">Test Day</th>
                            <th className="px-3 py-2 text-left font-medium">Type</th>
                            <th className="px-3 py-2 text-left font-medium">W/V Marks</th>
                            <th className="px-3 py-2 text-left font-medium">Result Day</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {cfg.classConfigs.filter((cc) =>
                            cc.testDay || cc.testType || cc.maxWrittenMarks != null || cc.maxVivaMarks != null || cc.resultDay
                          ).map((cc) => (
                            <tr key={cc.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-2 font-medium">{cc.className}</td>
                              <td className="px-3 py-2">{cc.testDay ? fmt(cc.testDay) : "—"}</td>
                              <td className="px-3 py-2">{cc.testType ?? "—"}</td>
                              <td className="px-3 py-2">
                                {(cc.maxWrittenMarks != null || cc.maxVivaMarks != null)
                                  ? `W:${cc.maxWrittenMarks ?? "—"} V:${cc.maxVivaMarks ?? "—"}`
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">{cc.resultDay ? fmt(cc.resultDay) : "—"}</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => setDeleteClassTarget({ id: cc.id, configId: cfg.id })}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* Delete class confirm */}
      <AlertDialog
        open={deleteClassTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteClassTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove class override?</AlertDialogTitle>
            <AlertDialogDescription>Global settings will apply to this class.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteClassTarget && deleteClassMutation.mutate(deleteClassTarget)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete config confirm */}
      <AlertDialog open={deleteConfig} onOpenChange={setDeleteConfig}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this config?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this admission config and all its class overrides.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteConfigMutation.mutate()}
              disabled={deleteConfigMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdmissionSettingsPage() {
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery<{ configs: AdmissionConfig[] }>({
    queryKey: ["admission-configs"],
    queryFn: () => fetch("/api/v1/admin/admission-config").then((r) => r.json()),
  });
  const configs = data?.configs ?? [];

  const { data: classesData } = useQuery<{ classes: { id: number; name: string; isActive: boolean }[] }>({
    queryKey: ["school-classes"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const availableClasses = (classesData?.classes ?? [])
    .filter((c) => c.isActive)
    .map((c) => c.name);

  const active = configs.find((c) => c.isActive) ?? null;
  const inactive = configs.filter((c) => !c.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Admission Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage admission cycles, fees, test days, and result settings
          </p>
        </div>
        {!showNew && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="size-4" /> New Config
          </Button>
        )}
      </div>

      {showNew && (
        <ConfigPanel
          cfg={null}
          availableClasses={availableClasses}
          isNew
          onCancelNew={() => setShowNew(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : configs.length === 0 && !showNew ? (
        <div className="rounded-xl border bg-background p-10 text-center text-sm text-muted-foreground">
          No admission configs yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {active && (
            <ConfigPanel cfg={active} availableClasses={availableClasses} />
          )}
          {inactive.length > 0 && (
            <>
              {active && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pt-2">
                  Previous Cycles
                </p>
              )}
              {inactive.map((cfg) => (
                <ConfigPanel key={cfg.id} cfg={cfg} availableClasses={availableClasses} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
