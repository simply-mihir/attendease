"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GraduationCap } from "lucide-react";

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0e1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shadow-[0_4px_0_0_#cc1a5e] animate-pulse">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <p className="text-[#9ca3af] dark:text-[#6b6b80] font-bold text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0e1a]">
      {/* Minimal header */}
      <header className="bg-white/80 dark:bg-[#141425]/80 backdrop-blur-md border-b-2 border-gray-200 dark:border-[#2a2a3d] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center shadow-[0_2px_0_0_#cc1a5e]">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-[#1a1a2e] dark:text-white tracking-tight">AttendEase</span>
        </div>
        <span className="text-xs text-[#9ca3af] dark:text-[#6b6b80] font-bold">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </header>
      <main className="p-3">{children}</main>
    </div>
  );
}
