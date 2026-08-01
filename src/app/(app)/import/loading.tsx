import { Download } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appImportLoadingtsxLoading() {
  return <FuturisticLoader title="Loading import" Icon={Download} variant="full" />;
}
