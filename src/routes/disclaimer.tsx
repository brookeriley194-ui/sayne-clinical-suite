import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Sayne" },
      { name: "description", content: "Important disclaimers about using Sayne." },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" lastUpdated="June 1, 2026">
      {/* Paste the full Disclaimer content here. */}
    </LegalLayout>
  );
}
