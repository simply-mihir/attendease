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
    <div className="card-3d p-5 transition-all duration-150">
      
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#FF2D78]" style={{ animation: "badgeSparkle 2s ease-in-out infinite" }} />
          <h3 className="font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">Streak Badges</h3>
        </div>
        <Link href="/achievements" className="text-sm font-bold text-[#FF2D78] hover:text-[#cc1a5e] transition-colors flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STREAK_BADGES.map((badge) => {
          const isEarned = longestStreak >= badge.requiredStreak;
          const isLatestEarned = isEarned && (STREAK_BADGES.indexOf(badge) === earned.length - 1);
          
          return (
            <button
              key={badge.id}
              onClick={() => setActiveBadge(activeBadge?.id === badge.id ? null : badge)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-150
                ${isEarned
                  ? `border-[${badge.color}]/30 bg-[${badge.color}]/[0.06]
                     shadow-[0_4px_0_0_${badge.color}20]
                     hover:translate-y-[2px] hover:shadow-[0_2px_0_0_${badge.color}20]
                     cursor-pointer`
                  : `border-gray-200 dark:border-[#2a2a3d] bg-gray-50 dark:bg-[#0d0d1a]
                     shadow-[0_4px_0_0_#d1d5db] dark:shadow-[0_4px_0_0_#0d0d1a]
                     opacity-40 cursor-default`
                } ${badge.id === "monthly-legend" && isEarned ? "badge-legendary" : ""}`}
              style={isEarned ? {
                borderColor: `${badge.color}40`,
                backgroundColor: `${badge.color}0D`,
                boxShadow: `0 4px 0 0 ${badge.color}33`,
              } : undefined}
            >
              {/* Badge icon with glow */}
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                style={isEarned ? {
                  backgroundColor: `${badge.color}1A`,
                  animation: isLatestEarned ? "badgeBounce 2s ease-in-out infinite" : undefined,
                } : { backgroundColor: "rgba(156,163,175,0.1)" }}
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
                isEarned ? "text-[#1a1a2e] dark:text-white" : "text-[#9ca3af] dark:text-[#6b6b80]"
              }`}>
                {badge.name}
              </span>

              {/* Streak requirement */}
              <span className={`text-[9px] font-semibold ${
                isEarned ? "" : "text-[#9ca3af] dark:text-[#6b6b80]"
              }`} style={isEarned ? { color: badge.color } : undefined}>
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
        <div className="mt-3 rounded-xl border-2 p-3 transition-all duration-300"
          style={{
            borderColor: `${activeBadge.color}40`,
            backgroundColor: `${activeBadge.color}0D`,
            animation: "badgeDetailSlideIn 0.3s ease-out",
          }}>
          <div className="flex items-center gap-3">
            <activeBadge.Icon className="h-6 w-6" style={{ color: activeBadge.color }} />
            <div>
              <p className="font-bold text-[#1a1a2e] dark:text-white text-sm">{activeBadge.name}</p>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80]">{activeBadge.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next badge progress bar */}
      {nextProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] dark:text-[#6b6b80]">
              Next: {nextProgress.badge.name}
            </span>
            <span className="text-xs font-bold" style={{ color: nextProgress.badge.color }}>
              {streak}/{nextProgress.badge.requiredStreak} days
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-[#0d0d1a] overflow-hidden border border-gray-200/50 dark:border-[#2a2a3d]/50">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${nextProgress.progress}%`,
                backgroundColor: nextProgress.badge.color,
                boxShadow: `0 0 8px ${nextProgress.badge.glowColor}`,
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
