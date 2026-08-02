"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Calendar } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={Calendar} variant="full" />;
}
