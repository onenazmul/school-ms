// app/(student-auth)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/helpers";

export default async function StudentAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If already signed in as student, skip login
  const session = await getSession();
  if (session) redirect("/student/dashboard");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: student-specific branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm backdrop-blur">
            S
          </div>
          <span className="font-semibold text-lg tracking-tight">SchoolOS</span>
          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Student Portal</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-light leading-snug text-white">
              Welcome back to your<br />
              <span className="font-semibold">learning journey</span>
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Sign in to view your fee ledger, download receipts,
              and manage your student account.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              { icon: "💳", label: "View fee ledger & payment history" },
              { icon: "🧾", label: "Download money receipts instantly" },
              { icon: "👤", label: "Manage your profile & contacts" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 text-sm text-indigo-100">
                <span className="text-base">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-indigo-300">Need help signing in?</p>
          <p className="text-xs text-indigo-400">
            Contact your school administration with your Admission Number
            to retrieve your username.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
