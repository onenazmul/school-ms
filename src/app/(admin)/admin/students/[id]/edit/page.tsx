"use client";
// app/(admin)/admin/students/[id]/edit/page.tsx

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  class_: z.string().min(1),
  section: z.string().min(1),
  roll: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  guardianName: z.string().min(2),
  guardianPhone: z.string().min(10),
  status: z.enum(["active", "inactive"]),
});
type EditInput = z.infer<typeof schema>;

// Simulate fetching student by id
const MOCK_STUDENTS: Record<string, EditInput & { admissionNo: string }> = {
  S001: {
    firstName: "Rahim", lastName: "Uddin", email: "rahim@student.edu",
    phone: "01712345678", class_: "9", section: "A", roll: "01",
    address: "House 12, Road 5, Sirajganj", city: "Sirajganj",
    guardianName: "Kamal Uddin", guardianPhone: "01812345678",
    status: "active", admissionNo: "BFS-2024-0127",
  },
};

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const student = MOCK_STUDENTS[id] ?? MOCK_STUDENTS.S001;

  const form = useForm<EditInput>({
    resolver: zodResolver(schema),
    defaultValues: student,
  });

  async function onSubmit(values: EditInput) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    toast.success("Student record updated");
    router.push(`/admin/students/${id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/students/${id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />Back to Profile
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Edit Student</h1>
          <Badge variant="outline" className="font-mono text-xs">{student.admissionNo}</Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Personal */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-sm font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
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
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Academic */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-sm font-semibold mb-4">Academic Information</h2>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="class_" render={({ field }) => (
                  <FormItem><FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["1","2","3","4","5","6","7","8","9","10"].map(c => (
                          <SelectItem key={c} value={c}>Class {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="section" render={({ field }) => (
                  <FormItem><FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["A","B","C","D"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="roll" render={({ field }) => (
                  <FormItem><FormLabel>Roll No.</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-sm font-semibold mb-4">Contact & Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Address</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Guardian */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-sm font-semibold mb-4">Guardian Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="guardianName" render={({ field }) => (
                  <FormItem><FormLabel>Guardian Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                  <FormItem><FormLabel>Guardian Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-10">
            <Button type="button" variant="outline" className="flex-1"
              onClick={() => router.push(`/admin/students/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
