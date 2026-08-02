"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Award } from "lucide-react";

export default function AchievementsLoading() {
  return <FuturisticLoader title="Loading achievements" Icon={Award} variant="full" />;
}
