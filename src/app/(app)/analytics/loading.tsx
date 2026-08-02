"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { TrendingUp } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={TrendingUp} variant="full" />;
}
