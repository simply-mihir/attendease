"use client";
import { Lightbulb } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appOptimizerLoadingtsxLoading() {
  return <FuturisticLoader title="Loading optimizer" Icon={Lightbulb} variant="full" />;
}
