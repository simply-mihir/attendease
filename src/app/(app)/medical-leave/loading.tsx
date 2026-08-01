"use client";
import { Stethoscope } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appMedicalleaveLoadingtsxLoading() {
  return <FuturisticLoader title="Loading medical leave" Icon={Stethoscope} variant="full" />;
}
