"use client";
// app/(admin)/admin/settings/page.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, School, Calendar, Bell, Shield, Database } from "lucide-react";

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

type SectionKey = "school" | "academic" | "notifications" | "security";

const SECTIONS: { key: SectionKey; label: string; icon: any }[] = [
  { key: "school",        label: "School Info",      icon: School },
  { key: "academic",      label: "Academic Settings", icon: Calendar },
  { key: "notifications", label: "Notifications",     icon: Bell },
  { key: "security",      label: "Security",          icon: Shield },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-muted-foreground/30"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("school");
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [workingDays, setWorkingDays] = useState(["Sunday","Monday","Tuesday","Wednesday","Thursday"]);
  const [notifications, setNotifications] = useState({
    feeReminders:    true,
    admissionAlerts: true,
    attendanceDaily: false,
    smsEnabled:      false,
    emailEnabled:    true,
  });

  const schoolForm = useForm<SchoolInput>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "Bright Future School", address: "123 Education Road",
      city: "Sirajganj", phone: "01711000000", email: "info@brightfuture.edu.bd",
      website: "https://brightfuture.edu.bd", eiin: "123456", established: "1998",
    },
  });

  const academicForm = useForm<AcademicInput>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      academicYear: "2025", sessionStart: "2025-01-01", sessionEnd: "2025-12-31",
      gradingSystem: "gpa", workingDays: ["Sunday","Monday","Tuesday","Wednesday","Thursday"],
    },
  });

  async function saveSchool(values: SchoolInput) {
    setSavingSchool(true);
    await new Promise(r => setTimeout(r, 700));
    setSavingSchool(false);
    toast.success("School information updated");
  }

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
                <Form {...schoolForm}>
                  <form onSubmit={schoolForm.handleSubmit(saveSchool)} className="space-y-4">
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
                    <Button type="submit" disabled={savingSchool}>
                      {savingSchool && <Loader2 className="size-4 mr-2 animate-spin" />}Save Changes
                    </Button>
                  </form>
                </Form>
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

          {activeSection === "notifications" && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key: "feeReminders",    label: "Fee Due Reminders",        desc: "Notify students 3 days before fee due date" },
                  { key: "admissionAlerts", label: "New Admission Alerts",     desc: "Alert admin when a new application is submitted" },
                  { key: "attendanceDaily", label: "Daily Attendance Report",  desc: "Send daily attendance summary to admin" },
                  { key: "emailEnabled",    label: "Email Notifications",      desc: "Send notifications via email" },
                  { key: "smsEnabled",      label: "SMS Notifications",        desc: "Send notifications via SMS (extra charges apply)" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={v => {
                        setNotifications(prev => ({ ...prev, [item.key]: v }));
                        toast.success(`${item.label} ${v ? "enabled" : "disabled"}`);
                      }}
                    />
                  </div>
                ))}
                <Separator />
                <Button onClick={() => toast.success("Notification settings saved")}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

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
                      <ToggleSwitch checked={false} onChange={() => toast.info("Feature coming soon")} />
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
