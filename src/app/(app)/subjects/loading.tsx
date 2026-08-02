"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { BookOpen } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={BookOpen} variant="full" />;
}
