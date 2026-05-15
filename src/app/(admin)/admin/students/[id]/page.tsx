"use client";
// app/(admin)/admin/students/[id]/page.tsx

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Phone, MapPin, Receipt, Pencil, CheckCircle2,
  FileText, RefreshCw, ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Bill = {
  id: string;
  name: string;
  amount: number;
  late_fee: number;
  due_date: string;
  month: string | null;
  academic_year: string;
  status: string;
  created_at: string;
};

type ReceiptItem = { bill_id: string; bill_name: string; amount: number };

type StudentReceipt = {
  id: string;
  receipt_number: string;
  payment_method: string;
  received_amount: number;
  payment_date: string;
  created_by: string;
  notes: string | null;
  items: ReceiptItem[];
};

type StudentProfile = {
  id: string;
  admission_id: number;
  class_name: string;
  section: string | null;
  roll_number: string | null;
  academic_year: string;
  session_name: string | null;
  status: string;
  enrolled_at: string;
  username: string | null;
  email: string | null;
  name_en: string;
  name_bn: string | null;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  nationality: string | null;
  birth_certificate_no: string | null;
  photo: string | null;
  present_village: string | null;
  present_post: string | null;
  present_upazilla: string | null;
  present_zilla: string | null;
  present_post_code: string | null;
  guardian_name: string | null;
  guardian_mobile: string | null;
  guardian_relation: string | null;
  guardian_occupation: string | null;
  father_name: string | null;
  father_name_bn: string | null;
  father_mobile: string | null;
  mother_name: string | null;
  mother_name_bn: string | null;
  mother_mobile: string | null;
  previous_institute_name: string | null;
  bills: Bill[];
  receipts: StudentReceipt[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function statusColor(s: string) {
  switch (s) {
    case "Active":      return "bg-green-50 text-green-700 border-green-200";
    case "Inactive":    return "bg-slate-50 text-slate-500 border-slate-200";
    case "Graduated":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "Transferred": return "bg-orange-50 text-orange-700 border-orange-200";
    default:            return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function billStatusColor(s: string) {
  switch (s) {
    case "paid":    return "bg-green-50 text-green-700 border-green-200";
    case "partial": return "bg-amber-50 text-amber-700 border-amber-200";
    case "waived":  return "bg-blue-50 text-blue-700 border-blue-200";
    default:        return "bg-red-50 text-red-700 border-red-200";
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-dashed last:border-0">
      <span className="text-muted-foreground shrink-0 pr-3">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-start gap-5">
        <Skeleton className="size-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery<{ student: StudentProfile }>({
    queryKey: ["admin-student", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/students/${id}`);
      if (!res.ok) throw new Error("Failed to load student");
      return res.json();
    },
    staleTime: 30_000,
  });

  const student = data?.student;

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !student) {
    return (
      <div className="space-y-4">
        <Link href="/admin/students" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Students
        </Link>
        <div className="border rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Failed to load student profile.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = student.receipts.reduce((s, r) => s + r.received_amount, 0);
  const totalDue  = student.bills
    .filter((b) => b.status === "unpaid" || b.status === "partial")
    .reduce((s, b) => s + b.amount + b.late_fee, 0);

  const address = [student.present_village, student.present_post, student.present_upazilla, student.present_zilla]
    .filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/admin/students"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Students
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/admissions/${student.admission_id}`}>
              <ExternalLink className="size-3.5 mr-1.5" /> View Admission
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/students/${id}/edit`}>
              <Pencil className="size-3.5 mr-1.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 flex-wrap">
        <Avatar className="size-16 shrink-0">
          <AvatarFallback className="text-xl font-semibold bg-indigo-50 text-indigo-700">
            {initials(student.name_en)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{student.name_en}</h1>
            {student.name_bn && (
              <span className="text-sm text-muted-foreground">{student.name_bn}</span>
            )}
            <Badge variant="outline" className={statusColor(student.status)}>{student.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {student.class_name}
            {student.section ? ` · Section ${student.section}` : ""}
            {student.roll_number ? ` · Roll ${student.roll_number}` : ""}
            {student.username ? ` · ${student.username}` : ""}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {student.guardian_mobile && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="size-3" /> {student.guardian_mobile}
              </span>
            )}
            {address && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {address}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold">৳{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <p className={`text-2xl font-semibold ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
              ৳{totalDue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="bills">
            Bills
            {student.bills.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5">
                {student.bills.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="receipts">
            Receipts
            {student.receipts.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5">
                {student.receipts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="info" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Date of Birth"    value={fmtDate(student.dob)} />
                <InfoRow label="Gender"           value={student.gender} />
                <InfoRow label="Blood Group"      value={student.blood_group} />
                <InfoRow label="Nationality"      value={student.nationality} />
                <InfoRow label="Birth Cert. No."  value={student.birth_certificate_no} />
                <InfoRow label="Previous School"  value={student.previous_institute_name} />
                <InfoRow label="Academic Year"    value={student.academic_year} />
                <InfoRow label="Session"          value={student.session_name} />
                <InfoRow label="Enrolled"         value={fmtDate(student.enrolled_at)} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow label="Name"       value={student.guardian_name} />
                  <InfoRow label="Relation"   value={student.guardian_relation} />
                  <InfoRow label="Phone"      value={student.guardian_mobile} />
                  <InfoRow label="Occupation" value={student.guardian_occupation} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Parents</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow label="Father (EN)" value={student.father_name} />
                  <InfoRow label="Father (BN)" value={student.father_name_bn} />
                  <InfoRow label="Father Mobile" value={student.father_mobile} />
                  <InfoRow label="Mother (EN)" value={student.mother_name} />
                  <InfoRow label="Mother (BN)" value={student.mother_name_bn} />
                  <InfoRow label="Mother Mobile" value={student.mother_mobile} />
                </CardContent>
              </Card>
              {address && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Address</CardTitle></CardHeader>
                  <CardContent className="space-y-0">
                    <InfoRow label="Village"   value={student.present_village} />
                    <InfoRow label="Post"      value={student.present_post} />
                    <InfoRow label="Post Code" value={student.present_post_code} />
                    <InfoRow label="Upazilla"  value={student.present_upazilla} />
                    <InfoRow label="Zilla"     value={student.present_zilla} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills" className="mt-4">
          {student.bills.length === 0 ? (
            <div className="border rounded-xl py-14 text-center">
              <FileText className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">No bills generated yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground font-medium">
                    <th className="text-left py-3 px-4">Fee</th>
                    <th className="text-left py-3 px-4">Month</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-right py-3 px-4">Late Fee</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap">Due Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {student.bills.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium">{b.name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {b.month ?? b.academic_year}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        ৳{b.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-amber-600">
                        {b.late_fee > 0 ? `৳${b.late_fee.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtShort(b.due_date)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-xs capitalize ${billStatusColor(b.status)}`}>
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="mt-4">
          {student.receipts.length === 0 ? (
            <div className="border rounded-xl py-14 text-center">
              <Receipt className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">No receipts recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.receipts.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-medium text-sm">{r.receipt_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtShort(r.payment_date)} · {r.payment_method.replace("_", " ")}
                          {r.created_by && ` · by ${r.created_by}`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.items.map((item) => (
                            <span
                              key={item.bill_id}
                              className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                            >
                              {item.bill_name}
                              {r.items.length > 1 && ` ৳${item.amount.toLocaleString()}`}
                            </span>
                          ))}
                        </div>
                        {r.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">{r.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">
                          ৳{r.received_amount.toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="size-3 mr-1" /> Paid
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
