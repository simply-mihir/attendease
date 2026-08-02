"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { LayoutDashboard } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={LayoutDashboard} variant="full" />;
}
