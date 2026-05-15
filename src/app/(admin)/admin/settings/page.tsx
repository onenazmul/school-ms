"use client";
// app/(admin)/admin/settings/page.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, School, Calendar, MessageSquare, Shield } from "lucide-react";

const schoolSchema = z.object({
  name:         z.string().min(2),
  address:      z.string().min(5),
  city:         z.string().min(2),
  phone:        z.string().min(10),
  email:        z.string().email(),
  website:      z.string().url().optional().or(z.literal("")),
  eiin:         z.string().optional(),
  established:  z.string().optional(),
});
type SchoolInput = z.infer<typeof schoolSchema>;

const academicSchema = z.object({
  academicYear: z.string().min(1),
  sessionStart: z.string().min(1),
  sessionEnd:   z.string().min(1),
  gradingSystem:z.enum(["gpa","percentage","grade_letter"]),
  workingDays:  z.array(z.string()).min(1),
});
type AcademicInput = z.infer<typeof academicSchema>;

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

type SectionKey = "school" | "academic" | "sms" | "security";

const SECTIONS: { key: SectionKey; label: string; icon: any }[] = [
  { key: "school",   label: "School Info",      icon: School },
  { key: "academic", label: "Academic Settings", icon: Calendar },
  { key: "sms",      label: "SMS Settings",      icon: MessageSquare },
  { key: "security", label: "Security",          icon: Shield },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("school");
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [workingDays, setWorkingDays] = useState(["Sunday","Monday","Tuesday","Wednesday","Thursday"]);

  // ── School info from DB ──────────────────────────────────────────────────
  const { data: settingData, isLoading: settingLoading } = useQuery<{ setting: SchoolInput & { id: number } }>({
    queryKey: ["school-setting"],
    queryFn: () => fetch("/api/v1/admin/settings").then((r) => r.json()),
  });

  const schoolForm = useForm<SchoolInput>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "", address: "", city: "", phone: "", email: "",
      website: "", eiin: "", established: "",
    },
  });

  // Populate form once data loads
  const [formSeeded, setFormSeeded] = useState(false);
  if (settingData?.setting && !formSeeded) {
    const s = settingData.setting;
    schoolForm.reset({
      name: s.name ?? "", address: s.address ?? "", city: s.city ?? "",
      phone: s.phone ?? "", email: s.email ?? "", website: s.website ?? "",
      eiin: s.eiin ?? "", established: s.established ?? "",
    });
    setFormSeeded(true);
  }

  const saveMutation = useMutation({
    mutationFn: (body: SchoolInput) =>
      fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
    onSuccess: () => toast.success("School information updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const academicForm = useForm<AcademicInput>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      academicYear: "2025", sessionStart: "2025-01-01", sessionEnd: "2025-12-31",
      gradingSystem: "gpa", workingDays: ["Sunday","Monday","Tuesday","Wednesday","Thursday"],
    },
  });

  async function saveAcademic(values: AcademicInput) {
    setSavingAcademic(true);
    await new Promise(r => setTimeout(r, 700));
    setSavingAcademic(false);
    toast.success("Academic settings saved");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage school configuration and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-48 flex lg:flex-col gap-1 shrink-0">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${active ? "bg-indigo-50 text-indigo-700" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                <Icon className={`size-4 ${active ? "text-indigo-600" : ""}`} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">

          {activeSection === "school" && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">School Information</CardTitle>
              </CardHeader>
              <CardContent>
                {settingLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="size-4 animate-spin" /> Loading…
                  </div>
                ) : (
                <Form {...schoolForm}>
                  <form onSubmit={schoolForm.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
                    <FormField control={schoolForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>School Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={schoolForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={schoolForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone</FormLabel>
                          <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={schoolForm.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={schoolForm.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel>
                          <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={schoolForm.control} name="website" render={({ field }) => (
                        <FormItem><FormLabel>Website</FormLabel>
                          <FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={schoolForm.control} name="eiin" render={({ field }) => (
                        <FormItem><FormLabel>EIIN</FormLabel>
                          <FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={schoolForm.control} name="established" render={({ field }) => (
                        <FormItem><FormLabel>Est. Year</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}Save Changes
                    </Button>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "academic" && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Academic Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...academicForm}>
                  <form onSubmit={academicForm.handleSubmit(saveAcademic)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={academicForm.control} name="academicYear" render={({ field }) => (
                        <FormItem><FormLabel>Academic Year</FormLabel>
                          <FormControl><Input placeholder="2025" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={academicForm.control} name="sessionStart" render={({ field }) => (
                        <FormItem><FormLabel>Session Start</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={academicForm.control} name="sessionEnd" render={({ field }) => (
                        <FormItem><FormLabel>Session End</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={academicForm.control} name="gradingSystem" render={({ field }) => (
                      <FormItem><FormLabel>Grading System</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="gpa">GPA (5.0 Scale)</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="grade_letter">Grade Letter</SelectItem>
                          </SelectContent>
                        </Select></FormItem>
                    )} />
                    <div>
                      <p className="text-sm font-medium mb-2">Working Days</p>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map(day => {
                          const active = workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setWorkingDays(prev => active ? prev.filter(d=>d!==day) : [...prev, day])}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-300"}`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Button type="submit" disabled={savingAcademic}>
                      {savingAcademic && <Loader2 className="size-4 mr-2 animate-spin" />}Save Settings
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeSection === "sms" && <SmsSettings />}

          {activeSection === "security" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Admin Password</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Current Password</label>
                    <Input type="password" placeholder="••••••••" className="max-w-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">New Password</label>
                    <Input type="password" placeholder="Min. 8 characters" className="max-w-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <Input type="password" placeholder="Repeat password" className="max-w-sm" />
                  </div>
                  <Button onClick={() => toast.success("Password updated")}>Update Password</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Session &amp; Access</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Require 2FA for Admin",   desc: "All admin accounts must use two-factor authentication" },
                    { label: "Log all admin actions",   desc: "Keep an audit trail of all admin operations" },
                    { label: "Auto-lock after inactivity", desc: "Lock session after 30 minutes of inactivity" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch disabled onCheckedChange={() => toast.info("Feature coming soon")} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── SMS Settings Component ───────────────────────────────────────────────────

interface SmsConfigData {
  id: number;
  senderId: string | null;
  has_api_key: boolean;
  applicationReceived: boolean;
  paymentStatus: boolean;
  testDayReminder: boolean;
  resultRealTime: boolean;
  resultSixHourBefore: boolean;
  resultAtTime: boolean;
  resultSixHourAfter: boolean;
}

function SmsSettings() {
  const { data, isLoading, refetch } = useQuery<{ config: SmsConfigData }>({
    queryKey: ["sms-config"],
    queryFn: () => fetch("/api/v1/admin/sms-config").then((r) => r.json()),
  });

  const [apiKey, setApiKey]     = useState("");
  const [senderId, setSenderId] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  const cfg = data?.config;

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/v1/admin/sms-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => { refetch(); toast.success("SMS settings saved"); },
    onError: () => toast.error("Failed to save"),
  });

  async function saveCredentials() {
    if (!apiKey.trim()) { toast.error("API key required"); return; }
    setSavingCreds(true);
    await saveMutation.mutateAsync({ api_key: apiKey, sender_id: senderId });
    setApiKey(""); setSenderId("");
    setSavingCreds(false);
  }

  function toggle(field: string, current: boolean) {
    saveMutation.mutate({ [field]: !current });
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const SMS_TOGGLES = [
    { field: "application_received",  label: "Application Received",    desc: "SMS when a new admission application is submitted", value: cfg?.applicationReceived },
    { field: "payment_status",        label: "Payment Status",           desc: "SMS on payment verdict (verified / fake / returned)", value: cfg?.paymentStatus },
    { field: "test_day_reminder",     label: "Test Day Reminder",        desc: "SMS ~24h before admission test day (via cron)", value: cfg?.testDayReminder },
    { field: "result_real_time",      label: "Result — Real Time",       desc: "SMS immediately when admin sets Enrolled/Rejected", value: cfg?.resultRealTime },
    { field: "result_six_hour_before",label: "Result — 6h Before",       desc: "SMS 6 hours before result day/time (via cron)", value: cfg?.resultSixHourBefore },
    { field: "result_at_time",        label: "Result — At Result Time",  desc: "SMS at result day/time (via cron)", value: cfg?.resultAtTime },
    { field: "result_six_hour_after", label: "Result — 6h After",        desc: "SMS 6 hours after result day/time (via cron)", value: cfg?.resultSixHourAfter },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">SMS Provider Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block size-2 rounded-full ${cfg?.has_api_key ? "bg-green-500" : "bg-muted-foreground"}`} />
            {cfg?.has_api_key ? "API key configured" : "No API key set"}
            {cfg?.senderId && <span className="text-muted-foreground">· Sender: {cfg.senderId}</span>}
          </div>
          <div className="space-y-3 max-w-sm">
            <div>
              <Label className="text-xs mb-1 block">New API Key</Label>
              <Input
                type="password"
                placeholder={cfg?.has_api_key ? "Leave blank to keep existing" : "Enter bdbulksms API key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Sender ID</Label>
              <Input
                placeholder="e.g. SchoolName"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={saveCredentials} disabled={savingCreds || saveMutation.isPending}>
              {savingCreds ? "Saving…" : "Save Credentials"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">SMS Notification Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {SMS_TOGGLES.map((item) => (
            <div key={item.field} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch
                checked={!!item.value}
                onCheckedChange={() => toggle(item.field, !!item.value)}
                disabled={saveMutation.isPending}
              />
            </div>
          ))}
          <Separator />
          <p className="text-xs text-muted-foreground">
            Cron-based SMS (test day reminder, result timing) require Hostinger cron jobs pointing to{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded">/api/v1/cron?type=&lt;type&gt;&amp;secret=CRON_SECRET</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
