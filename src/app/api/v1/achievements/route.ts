import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

const BADGE_DEFS = [
  { key: "perfect_week", label: "Perfect Week", description: "Attended all classes in a week", icon: "trophy" },
  { key: "month_warrior", label: "Month Warrior", description: "90%+ attendance for entire month", icon: "swords" },
  { key: "comeback_kid", label: "Comeback Kid", description: "Recovered from danger to safe zone", icon: "muscle" },
  { key: "streak_7", label: "Week Warrior", description: "7-day present streak", icon: "flame" },
  { key: "streak_30", label: "Month on Fire", description: "30-day present streak", icon: "flame" },
  { key: "perfect_subject", label: "100% Club", description: "100% attendance in any subject", icon: "star" },
  { key: "all_safe", label: "All Green", description: "All subjects in safe zone simultaneously", icon: "heart" },
];

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const earned = await prisma.achievement.findMany({
    where: { userId: user.id },
    include: { subject: { select: { name: true } } },
    orderBy: { earnedAt: "desc" },
  });

  const earnedKeys = new Set(earned.map((a) => a.badgeKey));
  const available = BADGE_DEFS.filter((b) => !earnedKeys.has(b.key));

  return Response.json({
    earned: earned.map((a) => ({
      badgeKey: a.badgeKey,
      label: BADGE_DEFS.find((b) => b.key === a.badgeKey)?.label || a.badgeKey,
      icon: BADGE_DEFS.find((b) => b.key === a.badgeKey)?.icon || "award",
      earnedAt: a.earnedAt,
      subjectName: a.subject?.name,
    })),
    available: available.map((b) => ({
      badgeKey: b.key,
      label: b.label,
      description: b.description,
      icon: b.icon,
    })),
  });
}
