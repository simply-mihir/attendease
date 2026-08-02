import { FuturisticLoader } from "@/components/FuturisticLoader";
import { Shield } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={Shield} variant="full" />;
}
