import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/patients")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Patients" subtitle="Your active patient roster." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active" value="84" />
        <StatCard label="New (30d)" value="9" />
        <StatCard label="On hold" value="2" />
      </div>
      <EmptyCard title="No patients yet" body="Add patients to assign protocols, track vials, and monitor outcomes." />
    </>
  );
}
