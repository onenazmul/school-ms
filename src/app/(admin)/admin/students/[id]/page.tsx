"use client";
// app/(admin)/admin/students/[id]/page.tsx

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, User, DollarSign, Receipt, Pencil, CheckCircle2, AlertCircle } from "lucide-react";

const MOCK_STUDENT = {
  id: "S001", name: "Rahim Uddin", email: "rahim@student.edu", phone: "01712345678",
  class: "9", section: "A", roll: "01", admissionNo: "BFS-2024-0127",
  dateOfBirth: "2010-03-15", gender: "Male", nationality: "Bangladeshi",
  religion: "Islam", bloodGroup: "B+",
  address: "House 12, Road 5, Sirajganj", city: "Sirajganj",
  guardianName: "Kamal Uddin", guardianRelation: "Father",
  guardianPhone: "01812345678", guardianOccupation: "Business",
  joiningDate: "2024-01-15", status: "active",
  previousSchool: "Sirajganj Govt. Primary",
};

const MOCK_LEDGER = [
  { id:"1", description:"Tuition Fee - May 2025", type:"bill", debit:5500, credit:0, balance:0, date:"2025-05-01", status:"paid" },
  { id:"2", description:"Payment received - Cash", type:"payment", debit:0, credit:5500, balance:0, date:"2025-05-07", status:"paid" },
  { id:"3", description:"Tuition Fee - Apr 2025", type:"bill", debit:5500, credit:0, balance:0, date:"2025-04-01", status:"paid" },
  { id:"4", description:"Payment received - bKash", type:"payment", debit:0, credit:5500, balance:0, date:"2025-04-06", status:"paid" },
  { id:"5", description:"Exam Fee - Q1 2025", type:"bill", debit:1200, credit:0, balance:0, date:"2025-03-01", status:"paid" },
  { id:"6", description:"Payment received - Cash", type:"payment", debit:0, credit:1200, balance:0, date:"2025-03-05", status:"paid" },
];

const MOCK_RECEIPTS = [
  { no:"RCP-001234", amount:5500, date:"2025-05-07", method:"Cash", bills:["Tuition - May 2025"] },
  { no:"RCP-001198", amount:5500, date:"2025-04-06", method:"bKash", bills:["Tuition - Apr 2025"] },
  { no:"RCP-001142", amount:1200, date:"2025-03-05", method:"Cash", bills:["Exam Fee Q1"] },
];

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const student = MOCK_STUDENT;

  function initials(name: string) {
    return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  }

  const totalPaid = MOCK_LEDGER.filter(e=>e.type==="payment").reduce((s,e)=>s+e.credit,0);

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/students" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />Back to Students
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/students/${id}/edit`}><Pencil className="size-3.5 mr-1.5" />Edit</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/admin/finance/receipts?student=${id}`}><Receipt className="size-3.5 mr-1.5" />New Receipt</Link>
          </Button>
        </div>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 flex-wrap">
        <Avatar className="size-16">
          <AvatarFallback className="text-xl font-semibold bg-indigo-50 text-indigo-700">{initials(student.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Class {student.class}{student.section} · Roll {student.roll} · {student.admissionNo}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="size-3" />{student.email}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{student.phone}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{student.city}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold">৳{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600">৳0</p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  ["Date of Birth", new Date(student.dateOfBirth).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})],
                  ["Gender", student.gender],
                  ["Nationality", student.nationality],
                  ["Religion", student.religion],
                  ["Blood Group", student.bloodGroup],
                  ["Previous School", student.previousSchool],
                  ["Joining Date", new Date(student.joiningDate).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between py-1 text-sm border-b border-dashed last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  ["Name", student.guardianName],
                  ["Relation", student.guardianRelation],
                  ["Phone", student.guardianPhone],
                  ["Occupation", student.guardianOccupation],
                  ["Address", student.address],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between py-1 text-sm border-b border-dashed last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right max-w-48 truncate">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <div className="rounded-xl border overflow-x-auto bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Debit</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Credit</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MOCK_LEDGER.map(e => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("en-BD",{day:"2-digit",month:"short"})}
                    </td>
                    <td className="py-3 px-4">{e.description}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {e.debit > 0 ? `৳${e.debit.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-green-600">
                      {e.credit > 0 ? `৳${e.credit.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-xs">
                        {e.type === "payment" ? <CheckCircle2 className="size-3 text-green-600" /> : <AlertCircle className="size-3 text-amber-500" />}
                        {e.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <div className="space-y-3">
            {MOCK_RECEIPTS.map(r => (
              <Card key={r.no}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-sm">{r.no}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(r.date).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})} · {r.method}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.bills.map(b => (
                          <span key={b} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">৳{r.amount.toLocaleString()}</span>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Receipt className="size-3.5" />Print
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
