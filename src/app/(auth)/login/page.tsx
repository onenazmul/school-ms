"use client";
// app/(auth)/login/page.tsx
// Staff login only (Admin + Teacher). Students sign in at /student-login.

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: callbackUrl || "/admin/dashboard",
      fetchOptions: { onError: () => setLoading(false) },
    });
    if (error) {
      toast.error(error.message ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-semibold text-sm">SchoolOS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <ShieldCheck className="size-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Staff Sign In</h1>
            <p className="text-xs text-muted-foreground">Admin & Teacher Portal</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pt-1">Sign in with your school staff credentials.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@school.edu" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" className="pr-10" {...field} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="size-4 mr-2 animate-spin" />Signing in…</> : "Sign in"}
          </Button>
        </form>
      </Form>

      {/* <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demo credentials</p>
        {[
          { role: "Admin",   email: "admin@school.edu"   },
          { role: "Teacher", email: "teacher@school.edu" },
        ].map((d) => (
          <button key={d.role} type="button"
            onClick={() => { form.setValue("email", d.email); form.setValue("password", "password"); }}
            className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs hover:bg-accent transition-colors">
            <span className="text-muted-foreground">{d.role}</span>
            <span className="font-mono text-foreground">{d.email}</span>
          </button>
        ))}
      </div> */}

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-900">Are you a student?</p>
          <p className="text-xs text-indigo-600 mt-0.5">Sign in at the dedicated student portal</p>
        </div>
        <a href="/student-login" className="shrink-0 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
          Student Login →
        </a>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New student?{" "}
        <a href="/apply" className="text-indigo-600 font-medium hover:underline">Apply for admission</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
