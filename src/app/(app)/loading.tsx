"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={Loader2} variant="full" />;
}
