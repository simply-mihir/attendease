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
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        {/* Orbital logo — smaller */}
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border border-purple-500/20" style={{ animation: "spinSlow 6s linear infinite" }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50" />
          </div>
          <div className="absolute inset-2 rounded-full border border-violet-500/15" style={{ animation: "spinSlow 4s linear infinite reverse" }}>
            <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-violet-400" />
          </div>
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg shadow-purple-500/25" style={{ animation: "breathe 2s ease-in-out infinite" }}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{title}</span>
          <span className="flex gap-0.5">
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out infinite" }} />
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out 0.2s infinite" }} />
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out 0.4s infinite" }} />
          </span>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500" style={{ animation: "progressFill 2.5s ease-in-out infinite" }} />
          </div>
        )}
      </div>
    );
  }

  // === FULL variant — fullscreen with all effects ===
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gray-950">
      
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridScroll 20s linear infinite",
          }}
        />
      </div>

      {/* Floating particles */}
      {particles.length > 0 && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-purple-500/20"
              style={{
                width: `${p.w}px`,
                height: `${p.w}px`,
                left: `${p.l}%`,
                top: `${p.t}%`,
                animation: `floatParticle ${p.d}s ease-in-out infinite`,
                animationDelay: `${p.del}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Radial glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          animation: "glowPulse 3s ease-in-out infinite",
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">
        
        {/* Orbital rings */}
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 rounded-full border border-purple-500/20" style={{ animation: "spinSlow 8s linear infinite" }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50" />
          </div>
          <div className="absolute inset-3 rounded-full border border-violet-500/15" style={{ animation: "spinSlow 6s linear infinite reverse" }}>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-500/50" />
          </div>
          <div className="absolute inset-6 rounded-full border border-indigo-500/20" style={{ animation: "spinSlow 4s linear infinite" }}>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/50" />
          </div>
          <div className="absolute inset-9 flex items-center justify-center rounded-full bg-[#FF2D78] border-2 border-[#cc1a5e] shadow-[0_4px_0_0_#cc1a5e]" style={{ animation: "breathe 2s ease-in-out infinite" }}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 128 128" style={{ animation: "spinSlow 10s linear infinite" }}>
            <circle cx="64" cy="64" r="62" fill="none" stroke="rgba(255,45,120,0.2)" strokeWidth="1" strokeDasharray="20 40" strokeLinecap="round" />
          </svg>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 128 128" style={{ animation: "spinSlow 7s linear infinite reverse" }}>
            <circle cx="64" cy="64" r="55" fill="none" stroke="rgba(255,45,120,0.15)" strokeWidth="1" strokeDasharray="15 30" strokeLinecap="round" />
          </svg>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-black tracking-wider" style={{ animation: "textReveal 1s ease-out forwards" }}>
            <span className="text-[#FF2D78]">
              ATTENDEASE
            </span>
          </h1>
          <div className="h-px w-0 bg-gradient-to-r from-transparent via-[#FF2D78] to-transparent" style={{ animation: "lineExpand 1.5s ease-out 0.5s forwards" }} />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span style={{ animation: "fadeInUp 0.5s ease-out 0.8s both" }}>{title}</span>
          <span className="flex gap-0.5">
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out infinite" }} />
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out 0.2s infinite" }} />
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out 0.4s infinite" }} />
          </span>
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="h-0.5 w-48 overflow-hidden rounded-full bg-white/5" style={{ animation: "fadeInUp 0.5s ease-out 1s both" }}>
            <div className="h-full rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500" style={{ animation: "progressFill 2.5s ease-in-out infinite" }} />
          </div>
        )}
      </div>

      {/* Scan lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.1) 2px, rgba(139,92,246,0.1) 4px)",
          animation: "scanLines 8s linear infinite",
        }}
      />
    </div>
  );
}
