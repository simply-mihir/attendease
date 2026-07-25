import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-mesh-strong px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/8 rounded-full blur-3xl" />

      <Link href="/" className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <span className="text-2xl font-bold text-gradient">AttendEase</span>
      </Link>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
