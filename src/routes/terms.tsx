import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Sayne" },
      { name: "description", content: "The terms that govern your use of Sayne." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="June 1, 2026">
      {/* Paste the full Terms of Service content here. */}
    </LegalLayout>
  );
}
