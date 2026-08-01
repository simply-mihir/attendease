"use client";
import { Settings } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appSettingsLoadingtsxLoading() {
  return <FuturisticLoader title="Loading settings" Icon={Settings} variant="full" />;
}
