import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/research-logs")({
  component: () => <Navigate to="/dashboard/today" replace />,
});
