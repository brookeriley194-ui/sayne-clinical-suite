import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ReceiptText,
  Activity,
  BookOpen,
  Users,
  Wand2,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SayneLogo } from "@/components/sayne-logo";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Sayne — Keeping Peptides Sayne" },
      {
        name: "description",
        content:
          "Track your stack. Calculate doses. Monitor compound potency in real time. Import protocols from AI, your vials from a receipt, and your outcomes from a journal.",
      },
      { property: "og:title", content: "Sayne — Keeping Peptides Sayne" },
      {
        property: "og:description",
        content:
          "The calm, precise way to track peptide protocols, vial potency, and weekly outcomes.",
      },
    ],
  }),
  component: HomePage,
});

const MUTED = "#9B8EC4";
const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MINT = "#98E4B2";
const YELLOW = "#FFD580";
const PINK = "#FFB3C6";
const BORDER = "#DDD5F0";

function HomePage() {
  return (
    <div style={{ backgroundColor: "#F8F5FF" }} className="min-h-screen text-foreground">
      <TopNav />
      <main>
        <Hero />
        <FeatureStrip />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header
      className="sticky top-0 z-40 bg-white"
      style={{ borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <SayneLogo />
        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: MUTED }}>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <Link to="/login" className="hover:text-foreground transition-colors">Stack Feed</Link>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="text-foreground hover:opacity-90"
            style={{ backgroundColor: BABY_BLUE, color: "#2D1F4A" }}
          >
            <Link to="/signup">Start Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div>
          {/* Eyebrow pill */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "color-mix(in oklab, " + MINT + " 35%, white)",
              color: "#2D1F4A",
              border: `1px solid color-mix(in oklab, ${MINT} 60%, white)`,
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: MINT }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: MINT }}
              />
            </span>
            Now in Early Access
          </div>

          <p
            className="mt-4 italic text-xs font-mono"
            style={{ color: MUTED }}
          >
            — keeping peptides sayne since 2026
          </p>

          <h1 className="mt-5 font-display font-extrabold tracking-tight text-5xl md:text-6xl leading-[1.02]">
            <span className="block">Keeping Peptides</span>
            <span className="block relative inline-block">
              <span style={{ color: LAVENDER }}>Sayne.</span>
            </span>
          </h1>
          <div
            className="mt-1 h-[2px] rounded-full"
            style={{
              width: "5.4ch",
              background: `linear-gradient(90deg, ${LAVENDER}, ${BABY_BLUE})`,
            }}
          />

          <p className="mt-6 text-base leading-relaxed max-w-xl" style={{ color: MUTED }}>
            Track your stack. Calculate doses. Monitor compound potency in real time.
            Import protocols from AI, your vials from a receipt, and your outcomes
            from a journal. All in one place.
          </p>

          <div className="mt-8 flex items-center gap-5 flex-wrap">
            <Button
              asChild
              size="lg"
              className="hover:opacity-90"
              style={{ backgroundColor: BABY_BLUE, color: "#2D1F4A" }}
            >
              <Link to="/signup">
                Start Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <a
              href="#how"
              className="text-sm underline underline-offset-4 hover:text-foreground transition-colors"
              style={{ color: MUTED }}
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {[LAVENDER, BABY_BLUE, MINT, YELLOW, PINK].map((c, i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span
              className="font-mono text-[11px] uppercase tracking-wider"
              style={{ color: MUTED }}
            >
              join early researchers tracking their stacks
            </span>
          </div>
        </div>

        {/* RIGHT — App mockup */}
        <div className="relative">
          <AppMockup />

          {/* Floating top-left badge */}
          <div
            className="absolute -top-4 -left-4 sayne-card p-3 pr-4 flex items-center gap-2.5 shadow-md"
            style={{ borderColor: `color-mix(in oklab, ${LAVENDER} 60%, white)` }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in oklab, ${LAVENDER} 25%, white)` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: LAVENDER }} />
            </div>
            <div className="leading-tight">
              <div
                className="font-mono text-xs font-semibold"
                style={{ color: LAVENDER }}
              >
                Import from AI
              </div>
              <div className="text-[10px]" style={{ color: MUTED }}>
                paste any protocol
              </div>
            </div>
          </div>

          {/* Floating bottom-right badge */}
          <div
            className="absolute -bottom-4 -right-4 sayne-card p-3 pr-4 flex items-center gap-2.5 shadow-md"
            style={{ borderColor: `color-mix(in oklab, ${YELLOW} 70%, white)` }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in oklab, ${YELLOW} 35%, white)` }}
            >
              <ReceiptText className="h-4 w-4" style={{ color: "#B8841F" }} />
            </div>
            <div className="leading-tight">
              <div
                className="font-mono text-xs font-semibold"
                style={{ color: "#B8841F" }}
              >
                Scan Receipt
              </div>
              <div className="text-[10px]" style={{ color: MUTED }}>
                add vials instantly
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type VialMock = {
  name: string;
  used: number;
  total: number;
  potency: number;
  color: string;
  pill: "Open" | "Low" | "Sealed";
};

function AppMockup() {
  const vials: VialMock[] = [
    { name: "BPC-157", used: 18, total: 20, potency: 94, color: BABY_BLUE, pill: "Open" },
    { name: "TB-500", used: 12, total: 20, potency: 78, color: YELLOW, pill: "Open" },
    { name: "Selank", used: 8, total: 20, potency: 61, color: PINK, pill: "Low" },
    { name: "MOTS-C", used: 20, total: 20, potency: 100, color: LAVENDER, pill: "Sealed" },
  ];

  return (
    <div className="sayne-card p-5 shadow-lg">
      {/* header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg">My Vials</h3>
          <p className="font-mono text-[11px] mt-0.5" style={{ color: MUTED }}>
            4 active · 1 needs attention
          </p>
        </div>
        <Button
          size="sm"
          className="hover:opacity-90"
          style={{ backgroundColor: BABY_BLUE, color: "#2D1F4A" }}
        >
          + Add Vial
        </Button>
      </div>

      {/* vial grid */}
      <div className="grid grid-cols-2 gap-3">
        {vials.map((v) => (
          <VialMockCard key={v.name} v={v} />
        ))}
      </div>

      {/* stat row */}
      <div
        className="mt-4 grid grid-cols-3 rounded-lg overflow-hidden"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <Stat label="Today's Doses" value="3/5" />
        <Stat label="Avg Potency" value="83%" borderL />
        <Stat label="Days Tracked" value="14" borderL />
      </div>
    </div>
  );
}

function VialMockCard({ v }: { v: VialMock }) {
  const pct = (v.used / v.total) * 100;
  const pillBg =
    v.pill === "Low"
      ? `color-mix(in oklab, ${PINK} 35%, white)`
      : v.pill === "Sealed"
      ? `color-mix(in oklab, ${LAVENDER} 25%, white)`
      : `color-mix(in oklab, ${BABY_BLUE} 25%, white)`;
  const pillColor =
    v.pill === "Low" ? "#A8455F" : v.pill === "Sealed" ? "#6B4A9E" : "#1F6B8F";

  return (
    <div
      className="rounded-lg p-3 bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-semibold text-sm">{v.name}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: pillBg, color: pillColor }}
        >
          {v.pill}
        </span>
      </div>
      <div
        className="font-mono text-[10px] mb-2 flex items-center justify-between"
        style={{ color: MUTED }}
      >
        <span>
          {v.used}/{v.total} doses
        </span>
        <span>{v.potency}% potency</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `color-mix(in oklab, ${v.color} 20%, white)` }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: v.color }}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  borderL,
}: {
  label: string;
  value: string;
  borderL?: boolean;
}) {
  return (
    <div
      className="p-3 bg-white"
      style={borderL ? { borderLeft: `1px solid ${BORDER}` } : undefined}
    >
      <div
        className="text-[9px] uppercase tracking-wider"
        style={{ color: MUTED }}
      >
        {label}
      </div>
      <div className="font-mono font-semibold text-base mt-0.5">{value}</div>
    </div>
  );
}

