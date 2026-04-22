"use client";
// app/(admin)/admin/students/new/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const schema = z.object({
  firstName:z.string().min(2), lastName:z.string().min(2),
  dateOfBirth:z.string().min(1), gender:z.enum(["male","female","other"]),
  nationality:z.string().min(2), religion:z.string().optional(), bloodGroup:z.string().optional(),
  email:z.string().email(), phone:z.string().min(10),
  address:z.string().min(5), city:z.string().min(2),
  class_:z.string().min(1), section:z.string().min(1), roll:z.string().optional(),
  admissionDate:z.string().min(1),
  guardianName:z.string().min(2), guardianRelation:z.enum(["father","mother","guardian"]),
  guardianPhone:z.string().min(10), guardianEmail:z.string().optional(),
  guardianOccupation:z.string().optional(),
  password:z.string().min(8),
});
type FormInput = z.infer<typeof schema>;

const FIELD_SECTIONS = [
  { title:"Personal Information", fields:[
    {name:"firstName",label:"First Name",type:"text",placeholder:"Rahim",half:true},
    {name:"lastName",label:"Last Name",type:"text",placeholder:"Uddin",half:true},
    {name:"dateOfBirth",label:"Date of Birth",type:"date",half:true},
    {name:"gender",label:"Gender",type:"select",options:[{v:"male",l:"Male"},{v:"female",l:"Female"},{v:"other",l:"Other"}],half:true},
    {name:"nationality",label:"Nationality",type:"text",placeholder:"Bangladeshi",half:true},
    {name:"religion",label:"Religion",type:"text",placeholder:"Islam",half:true},
    {name:"bloodGroup",label:"Blood Group",type:"select",options:["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=>({v:g,l:g})),half:true},
  ]},
  { title:"Contact Information", fields:[
    {name:"email",label:"Email Address",type:"email",placeholder:"student@school.edu",half:false},
    {name:"phone",label:"Phone Number",type:"tel",placeholder:"01XXXXXXXXX",half:true},
    {name:"address",label:"Address",type:"text",placeholder:"House/Road",half:false},
    {name:"city",label:"City",type:"text",placeholder:"Sirajganj",half:true},
  ]},
  { title:"Academic Information", fields:[
    {name:"class_",label:"Class",type:"select",options:["1","2","3","4","5","6","7","8","9","10"].map(c=>({v:c,l:`Class ${c}`})),half:true},
    {name:"section",label:"Section",type:"select",options:["A","B","C","D"].map(s=>({v:s,l:`Section ${s}`})),half:true},
    {name:"roll",label:"Roll Number",type:"text",placeholder:"01",half:true},
    {name:"admissionDate",label:"Admission Date",type:"date",half:true},
  ]},
  { title:"Guardian Information", fields:[
    {name:"guardianName",label:"Guardian Name",type:"text",placeholder:"Full name",half:true},
    {name:"guardianRelation",label:"Relation",type:"select",options:[{v:"father",l:"Father"},{v:"mother",l:"Mother"},{v:"guardian",l:"Guardian"}],half:true},
    {name:"guardianPhone",label:"Guardian Phone",type:"tel",placeholder:"01XXXXXXXXX",half:true},
    {name:"guardianEmail",label:"Guardian Email",type:"email",placeholder:"Optional",half:true},
    {name:"guardianOccupation",label:"Occupation",type:"text",placeholder:"Optional",half:true},
  ]},
  { title:"Account Credentials", fields:[
    {name:"password",label:"Initial Password",type:"password",placeholder:"Min. 8 characters",half:true},
  ]},
] as const;

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName:"",lastName:"",dateOfBirth:"",gender:undefined,
      nationality:"Bangladeshi",religion:"",bloodGroup:"",
      email:"",phone:"",address:"",city:"Sirajganj",
      class_:"",section:"A",roll:"",admissionDate:new Date().toISOString().split("T")[0],
      guardianName:"",guardianRelation:undefined,guardianPhone:"",guardianEmail:"",guardianOccupation:"",
      password:"",
    },
  });

  async function onSubmit(values: FormInput) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.success(`${values.firstName} ${values.lastName} added successfully`);
    router.push("/admin/students");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/students" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />Back
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-xl font-semibold">Add New Student</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {FIELD_SECTIONS.map(section => (
            <Card key={section.title}>
              <CardContent className="pt-5">
                <h2 className="text-sm font-semibold mb-4">{section.title}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {section.fields.map((field: any) => (
                    <div key={field.name} className={field.half ? "" : "col-span-2"}>
                      <FormField
                        control={form.control}
                        name={field.name as any}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              {field.type === "select" ? (
                                <Select onValueChange={f.onChange} value={f.value}>
                                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((o: any) => (
                                      <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input type={field.type} placeholder={field.placeholder} {...f} />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/admin/students")}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Add Student
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
