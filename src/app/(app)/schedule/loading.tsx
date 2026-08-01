import { CalendarDays } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appScheduleLoadingtsxLoading() {
  return <FuturisticLoader title="Loading schedule" Icon={CalendarDays} variant="full" />;
}
