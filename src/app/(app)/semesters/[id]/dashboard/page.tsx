import { DashboardView } from "@/components/DashboardView";

export default function SemesterDashboardPage({ params }: { params: { id: string } }) {
  return <DashboardView semesterId={params.id} />;
}
