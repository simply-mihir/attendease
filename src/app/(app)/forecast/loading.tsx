import { FuturisticLoader } from "@/components/FuturisticLoader";
import { LineChart } from "lucide-react";

export default function Loading() {
  return <FuturisticLoader title="Loading..." Icon={LineChart} variant="full" />;
}
