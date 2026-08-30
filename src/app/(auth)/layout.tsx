import { VibrantBackground } from "@/components/VibrantBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh]">
      <VibrantBackground />
      {children}
    </div>
  );
}
