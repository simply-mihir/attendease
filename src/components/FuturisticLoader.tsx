"use client";

import { useEffect, useState } from "react";
import { LucideIcon, GraduationCap } from "lucide-react";

interface FuturisticLoaderProps {
  title?: string;           // e.g., "Loading your dashboard..."
  Icon?: LucideIcon; // Changed from emoji string to Lucide component
  variant?: "full" | "section" | "inline"; // size variants
  showProgress?: boolean;   // show progress bar
  showParticles?: boolean;  // show floating particles (skip on lightweight variants)
}

export function FuturisticLoader({
  title = "Loading...",
  Icon = GraduationCap,
  variant = "full",
  showProgress = true,
  showParticles = true,
}: FuturisticLoaderProps) {

  // Randomize particles only on mount to avoid hydration mismatch
  const [particles, setParticles] = useState<Array<{ w: number; l: number; t: number; d: number; del: number }>>([]);
  
  useEffect(() => {
    if (showParticles && variant === "full") {
      setParticles(
        Array.from({ length: 20 }, () => ({
          w: Math.random() * 4 + 2,
          l: Math.random() * 100,
          t: Math.random() * 100,
          d: Math.random() * 6 + 4,
          del: Math.random() * 4,
        }))
      );
    }
  }, [showParticles, variant]);

  // === INLINE variant — small spinner for buttons/cards ===
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border border-purple-500/20" style={{ animation: "spinSlow 3s linear infinite" }}>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50" />
          </div>
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600/80 to-violet-600/80" style={{ animation: "breathe 2s ease-in-out infinite" }}>
            <Icon className="h-3 w-3 text-white" />
          </div>
        </div>
        <span className="text-sm text-gray-400">{title}</span>
      </div>
    );
  }

  // === SECTION variant — for in-page loading (e.g., a card or tab content) ===
  if (variant === "section") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#FF2D78]/20"
              style={{ animation: "loaderSpin 3s linear infinite" }} />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2
              border-[#FF2D78]/30 bg-[#FF2D78]/10 shadow-[0_3px_0_0_rgba(255,45,120,0.2)]">
              <Icon className="h-6 w-6 text-[#FF2D78]" />
            </div>
          </div>
          <p className="text-sm font-bold text-[#1a1a2e] dark:text-white">{title}</p>
        </div>
      </div>
    );
  }

  // === FULL variant — fullscreen with all effects ===
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-5">
        
        {/* Icon container — enlarged */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Orbital ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-[#FF2D78]/20"
            style={{ animation: "loaderSpin 3s linear infinite" }} />
          {/* Orbital ring 2 — slightly larger */}
          <div className="absolute -inset-3 rounded-full border border-[#4361ee]/15"
            style={{ animation: "loaderSpin 5s linear infinite reverse" }} />
          {/* Dot on orbit */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#FF2D78]/60"
            style={{ animation: "loaderSpin 3s linear infinite" }} />
          
          {/* Center icon — larger */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2
            border-[#FF2D78]/30 bg-[#FF2D78]/10 shadow-[0_4px_0_0_rgba(255,45,120,0.2)]">
            <Icon className="h-8 w-8 text-[#FF2D78]" />
          </div>
        </div>

        {/* Loading text — larger */}
        <p className="text-base font-bold text-[#1a1a2e] dark:text-white">{title}</p>

        {/* Progress bar */}
        {showProgress && (
          <div className="h-1.5 w-40 rounded-full bg-gray-200/30 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#FF2D78]"
              style={{ animation: "loaderProgress 2s ease-in-out infinite" }} />
          </div>
        )}
      </div>
    </div>
  );
}
