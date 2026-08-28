import { Link } from "@tanstack/react-router";
import { SayneLogo } from "@/components/sayne-logo";

const MUTED = "#9B8EC4";
const LAVENDER = "#C9A8F5";
const BORDER = "#DDD5F0";

export function SayneFooter() {
  return (
    <footer
      style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "#fff" }}
      className="relative z-10 w-full"
    >
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-4 text-xs text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-1">
          <SayneLogo />
          <span style={{ color: MUTED }}>© BioQuant Systems LLC 2026</span>
        </div>
        <nav className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
          {[
            
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Service" },
            { to: "/disclaimer", label: "Disclaimer" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="transition-colors"
              style={{ color: MUTED }}
              onMouseEnter={(e) => (e.currentTarget.style.color = LAVENDER)}
              onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
