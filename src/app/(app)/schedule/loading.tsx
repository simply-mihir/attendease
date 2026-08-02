"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { CalendarDays } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={CalendarDays} variant="full" />;
}
