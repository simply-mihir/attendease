import { Shield, Zap, Crown, Trophy, type LucideIcon } from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  requiredStreak: number;
  Icon: LucideIcon;
  color: string;
  shadowColor: string;
  glowColor: string;
}

export const STREAK_BADGES: Badge[] = [
  {
    id: "weekly-warrior",
    name: "Weekly Warrior",
    description: "5-day attendance streak! Full week conquered.",
    requiredStreak: 5,
    Icon: Shield,
    color: "#4361ee",
    shadowColor: "#3451cc",
    glowColor: "rgba(67, 97, 238, 0.3)",
  },
  {
    id: "biweekly-beast",
    name: "Biweekly Beast",
    description: "10-day streak! Two weeks of dedication.",
    requiredStreak: 10,
    Icon: Zap,
    color: "#9b5de5",
    shadowColor: "#7c4ab8",
    glowColor: "rgba(155, 93, 229, 0.3)",
  },
  {
    id: "triple-threat",
    name: "Triple Threat",
    description: "15-day streak! Three weeks strong.",
    requiredStreak: 15,
    Icon: Crown,
    color: "#ff6b35",
    shadowColor: "#cc5529",
    glowColor: "rgba(255, 107, 53, 0.3)",
  },
  {
    id: "monthly-legend",
    name: "Monthly Legend",
    description: "20-day streak! A full month of perfection.",
    requiredStreak: 20,
    Icon: Trophy,
    color: "#FF2D78",
    shadowColor: "#cc1a5e",
    glowColor: "rgba(255, 45, 120, 0.3)",
  },
];

export function getEarnedBadges(longestStreak: number): Badge[] {
  return STREAK_BADGES.filter(b => longestStreak >= b.requiredStreak);
}

export function getNextBadge(longestStreak: number): Badge | null {
  return STREAK_BADGES.find(b => longestStreak < b.requiredStreak) || null;
}

export function getBadgeProgress(currentStreak: number, longestStreak: number): { badge: Badge; progress: number } | null {
  const next = getNextBadge(longestStreak);
  if (!next) return null;
  const progress = (currentStreak / next.requiredStreak) * 100;
  return { badge: next, progress: Math.min(progress, 100) };
}
