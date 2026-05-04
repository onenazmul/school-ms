// lib/auth/server.ts
import { betterAuth } from "better-auth";

const API_BASE = process.env.API_URL ?? "http://localhost:8000/api";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Proxy sign-in to Laravel
  emailAndPassword: {
    enabled: true,
    async signIn({ email, password }: { email: string; password: string }) {
      const res = await fetch(`${API_BASE}/admin/login`, {
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

const DEV_MOCK_SESSION: { user: AuthUser } = {
  user: {
    id: "dev-admin",
    email: "admin@school.edu",
    name: "Dev Admin",
    role: "admin",
    laravelToken: "dev-token",
  },
};

export async function getServerSession() {
  if (process.env.DEV_OPEN_STAFF === "true") return DEV_MOCK_SESSION;
  const { getAdminSession } = await import("./admin");
  const adminSession = await getAdminSession();
  if (adminSession) {
    return {
      user: {
        id:           adminSession.id,
        email:        adminSession.email,
        name:         adminSession.name,
        role:         adminSession.role as AuthUser["role"],
        laravelToken: adminSession.laravelToken,
      },
    };
  }
  return null;
}
