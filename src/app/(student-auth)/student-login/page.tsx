"use client";
// app/(student-auth)/student-login/page.tsx

import { Suspense, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentLoginSchema, type StudentLoginInput } from "@/lib/schemas";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, GraduationCap, User } from "lucide-react";

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/student/dashboard";
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<StudentLoginInput>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: StudentLoginInput) {
    setLoading(true);
    const { error } = await authClient.signIn.username({
      username: values.username,
      password: values.password,
      callbackURL: callbackUrl,
      fetchOptions: { onError: () => setLoading(false) },
    });
    if (error) {
      toast.error(error.message ?? "Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-semibold text-sm">SchoolOS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <GraduationCap className="size-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Student Sign In</h1>
            <p className="text-xs text-muted-foreground">Student Portal</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          Use the username and password provided upon admission.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="XXXX-X-XXXX"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPw
                        ? <EyeOff className="size-4" />
                        : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading
              ? <><Loader2 className="size-4 mr-2 animate-spin" />Signing in…</>
              : "Sign in to Student Portal"}
          </Button>
        </form>
      </Form>

      {/* Help text */}
      <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Forgot your username or password?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Contact your school's administration office with your{" "}
          <strong>Admission Number</strong> to recover your credentials.
        </p>
      </div>

      {/* Staff link */}
      <p className="text-center text-xs text-muted-foreground">
        Staff member?{" "}
        <a href="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in here
        </a>
      </p>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense>
      <StudentLoginForm />
    </Suspense>
  );
}
