"use client";
// lib/auth/student-client.ts
// Lightweight client-side hook to read the student session.
// Since the cookie is httpOnly, we fetch the session from a
// lightweight API route rather than reading it directly.

import { useEffect, useState } from "react";
import type { StudentSession } from "./student";

export function useStudentSession() {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/student-session")
      .then(r => r.ok ? r.json() : null)
      .then(data => setSession(data?.user ?? null))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  return { session, loading };
}
