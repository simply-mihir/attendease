"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Settings } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={Settings} variant="full" />;
}
