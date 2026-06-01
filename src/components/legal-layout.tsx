import { Link } from "@tanstack/react-router";
import { SayneLogo } from "@/components/sayne-logo";
import { SayneFooter } from "@/components/sayne-footer";

const INK = "#2D1F4A";
const MUTED = "#9B8EC4";

export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#F8F5FF", color: INK }} className="min-h-screen flex flex-col">
      <header className="w-full px-6 md:px-10 py-6">
        <Link to="/" className="inline-flex">
          <SayneLogo />
        </Link>
      </header>

      <main className="flex-1 w-full px-5 md:px-8">
        <article className="mx-auto w-full max-w-[720px] py-8 md:py-14">
          <h1
            className="font-display font-bold tracking-tight text-3xl md:text-4xl"
            style={{ color: INK }}
          >
            {title}
          </h1>
          <p
            className="mt-2 text-sm font-mono"
            style={{ color: MUTED }}
          >
            Last Updated: {lastUpdated}
          </p>

          <div
            className="legal-content mt-8 md:mt-10"
            style={{
              color: INK,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "16px",
              lineHeight: 1.7,
            }}
          >
            {children}
          </div>
        </article>
      </main>

      <SayneFooter />
    </div>
  );
}
