import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/protocols")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Protocols" subtitle="Active treatment protocols across your patient cohort." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active" value="12" />
        <StatCard label="Drafts" value="3" />
        <StatCard label="Archived" value="47" />
      </div>
      <EmptyCard title="No protocols yet" body="Create your first protocol to start tracking dosing schedules and patient assignments." />
    </>
  );
}
