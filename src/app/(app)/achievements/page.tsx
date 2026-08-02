"use client";

import { useState, useEffect } from "react";
import { Shield, Zap, Crown, Trophy, Sparkles, Lock, Star, Award, Flame, TrendingUp, Target, Calendar } from "lucide-react";

// ===== BADGE DEFINITIONS =====

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: "streak" | "milestone" | "special";
  requiredStreak?: number;
  condition?: string;
  Icon: any;
  color: string;
  shadowColor: string;
}

const ALL_BADGES: BadgeDef[] = [
  // Streak badges
  {
    id: "weekly-warrior",
    name: "Weekly Warrior",
    description: "Attend every class for 5 consecutive days. A full week of dedication!",
    category: "streak",
    requiredStreak: 5,
    Icon: Shield,
    color: "#4361ee",
    shadowColor: "#3451cc",
  },
  {
    id: "biweekly-beast",
    name: "Biweekly Beast",
    description: "10-day attendance streak. Two weeks of showing up without a miss!",
    category: "streak",
    requiredStreak: 10,
    Icon: Zap,
    color: "#9b5de5",
    shadowColor: "#7c4ab8",
  },
  {
    id: "triple-threat",
    name: "Triple Threat",
    description: "15-day streak! Three weeks of perfect attendance. You're unstoppable.",
    category: "streak",
    requiredStreak: 15,
    Icon: Crown,
    color: "#ff6b35",
    shadowColor: "#cc5529",
  },
  {
    id: "monthly-legend",
    name: "Monthly Legend",
    description: "20-day streak! A full month of flawless attendance. Absolute legend.",
    category: "streak",
    requiredStreak: 20,
    Icon: Trophy,
    color: "#FF2D78",
    shadowColor: "#cc1a5e",
  },
  // Milestone badges
  {
    id: "first-class",
    name: "First Steps",
    description: "Mark your first attendance ever. Every journey begins with a single step.",
    category: "milestone",
    condition: "totalAttended >= 1",
    Icon: Star,
    color: "#FFD166",
    shadowColor: "#ccaa52",
  },
  {
    id: "fifty-classes",
    name: "Half Century",
    description: "Attend 50 classes total. That's dedication paying off!",
    category: "milestone",
    condition: "totalAttended >= 50",
    Icon: Award,
    color: "#06d6a0",
    shadowColor: "#05a87e",
  },
  {
    id: "century-club",
    name: "Century Club",
    description: "100 classes attended! You're in the top tier of students.",
    category: "milestone",
    condition: "totalAttended >= 100",
    Icon: TrendingUp,
    color: "#4cc9f0",
    shadowColor: "#3aa3c4",
  },
  {
    id: "perfect-subject",
    name: "Perfectionist",
    description: "Maintain 100% attendance in any single subject for a full semester.",
    category: "special",
    condition: "anySubject100Percent",
    Icon: Target,
    color: "#f15bb5",
    shadowColor: "#c14890",
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Mark attendance before 8 AM for 5 consecutive days.",
    category: "special",
    condition: "earlyBird5Days",
    Icon: Calendar,
    color: "#ff6b35",
    shadowColor: "#cc5529",
  },
  {
    id: "all-rounder",
    name: "All Rounder",
    description: "Maintain above 75% attendance in ALL subjects simultaneously.",
    category: "special",
    condition: "allSubjectsAbove75",
    Icon: Sparkles,
    color: "#9b5de5",
    shadowColor: "#7c4ab8",
  },
];

