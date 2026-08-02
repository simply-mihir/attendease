"use client";

import { type LucideIcon, GraduationCap } from "lucide-react";

interface FuturisticLoaderProps {
  title?: string;
  Icon?: LucideIcon;
  variant?: "full" | "section" | "inline";
  showProgress?: boolean;
}

export function FuturisticLoader({
  title = "Loading...",
  Icon = GraduationCap,
  variant = "full",
  showProgress = true,
}: FuturisticLoaderProps) {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#FF2D78] animate-spin" />
        <span className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">{title}</span>
      </span>
    );
  }

  if (variant === "section") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-28 w-28 items-center justify-center">
            {/* Outer orbital ring — spinning */}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-[#FF2D78]/25"
              style={{ animation: "futuristicSpin 4s linear infinite" }}
            />
            {/* Middle ring — counter-spin */}
            <div
              className="absolute inset-[6px] rounded-full border border-[#4361ee]/20"
              style={{ animation: "futuristicSpin 6s linear infinite reverse" }}
            />
            {/* Orbiting dot */}
            <div
              className="absolute h-full w-full"
              style={{ animation: "futuristicSpin 3s linear infinite" }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#FF2D78] shadow-[0_0_8px_rgba(255,45,120,0.6)]" />
            </div>
            {/* Center icon container */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#FF2D78]/30 bg-[#FF2D78]/10 shadow-[0_3px_0_0_rgba(255,45,120,0.2)]">
              <Icon className="h-8 w-8 text-[#FF2D78]" />
            </div>
          </div>
          <p className="text-sm font-bold text-[#1a1a2e] dark:text-white">{title}</p>
        </div>
      </div>
    );
  }

  // variant === "full"
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6">

        {/* Animated orbital system — ENLARGED */}
        <div className="relative flex h-36 w-36 items-center justify-center">

          {/* Ring 1: Outer dashed — spinning clockwise */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#FF2D78]/25"
            style={{ animation: "futuristicSpin 4s linear infinite" }}
          />

          {/* Ring 2: Middle solid — spinning counter-clockwise */}
          <div
            className="absolute inset-[10px] rounded-full border border-[#4361ee]/20"
            style={{ animation: "futuristicSpin 6s linear infinite reverse" }}
          />

          {/* Ring 3: Inner dotted — spinning clockwise slower */}
          <div
            className="absolute inset-[20px] rounded-full border border-dotted border-[#9b5de5]/20"
            style={{ animation: "futuristicSpin 8s linear infinite" }}
          />

          {/* Orbiting dot 1 — fast, on outer ring */}
          <div
            className="absolute h-full w-full"
            style={{ animation: "futuristicSpin 3s linear infinite" }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#FF2D78] shadow-[0_0_10px_rgba(255,45,120,0.7)]" />
          </div>

          {/* Orbiting dot 2 — slower, opposite side */}
          <div
            className="absolute h-full w-full"
            style={{ animation: "futuristicSpin 5s linear infinite reverse" }}
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#4361ee] shadow-[0_0_8px_rgba(67,97,238,0.6)]" />
          </div>

          {/* Orbiting dot 3 — medium speed */}
          <div
            className="absolute h-full w-full"
            style={{ animation: "futuristicSpin 4s linear infinite" }}
          >
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-2 rounded-full bg-[#06d6a0] shadow-[0_0_8px_rgba(6,214,160,0.6)]" />
          </div>

          {/* Center icon — large 3D box */}
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#FF2D78]/30 bg-[#FF2D78]/10 shadow-[0_4px_0_0_rgba(255,45,120,0.2)]"
            style={{ animation: "futuristicPulse 2s ease-in-out infinite" }}
          >
            <Icon className="h-10 w-10 text-[#FF2D78]" />
          </div>
        </div>

        {/* Loading text */}
        <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{title}</p>

        {/* Animated progress bar */}
        {showProgress && (
          <div className="h-1 w-40 rounded-full bg-transparent overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF2D78] via-[#9b5de5] to-[#4361ee]"
              style={{ animation: "futuristicProgress 2s ease-in-out infinite" }}
            />
          </div>
        )}

        {/* Animated dots after text */}
        <div className="flex gap-1.5 -mt-4">
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF2D78]" style={{ animation: "futuristicDot 1.4s ease-in-out infinite" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#9b5de5]" style={{ animation: "futuristicDot 1.4s ease-in-out 0.2s infinite" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#4361ee]" style={{ animation: "futuristicDot 1.4s ease-in-out 0.4s infinite" }} />
        </div>
      </div>
    </div>
  );
}
