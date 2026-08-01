"use client";
import { Calendar } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appCalendarLoadingtsxLoading() {
  return <FuturisticLoader title="Loading calendar" Icon={Calendar} variant="full" />;
}
