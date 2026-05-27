import { Link } from "@tanstack/react-router";

export function SayneLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="font-display text-2xl font-bold tracking-tight text-foreground">
        SAYNE
      </span>
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: "var(--secondary)" }}
      />
    </Link>
  );
}
