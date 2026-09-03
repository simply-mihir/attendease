"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Lock, ChevronRight } from "lucide-react";
import { STREAK_BADGES, getEarnedBadges, getNextBadge, getBadgeProgress, type Badge } from "@/lib/badges";

interface StreakBadgesProps {
  streak: number;
  longestStreak: number;
}

export function StreakBadges({ streak, longestStreak }: StreakBadgesProps) {
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const earned = getEarnedBadges(longestStreak);
  const nextProgress = getBadgeProgress(streak, longestStreak);

  return (
    <div className="relative overflow-hidden p-5 transition-all duration-150 rounded-2xl bg-gradient-to-br from-orange-500/90 to-red-600/90 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay"></div>
      
      {/* Section header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg border border-white/30 shadow-sm backdrop-blur-md flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" style={{ animation: "badgeSparkle 2s ease-in-out infinite" }} />
          </div>
          <h3 className="font-extrabold text-white text-lg drop-shadow-sm tracking-tight">Streak Badges</h3>
        </div>
        <Link href="/achievements" className="text-sm font-bold text-white hover:text-white/80 transition-colors flex items-center gap-1 drop-shadow-sm">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Badge grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STREAK_BADGES.map((badge) => {
          const isEarned = longestStreak >= badge.requiredStreak;
          const isLatestEarned = isEarned && (STREAK_BADGES.indexOf(badge) === earned.length - 1);
          
          return (
            <button
              key={badge.id}
              onClick={() => setActiveBadge(activeBadge?.id === badge.id ? null : badge)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-150
                ${isEarned
                  ? `border-white/30 bg-white/10 backdrop-blur-md
                     shadow-sm
                     hover:translate-y-[2px]
                     cursor-pointer`
                  : `border-white/10 bg-black/10 backdrop-blur-md
                     shadow-sm
                     opacity-60 cursor-default`
                } ${badge.id === "monthly-legend" && isEarned ? "badge-legendary" : ""}`}
              style={isEarned ? {
                borderColor: `rgba(255,255,255,0.4)`,
                backgroundColor: `rgba(255,255,255,0.15)`,
                boxShadow: `0 4px 12px 0 ${badge.color}66`,
              } : undefined}
            >
              {/* Badge icon with glow */}
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                style={isEarned ? {
                  backgroundColor: `rgba(255,255,255,0.2)`,
                  animation: isLatestEarned ? "badgeBounce 2s ease-in-out infinite" : undefined,
                } : { backgroundColor: "rgba(0,0,0,0.1)" }}
              >
                {/* Glow ring for earned badges */}
                {isEarned && (
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      boxShadow: `0 0 15px ${badge.glowColor}, 0 0 30px ${badge.glowColor}`,
                      animation: "badgeGlow 2s ease-in-out infinite",
                    }}
                  />
                )}
                
                {isEarned ? (
                  <badge.Icon className="h-6 w-6 relative z-10" style={{ color: badge.color }} />
                ) : (
                  <Lock className="h-5 w-5 text-[#9ca3af] dark:text-[#6b6b80]" />
                )}
              </div>

              {/* Badge name */}
              <span className={`text-[10px] font-bold text-center leading-tight ${
                isEarned ? "text-white" : "text-white/60"
              }`}>
                {badge.name}
              </span>

              {/* Streak requirement */}
              <span className={`text-[9px] font-semibold ${
                isEarned ? "text-white/90" : "text-white/50"
              }`}>
                {badge.requiredStreak} days
              </span>

              {/* Sparkle particles on latest earned badge */}
              {isLatestEarned && (
                <>
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full" style={{ backgroundColor: badge.color, animation: "badgeParticle1 2s ease-in-out infinite" }} />
                  <div className="absolute -top-1 -left-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color, opacity: 0.6, animation: "badgeParticle2 2.5s ease-in-out 0.5s infinite" }} />
                  <div className="absolute -bottom-1 right-0 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color, opacity: 0.4, animation: "badgeParticle3 3s ease-in-out 1s infinite" }} />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Active badge detail popover */}
      {activeBadge && (
        <div className="mt-3 rounded-xl border border-white/40 p-3 transition-all duration-300 relative z-10 backdrop-blur-md shadow-lg"
          style={{
            backgroundColor: `rgba(255,255,255,0.15)`,
            animation: "badgeDetailSlideIn 0.3s ease-out",
          }}>
          <div className="flex items-center gap-3">
            <activeBadge.Icon className="h-6 w-6 text-white drop-shadow-md" style={{ color: activeBadge.color, filter: 'brightness(1.5)' }} />
            <div>
              <p className="font-bold text-white text-sm">{activeBadge.name}</p>
              <p className="text-xs text-white/80">{activeBadge.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next badge progress bar */}
      {nextProgress && (
        <div className="mt-4 relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white/80">
              Next: {nextProgress.badge.name}
            </span>
            <span className="text-xs font-bold text-white drop-shadow-sm">
              {streak}/{nextProgress.badge.requiredStreak} days
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-black/20 overflow-hidden border border-white/20">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out backdrop-blur-sm"
              style={{
                width: `${nextProgress.progress}%`,
                backgroundColor: 'rgba(255,255,255,0.9)',
                boxShadow: `0 0 12px 2px rgba(255,255,255,0.6)`,
              }}
            />
          </div>
        </div>
      )}

      {/* All badges earned celebration */}
      {earned.length === STREAK_BADGES.length && (
        <div className="mt-4 text-center">
          <p className="text-sm font-extrabold text-[#FF2D78]" style={{ animation: "greetingGradientShift 4s ease-in-out infinite", background: "linear-gradient(90deg, #FF2D78, #ff6b35, #9b5de5, #4361ee, #FF2D78)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            All Badges Unlocked! You're a Legend!
          </p>
        </div>
      )}
    </div>
  );
}
