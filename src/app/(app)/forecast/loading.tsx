"use client";
import { TrendingUp } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appForecastLoadingtsxLoading() {
  return <FuturisticLoader title="Loading forecast" Icon={TrendingUp} variant="full" />;
}
