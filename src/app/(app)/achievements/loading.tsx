"use client";

import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Medal } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={Medal} variant="full" />;
}
