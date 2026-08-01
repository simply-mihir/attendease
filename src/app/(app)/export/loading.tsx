import { Upload } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function appExportLoadingtsxLoading() {
  return <FuturisticLoader title="Loading export" Icon={Upload} variant="full" />;
}
