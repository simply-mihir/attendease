"use client";
import { Users } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appGroupsLoadingtsxLoading() {
  return <FuturisticLoader title="Loading groups" Icon={Users} variant="full" />;
}
