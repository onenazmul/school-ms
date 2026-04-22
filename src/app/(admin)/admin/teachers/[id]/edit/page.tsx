"use client";
// app/(admin)/admin/teachers/[id]/edit/page.tsx

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const SUBJECTS = ["Mathematics","English","Bangla","Physics","Chemistry","Biology","History","Geography","ICT","Physical Education"];
const DESIGNATIONS = ["Teacher","Senior Teacher","Head of Dept.","Assistant Head","Principal"];

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  subject: z.string().min(1),
  designation: z.string().min(1),
  qualification: z.string().optional(),
  status: z.enum(["active","inactive"]),
});
type EditInput = z.infer<typeof schema>;

const MOCK_TEACHERS: Record<string, EditInput> = {
  T001: { name:"Abdul Karim", email:"akarim@school.edu", phone:"01711000001",
    subject:"Mathematics", designation:"Senior Teacher", qualification:"M.Sc.", status:"active" },
};

export default function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const teacher = MOCK_TEACHERS[id] ?? MOCK_TEACHERS.T001;

  const form = useForm<EditInput>({
    resolver: zodResolver(schema),
    defaultValues: teacher,
  });

  async function onSubmit(values: EditInput) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    toast.success("Teacher record updated");
    router.push(`/admin/teachers/${id}`);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href={`/admin/teachers/${id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />Back
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-xl font-semibold">Edit Teacher</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <h2 className="text-sm font-semibold">Personal Information</h2>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-4">
              <h2 className="text-sm font-semibold">Professional Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem><FormLabel>Designation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="qualification" render={({ field }) => (
                  <FormItem><FormLabel>Qualification</FormLabel>
                    <FormControl><Input placeholder="M.Sc., B.Ed." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-10">
            <Button type="button" variant="outline" className="flex-1"
              onClick={() => router.push(`/admin/teachers/${id}`)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