function FeatureStrip() {
  const features = [
    { icon: Activity, name: "Degradation Engine", desc: "real-time potency" },
    { icon: BookOpen, name: "Stack Journal", desc: "weekly outcomes" },
    { icon: Users, name: "Stack Feed", desc: "community protocols" },
    { icon: Wand2, name: "AI Import", desc: "paste any protocol" },
    { icon: ScanLine, name: "Receipt Scan", desc: "auto-add vials" },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 pb-20">
      <div className="flex flex-wrap items-stretch gap-3 justify-center">
        {features.map((f) => (
          <div
            key={f.name}
            className="bg-white rounded-full pl-3 pr-5 py-2 flex items-center gap-3"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in oklab, ${LAVENDER} 20%, white)` }}
            >
              <f.icon className="h-3.5 w-3.5" style={{ color: LAVENDER }} />
            </div>
            <div className="leading-tight">
              <div
                className="font-mono text-[11px] font-bold"
                style={{ color: LAVENDER }}
              >
                {f.name}
              </div>
              <div className="text-[10px]" style={{ color: MUTED }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      color: BABY_BLUE,
      title: "Add Your Vials",
      desc: "Scan a receipt or add manually. Vials track automatically.",
    },
    {
      n: "02",
      color: LAVENDER,
      title: "Build Your Stack",
      desc: "Import an AI protocol or create your own. Log doses daily.",
    },
    {
      n: "03",
      color: MINT,
      title: "Track Your Progress",
      desc: "Weekly journal entries build your outcome curve over time.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 pb-24">
      <div className="text-center mb-12">
        <h2 className="font-display font-bold text-3xl md:text-4xl">How it works</h2>
        <p className="mt-3 text-sm" style={{ color: MUTED }}>
          Three steps. Calm, precise, sustainable.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s) => (
          <div key={s.n} className="sayne-card overflow-hidden">
            <div className="h-1.5 w-full" style={{ backgroundColor: s.color }} />
            <div className="p-6">
              <div
                className="font-display font-bold text-4xl"
                style={{ color: s.color }}
              >
                {s.n}
              </div>
              <h3 className="mt-2 font-display font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24">
      <div className="sayne-card bg-white text-center py-16 px-6">
        <h2 className="font-display font-bold text-3xl md:text-4xl">
          Your stack deserves better tracking.
        </h2>
        <p className="mt-4 text-sm" style={{ color: MUTED }}>
          Free to start. No credit card required.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            size="lg"
            className="hover:opacity-90"
            style={{ backgroundColor: BABY_BLUE, color: "#2D1F4A" }}
          >
            <Link to="/signup">
              Start Free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p
          className="mt-5 italic font-mono text-xs"
          style={{ color: MUTED }}
        >
          keeping peptides sayne since 2026
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <SayneLogo />
        <div style={{ color: MUTED }}>© BioQuant Systems LLC 2026</div>
        <div className="flex items-center gap-4" style={{ color: MUTED }}>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
