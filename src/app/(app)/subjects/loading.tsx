import { BookOpen } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appSubjectsLoadingtsxLoading() {
  return <FuturisticLoader title="Loading subjects" Icon={BookOpen} variant="full" />;
}
