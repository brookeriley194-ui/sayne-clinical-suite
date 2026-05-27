import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/research-logs")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Research Logs" subtitle="Structured notes for each session and compound." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Entries" value="42" />
        <StatCard label="This week" value="6" />
        <StatCard label="Tagged" value="19" />
      </div>
      <EmptyCard title="Start logging" body="Capture observations, dose responses, and notes tied to each vial." />
    </>
  );
}
