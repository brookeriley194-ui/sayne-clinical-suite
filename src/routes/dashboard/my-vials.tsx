import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/my-vials")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="My Vials" subtitle="Personal inventory and reconstitution history." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Open" value="3" />
        <StatCard label="Sealed" value="11" />
        <StatCard label="Used (30d)" value="7" />
      </div>
      <EmptyCard title="No vials yet" body="Register a vial to begin tracking concentration, draws, and remaining doses." />
    </>
  );
}
