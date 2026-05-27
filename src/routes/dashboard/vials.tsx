import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/vials")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Vials" subtitle="Inventory and dispense tracking." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="In stock" value="146" unit="vials" />
        <StatCard label="Reserved" value="32" unit="vials" />
        <StatCard label="Expiring" value="4" unit="<30d" />
      </div>
      <EmptyCard title="No vials logged" body="Register vials to track lot numbers, concentrations, and dosing history." />
    </>
  );
}
