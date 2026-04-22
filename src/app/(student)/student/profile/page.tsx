"use client";
// app/(student)/student/profile/page.tsx

import { useState } from "react";
import { useStudentSession } from "@/lib/auth/student-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Loader2, Mail, Phone, MapPin, BookOpen, User } from "lucide-react";

const pwSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(8, "Min. 8 characters"),
  confirmPassword: z.string(),
}).refine(d=>d.newPassword===d.confirmPassword,{message:"Passwords don't match",path:["confirmPassword"]});

const MOCK_PROFILE = {
  name:"Rahim Uddin", email:"rahim@student.edu", phone:"01712345678",
  class:"9", section:"A", roll:"01", admissionNo:"BFS-2024-0127",
  dateOfBirth:"2010-03-15", gender:"Male", bloodGroup:"B+",
  address:"House 12, Road 5, Sirajganj", city:"Sirajganj",
  guardianName:"Kamal Uddin", guardianPhone:"01812345678", guardianRelation:"Father",
  joiningDate:"2024-01-15",
};

export default function StudentProfilePage() {
  const { session } = useStudentSession();
  const [changingPw, setChangingPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const p = MOCK_PROFILE;
  const initials = p.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  const pwForm = useForm({
    resolver: zodResolver(pwSchema),
    defaultValues: { currentPassword:"", newPassword:"", confirmPassword:"" },
  });

  async function onChangePw(values: any) {
    setPwLoading(true);
    await new Promise(r=>setTimeout(r,800));
    setPwLoading(false);
    setChangingPw(false);
    pwForm.reset();
    toast.success("Password changed successfully");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">My Profile</h1>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarFallback className="text-xl font-semibold bg-indigo-50 text-indigo-700">{initials}</AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 size-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                <Pencil className="size-3" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{session?.name}</h2>
              <p className="text-sm text-muted-foreground">Class {p.class}{p.section} · Roll {p.roll}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Active Student</Badge>
                <Badge variant="outline" className="text-xs">{p.admissionNo}</Badge>
                {p.bloodGroup && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">{p.bloodGroup}</Badge>}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {icon:Mail, label:"Email", value:p.email},
              {icon:Phone, label:"Phone", value:p.phone},
              {icon:MapPin, label:"City", value:p.city},
              {icon:BookOpen, label:"Joined", value:new Date(p.joiningDate).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})},
            ].map(item => (
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

      {/* Personal details */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {[
            ["Date of Birth", new Date(p.dateOfBirth).toLocaleDateString("en-BD",{day:"2-digit",month:"long",year:"numeric"})],
            ["Gender", p.gender],
            ["Address", p.address + ", " + p.city],
          ].map(([k,v])=>(
            <div key={k} className="flex items-center justify-between py-2 border-b border-dashed last:border-0 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium text-right">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Guardian */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian Information</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {[
            ["Name", p.guardianName],
            ["Relation", p.guardianRelation],
            ["Phone", p.guardianPhone],
          ].map(([k,v])=>(
            <div key={k} className="flex items-center justify-between py-2 border-b border-dashed last:border-0 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Password</CardTitle>
            {!changingPw && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5" onClick={()=>setChangingPw(true)}>
                <Pencil className="size-3" />Change
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {changingPw ? (
            <Form {...pwForm}>
              <form onSubmit={pwForm.handleSubmit(onChangePw)} className="space-y-3">
                <FormField control={pwForm.control} name="currentPassword" render={({field})=>(
                  <FormItem><FormLabel>Current Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={pwForm.control} name="newPassword" render={({field})=>(
                  <FormItem><FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={pwForm.control} name="confirmPassword" render={({field})=>(
                  <FormItem><FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={()=>{setChangingPw(false);pwForm.reset();}}>Cancel</Button>
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
