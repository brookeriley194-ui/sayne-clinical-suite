import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Sayne" },
      { name: "description", content: "How Sayne handles your data and privacy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 1, 2026">
      {/* Paste the full Privacy Policy content here. */}
    </LegalLayout>
  );
}
