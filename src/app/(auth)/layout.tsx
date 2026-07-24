import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-2 px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <GraduationCap className="w-10 h-10 text-primary" />
        <span className="text-2xl font-bold">AttendEase</span>
      </Link>
      {children}
    </div>
  );
}
