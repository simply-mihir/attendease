import { Lock } from "lucide-react";
import { FuturisticLoader } from "@/components/FuturisticLoader";

export default function authLoadingtsxLoading() {
  return <FuturisticLoader title="Preparing login" Icon={Lock} variant="full" />;
}
