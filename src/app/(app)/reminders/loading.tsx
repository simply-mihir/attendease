"use client";
import { Bell } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appRemindersLoadingtsxLoading() {
  return <FuturisticLoader title="Loading reminders" Icon={Bell} variant="full" />;
}
