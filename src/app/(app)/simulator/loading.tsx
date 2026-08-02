"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Calculator } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={Calculator} variant="full" />;
}
