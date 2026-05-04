// app/(auth)/layout.tsx
// Staff-only auth layout — admins and teachers only.
// Students have their own login at /student-login.
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (session?.role === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">
            S
          </div>
          <span className="font-semibold text-lg tracking-tight">SchoolOS</span>
          <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
            Staff Portal
          </span>
        </div>

        <div className="space-y-4">
          <blockquote className="text-2xl font-light leading-relaxed text-slate-200">
            "Education is the most powerful weapon which you can use to change the world."
          </blockquote>
          <p className="text-slate-400 text-sm">— Nelson Mandela</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Students", value: "2,400+" },
            { label: "Teachers", value: "180+"   },
            { label: "Classes",  value: "96"      },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-4">
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
