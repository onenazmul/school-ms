// lib/auth/server.ts
import { betterAuth } from "better-auth";
import { cookies } from "next/headers";

const API_BASE = process.env.API_URL ?? "http://localhost:8000/api";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Proxy sign-in to Laravel
  emailAndPassword: {
    enabled: true,
    async signIn({ email, password }: { email: string; password: string }) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Tenant-Domain": "school1.com" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Invalid credentials");
      }

      const data = await res.json();
      // Laravel returns: { user: {..., role}, token: "..." }
      return {
        user: {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role, // "admin" | "teacher" | "student"
          laravelToken: data.token,
        },
      };
    },
  },

  session: {
    strategy: "jwt",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  callbacks: {
    jwt: {
      async encode({ token, user }: { token: any; user: any }) {
        if (user) {
          token.role = user.role;
          token.laravelToken = user.laravelToken;
        }
        return token;
      },
      async decode({ token }: { token: any }) {
        return token;
      },
    },
    session: {
      async session({ session, token }: { session: any; token: any }) {
        return {
          ...session,
          user: {
            ...session.user,
            role: (token as any).role,
            laravelToken: (token as any).laravelToken,
          },
        };
      },
    },
  },
});

// Convenience: get typed session server-side
export type UserRole = "admin" | "teacher" | "student";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  laravelToken: string;
};

export async function getServerSession() {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieStore.toString() }),
  });
  return session as { user: AuthUser } | null;
}
