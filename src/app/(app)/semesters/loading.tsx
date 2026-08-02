"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { GraduationCap } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={GraduationCap} variant="full" />;
}
