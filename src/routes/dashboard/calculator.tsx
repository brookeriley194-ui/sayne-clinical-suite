import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";

export const Route = createFileRoute("/dashboard/calculator")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Dose Calculator" subtitle="Compute reconstitution and dosing across vial concentrations." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Concentration" value="2.50" unit="mg/mL" />
        <StatCard label="Per dose" value="0.20" unit="mL" />
        <StatCard label="Doses / vial" value="25" />
      </div>
      <EmptyCard title="Calculator workspace" body="Pick a vial and target dose to generate a reconstitution plan." />
    </>
  );
}
