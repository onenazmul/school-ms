"use client";
// app/(student)/student/profile/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { authClient } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Pencil, Loader2, Mail, Phone, MapPin, BookOpen, AlertCircle,
  User, GraduationCap, Home,
} from "lucide-react";

const pwSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(8, "Min. 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StudentProfile = {
  name_en: string;
  name_bn: string | null;
  email: string | null;
  username: string | null;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  academic_year: string;
  session_name: string | null;
  status: string;
  enrolled_at: string;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  nationality: string | null;
  birth_certificate_no: string | null;
  present_village: string | null;
  present_post: string | null;
  present_upazilla: string | null;
  present_zilla: string | null;
  guardian_name: string | null;
  guardian_mobile: string | null;
  guardian_relation: string | null;
  father_name: string | null;
  father_mobile: string | null;
  mother_name: string | null;
  mother_mobile: string | null;
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-dashed last:border-0 gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function StudentProfilePage() {
  const { data: __sd, isPending: sessionLoading } = useSession();
  const session = __sd?.user as any;

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [changingPw, setChangingPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!session?.id || sessionLoading) return;
    fetch("/api/v1/student/me")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Could not load profile");
        return r.json();
      })
      .then((data) => setProfile(data.student))
      .catch((err) => toast.error(err.message ?? "Could not load profile"))
      .finally(() => setFetching(false));
  }, [session, sessionLoading]);

  const pwForm = useForm({
    resolver: zodResolver(pwSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onChangePw(values: z.infer<typeof pwSchema>) {
    setPwLoading(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: false,
      });
      if (result.error) throw new Error(result.error.message ?? "Password change failed");
      toast.success("Password changed successfully");
      setChangingPw(false);
      pwForm.reset();
    } catch (err: any) {
      toast.error(err.message ?? "Password change failed");
    } finally {
      setPwLoading(false);
    }
  }

  if (sessionLoading || fetching) {
    return (
      <div className="space-y-5 max-w-2xl">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center space-y-3 max-w-2xl mt-4">
        <AlertCircle className="size-7 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Could not load profile.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const initials = profile.name_en.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const classLabel = `Class ${profile.class_name}${profile.section ? ` (${profile.section})` : ""}`;
  const fullAddress = [
    profile.present_village,
    profile.present_post ? `Post: ${profile.present_post}` : null,
    profile.present_upazilla,
    profile.present_zilla,
  ].filter(Boolean).join(", ");

  const statusColors: Record<string, string> = {
    active:    "bg-green-50 text-green-700 border-green-200",
    inactive:  "bg-slate-50 text-slate-600 border-slate-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
    graduated: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-semibold">My Profile</h1>

      {/* ── Identity card ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl font-semibold bg-indigo-50 text-indigo-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold leading-tight">{profile.name_en}</h2>
              {profile.name_bn && (
                <p className="text-sm text-muted-foreground mt-0.5">{profile.name_bn}</p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {classLabel}
                {profile.roll_number ? ` · Roll ${profile.roll_number}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[profile.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
                >
                  {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                </Badge>
                {profile.username && (
                  <Badge variant="outline" className="text-xs font-mono">
                    @{profile.username}
                  </Badge>
                )}
                {profile.blood_group && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                    {profile.blood_group}
                  </Badge>
                )}
                {profile.academic_year && (
                  <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                    {profile.academic_year}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Mail,         label: "Email",    value: profile.email ?? "—" },
              { icon: Phone,        label: "Contact",  value: profile.guardian_mobile ?? profile.father_mobile ?? "—" },
              { icon: MapPin,       label: "District", value: profile.present_zilla ?? "—" },
              { icon: BookOpen,     label: "Enrolled", value: new Date(profile.enrolled_at).toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" }) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <item.icon className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Academic details ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Academic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <DetailRow label="Class"         value={classLabel} />
          <DetailRow label="Roll Number"   value={profile.roll_number} />
          <DetailRow label="Academic Year" value={profile.academic_year} />
          <DetailRow label="Session"       value={profile.session_name} />
          <DetailRow label="Status"        value={profile.status.charAt(0).toUpperCase() + profile.status.slice(1)} />
          <DetailRow
            label="Enrollment Date"
            value={new Date(profile.enrolled_at).toLocaleDateString("en-BD", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          />
        </CardContent>
      </Card>

      {/* ── Personal details ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Personal Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <DetailRow
            label="Date of Birth"
            value={profile.dob
              ? new Date(profile.dob).toLocaleDateString("en-BD", {
                  day: "2-digit", month: "long", year: "numeric",
                })
              : null}
          />
          <DetailRow label="Gender"              value={profile.gender} />
          <DetailRow label="Blood Group"         value={profile.blood_group} />
          <DetailRow label="Nationality"         value={profile.nationality} />
          <DetailRow label="Birth Certificate"   value={profile.birth_certificate_no} />
          <DetailRow label="Address"             value={fullAddress || null} />
        </CardContent>
      </Card>

      {/* ── Family & guardian ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Home className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Family Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          {/* Guardian */}
          {(profile.guardian_name || profile.guardian_relation) && (
            <>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Guardian</p>
              <DetailRow label="Name"     value={profile.guardian_name} />
              <DetailRow label="Relation" value={profile.guardian_relation} />
              <DetailRow label="Mobile"   value={profile.guardian_mobile} />
            </>
          )}

          {/* Father */}
          {profile.father_name && (
            <>
              <p className={`text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 ${profile.guardian_name ? "mt-3" : ""}`}>
                Father
              </p>
              <DetailRow label="Name"   value={profile.father_name} />
              <DetailRow label="Mobile" value={profile.father_mobile} />
            </>
          )}

          {/* Mother */}
          {profile.mother_name && (
            <>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-3 mb-1">Mother</p>
              <DetailRow label="Name"   value={profile.mother_name} />
              <DetailRow label="Mobile" value={profile.mother_mobile} />
            </>
          )}

          {/* Fallback if no family info at all */}
          {!profile.guardian_name && !profile.father_name && !profile.mother_name && (
            <p className="text-sm text-muted-foreground py-2">No family information on record.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Change password ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Password</CardTitle>
            {!changingPw && (
              <Button
                variant="ghost" size="sm" className="text-xs h-7 gap-1.5"
                onClick={() => setChangingPw(true)}
              >
                <Pencil className="size-3" />Change
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {changingPw ? (
            <Form {...pwForm}>
              <form onSubmit={pwForm.handleSubmit(onChangePw)} className="space-y-3">
                <FormField control={pwForm.control} name="currentPassword" render={({ field }) => (
                  <FormItem><FormLabel>Current Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={pwForm.control} name="newPassword" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={pwForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <div className="flex gap-2">
                  <Button
                    type="button" variant="outline" className="flex-1"
                    onClick={() => { setChangingPw(false); pwForm.reset(); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={pwLoading}>
                    {pwLoading && <Loader2 className="size-4 mr-2 animate-spin" />}Update
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <p className="text-sm text-muted-foreground">••••••••••••</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
