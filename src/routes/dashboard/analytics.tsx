import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/analytics")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Cohort outcomes and protocol performance." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Adherence" value="92.4" unit="%" />
        <StatCard label="Avg. dose" value="0.25" unit="mg" />
        <StatCard label="Reports" value="18" />
      </div>
      <EmptyCard title="Analytics coming online" body="Charts and outcomes will appear once you have protocol and patient data flowing." />
    </>
  );
}
