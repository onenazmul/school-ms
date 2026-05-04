"use client";
// lib/auth/admin-client.ts
// Client-side hook for admin session — same cookie pattern as student-client.ts.
// Exports useSession and signOut with the same shape as @/lib/auth/client (better-auth)
// so consuming components only need an import change.

import { useEffect, useState } from "react";
import type { AdminSession } from "./admin";

type SessionData = { user: AdminSession } | null;

export function useSession() {
  const [data, setData]         = useState<SessionData>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch("/api/auth/admin-session")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setData(json?.user ? { user: json.user as AdminSession } : null))
      .catch(() => setData(null))
      .finally(() => setIsPending(false));
  }, []);

  return { data, isPending };
}

export async function signOut() {
  await fetch("/api/auth/admin-signout", { method: "POST" });
  window.location.href = "/login";
}
