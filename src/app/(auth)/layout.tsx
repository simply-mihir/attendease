import { VibrantBackground } from "@/components/VibrantBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <VibrantBackground />
      {children}
    </div>
  );
}
