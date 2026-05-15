"use client";
// app/(public)/apply/login/page.tsx — Admission applicant login

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, GraduationCap, User, KeyRound } from "lucide-react";

const schema = z.object({
  username: z.string().min(3, "Enter your username (e.g. 2026-1-XXXX)"),
  password: z.string().min(1, "Password is required"),
});
type FormInput = z.infer<typeof schema>;

function ApplyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admission/dashboard";
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: FormInput) {
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
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-background rounded-2xl border shadow-sm p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <GraduationCap className="size-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-semibold">Check Application Status</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with the credentials you received after applying.
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
                          placeholder="2026-1-XXXX"
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <a
                        href="/apply/forgot-password"
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••"
                          autoComplete="current-password"
                          className="pl-9 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Signing in…</>
                  : "Sign In"}
              </Button>
            </form>
          </Form>

          {/* Footer links */}
          <div className="space-y-3 pt-1">
            <p className="text-center text-sm text-muted-foreground">
              New applicant?{" "}
              <a href="/apply" className="text-indigo-600 font-medium hover:underline">
                Apply now
              </a>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              School staff?{" "}
              <a href="/login" className="text-indigo-600 hover:underline">
                Staff sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplyLoginPage() {
  return (
    <Suspense>
      <ApplyLoginForm />
    </Suspense>
  );
}