export default function AchievementsPage() {
  const [streak, setStreak] = useState(0);
  const [totalAttended, setTotalAttended] = useState(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "streak" | "milestone" | "special">("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/v1/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStreak(data.currentStreak || 0);
          setTotalAttended(data.stats?.totalAttended || data.totalAttended || 0);
          setSubjects(data.subjects || []);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data for badges:", e);
      }
    }
    fetchData();
  }, []);

  function isBadgeEarned(badge: BadgeDef): boolean {
    if (badge.category === "streak" && badge.requiredStreak) {
      return streak >= badge.requiredStreak;
    }
    if (badge.condition === "totalAttended >= 1") return totalAttended >= 1;
    if (badge.condition === "totalAttended >= 50") return totalAttended >= 50;
    if (badge.condition === "totalAttended >= 100") return totalAttended >= 100;
    if (badge.condition === "anySubject100Percent") {
      return subjects.some((s: any) => {
        const pct = s.totalClassesHeld > 0 ? ((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100 : 0;
        return pct === 100 && s.totalClassesHeld >= 5;
      });
    }
    if (badge.condition === "allSubjectsAbove75") {
      return subjects.length > 0 && subjects.every((s: any) => {
        const pct = s.totalClassesHeld > 0 ? ((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100 : 100;
        return pct >= 75;
      });
    }
    return false;
  }

  const filteredBadges = activeCategory === "all" 
    ? ALL_BADGES 
    : ALL_BADGES.filter(b => b.category === activeCategory);

  const earnedCount = ALL_BADGES.filter(b => isBadgeEarned(b)).length;

  const categories = [
    { key: "all" as const, label: "All", count: ALL_BADGES.length },
    { key: "streak" as const, label: "Streak", count: ALL_BADGES.filter(b => b.category === "streak").length },
    { key: "milestone" as const, label: "Milestone", count: ALL_BADGES.filter(b => b.category === "milestone").length },
    { key: "special" as const, label: "Special", count: ALL_BADGES.filter(b => b.category === "special").length },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-7 w-7 text-[#FF2D78]" style={{ animation: "badgeSparkle 2s ease-in-out infinite" }} />
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">
            Achievements & Badges
          </h1>
        </div>
        <p className="text-[#9ca3af] dark:text-[#6b6b80] font-medium">
          Earn badges by maintaining attendance streaks and hitting milestones. Keep showing up!
        </p>
      </div>

      {/* Stats overview — 3D cards row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Badges earned */}
        <div className="rounded-2xl border-2 p-5 text-center
          border-[#FF2D78]/30 bg-[#FF2D78]/[0.06]
          shadow-[0_6px_0_0_rgba(255,45,120,0.15)]
          dark:shadow-[0_6px_0_0_rgba(255,45,120,0.2)]">
          <p className="text-sm font-semibold text-[#FF2D78] uppercase tracking-wide mb-1">Earned</p>
          <p className="text-4xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">{earnedCount}</p>
          <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-1 font-medium">of {ALL_BADGES.length} badges</p>
        </div>

        {/* Current streak */}
        <div className="rounded-2xl border-2 p-5 text-center
          border-[#ff6b35]/30 bg-[#ff6b35]/[0.06]
          shadow-[0_6px_0_0_rgba(255,107,53,0.15)]
          dark:shadow-[0_6px_0_0_rgba(255,107,53,0.2)]">
          <p className="text-sm font-semibold text-[#ff6b35] uppercase tracking-wide mb-1">Streak</p>
          <div className="flex items-center justify-center gap-1">
            <p className="text-4xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">{streak}</p>
            <Flame className="h-6 w-6 text-[#ff6b35]" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} />
          </div>
          <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-1 font-medium">days</p>
        </div>

        {/* Total classes */}
        <div className="rounded-2xl border-2 p-5 text-center
          border-[#06d6a0]/30 bg-[#06d6a0]/[0.06]
          shadow-[0_6px_0_0_rgba(6,214,160,0.15)]
          dark:shadow-[0_6px_0_0_rgba(6,214,160,0.2)]">
          <p className="text-sm font-semibold text-[#06d6a0] uppercase tracking-wide mb-1">Attended</p>
          <p className="text-4xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">{totalAttended}</p>
          <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-1 font-medium">classes total</p>
        </div>
      </div>

      {/* Category filter tabs — 3D pill buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all duration-150 cursor-pointer
              ${activeCategory === cat.key
                ? "border-[#FF2D78]/40 bg-[#FF2D78]/10 text-[#FF2D78] shadow-[0_3px_0_0_rgba(255,45,120,0.2)] translate-y-[1px]"
                : "border-gray-200 dark:border-[#2a2a3d] bg-white dark:bg-[#141425] text-[#9ca3af] dark:text-[#6b6b80] shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:hover:shadow-[0_2px_0_0_#0d0d1a]"
              }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const earned = isBadgeEarned(badge);
          const isLatestStreak = badge.category === "streak" && earned && 
            !ALL_BADGES.find(b => b.category === "streak" && b.requiredStreak! > badge.requiredStreak! && streak >= b.requiredStreak!);

          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(selectedBadge?.id === badge.id ? null : badge)}
              className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-150 text-center
                ${earned
                  ? "hover:translate-y-[2px] cursor-pointer"
                  : "opacity-50 cursor-default"
                }
                ${selectedBadge?.id === badge.id ? "translate-y-[2px]" : ""}
              `}
              style={earned ? {
                borderColor: `${badge.color}50`,
                backgroundColor: `${badge.color}0F`,
                boxShadow: `0 6px 0 0 ${badge.color}30`,
              } : {
                borderColor: "rgba(156,163,175,0.3)",
                backgroundColor: "rgba(156,163,175,0.03)",
                boxShadow: "0 6px 0 0 rgba(156,163,175,0.15)",
              }}
            >
              {/* Badge icon */}
              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={earned ? {
                  backgroundColor: `${badge.color}1A`,
                  animation: isLatestStreak ? "badgeBounce 2s ease-in-out infinite" : undefined,
                } : { backgroundColor: "rgba(156,163,175,0.1)" }}
              >
                {earned && (
                  <div className="absolute inset-0 rounded-2xl"
                    style={{
                      boxShadow: `0 0 20px ${badge.color}40, 0 0 40px ${badge.color}20`,
                      animation: "badgeGlow 2s ease-in-out infinite",
                    }} />
                )}
                {earned ? (
                  <badge.Icon className="h-8 w-8 relative z-10" style={{ color: badge.color }} />
                ) : (
                  <Lock className="h-6 w-6 text-[#9ca3af] dark:text-[#6b6b80]" />
                )}
              </div>

              {/* Name */}
              <span className={`text-sm font-bold tracking-tight ${earned ? "text-[#1a1a2e] dark:text-white" : "text-[#9ca3af] dark:text-[#6b6b80]"}`}>
                {badge.name}
              </span>

              {/* Category tag */}
              <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
                style={earned ? {
                  color: badge.color,
                  backgroundColor: `${badge.color}15`,
                } : {
                  color: "#9ca3af",
                  backgroundColor: "rgba(156,163,175,0.1)",
                }}>
                {badge.category}
              </span>

              {/* Requirement */}
              <span className="text-[11px] font-medium text-[#9ca3af] dark:text-[#6b6b80]">
                {badge.requiredStreak ? `${badge.requiredStreak}-day streak` : badge.description.split(".")[0]}
              </span>

              {/* Sparkle particles on latest earned */}
              {earned && isLatestStreak && (
                <>
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full" style={{ backgroundColor: badge.color, animation: "badgeParticle1 2s ease-in-out infinite" }} />
                  <div className="absolute top-2 -left-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color, opacity: 0.6, animation: "badgeParticle2 2.5s ease-in-out 0.5s infinite" }} />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected badge detail */}
      {selectedBadge && (
        <div className="mt-6 rounded-2xl border-2 p-5 transition-all"
          style={{
            borderColor: `${selectedBadge.color}40`,
            backgroundColor: `${selectedBadge.color}0D`,
            boxShadow: `0 6px 0 0 ${selectedBadge.color}25`,
            animation: "badgeDetailSlideIn 0.3s ease-out",
          }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: `${selectedBadge.color}1A` }}>
              <selectedBadge.Icon className="h-7 w-7" style={{ color: selectedBadge.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-[#1a1a2e] dark:text-white text-lg tracking-tight">{selectedBadge.name}</h3>
              <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#c4c4d4] mt-1">{selectedBadge.description}</p>
              <div className="mt-3">
                {isBadgeEarned(selectedBadge) ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1"
                    style={{ color: selectedBadge.color, backgroundColor: `${selectedBadge.color}15` }}>
                    <Sparkles className="h-3 w-3" /> Unlocked!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] bg-gray-100 dark:bg-white/5 rounded-full px-3 py-1">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion percentage */}
      <div className="mt-8 rounded-2xl border-2 p-5
        border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db]
        dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-[#1a1a2e] dark:text-white tracking-tight">Overall Completion</span>
          <span className="font-black text-[#FF2D78]">{Math.round((earnedCount / ALL_BADGES.length) * 100)}%</span>
        </div>
        <div className="h-4 w-full rounded-full bg-gray-100 dark:bg-[#0d0d1a] overflow-hidden border border-gray-200/50 dark:border-[#2a2a3d]/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF2D78] via-[#9b5de5] to-[#4361ee] transition-all duration-1000"
            style={{ width: `${(earnedCount / ALL_BADGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
