"use client";
// app/(public)/apply/forgot-password/page.tsx

import { GraduationCap, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCHOOL_NAME    = "Bright Future School";
const SCHOOL_PHONE   = "01XXXXXXXXX";
const SCHOOL_EMAIL   = "info@brightfutureschool.edu.bd";
const SCHOOL_HOURS   = "Saturday–Thursday, 9am–4pm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-background rounded-2xl border shadow-sm p-8 space-y-6 text-center">
          {/* Icon */}
          <div className="size-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
            <GraduationCap className="size-7 text-amber-600" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Forgot Your Password?</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your admission login credentials were shown and emailed right after you
              applied. If you need them reset, please contact the school office.
            </p>
          </div>

          {/* Contact info */}
          <div className="rounded-xl bg-muted/50 border p-4 space-y-3 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contact {SCHOOL_NAME}
            </p>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="size-4 text-indigo-500 shrink-0" />
              <a href={`tel:${SCHOOL_PHONE}`} className="text-indigo-600 hover:underline">
                {SCHOOL_PHONE}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="size-4 text-indigo-500 shrink-0" />
              <a href={`mailto:${SCHOOL_EMAIL}`} className="text-indigo-600 hover:underline break-all">
                {SCHOOL_EMAIL}
              </a>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Office hours: {SCHOOL_HOURS}
            </p>
          </div>

          {/* What to bring */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-indigo-700">What to tell them:</p>
            <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
              <li>Your full name</li>
              <li>Your date of birth</li>
              <li>Guardian's phone number used during application</li>
            </ul>
          </div>

          <Button asChild variant="outline" className="w-full">
            <a href="/apply/login">← Back to Sign In</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
