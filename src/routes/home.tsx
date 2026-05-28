import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useInView, useReducedMotion, useScroll, useTransform, animate } from "framer-motion";

import {
  Sparkles,
  ReceiptText,
  Activity,
  BookOpen,
  Users,
  Wand2,
  ScanLine,
  ArrowRight,
  Play,
  Home as HomeIcon,
  FlaskConical,
  Layers,
  Settings as SettingsIcon,
  Check,
  TrendingUp,
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
const INK = "#2B174F";
const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MINT = "#98E4B2";
const YELLOW = "#FFD580";
const PINK = "#FFB3C6";
const BORDER = "#DDD5F0";

function HomePage() {
  return (
    <div style={{ backgroundColor: "#F8F5FF", color: INK }} className="min-h-screen relative overflow-x-hidden">
      <AmbientBackground />
      <LiquidNav />
      <main className="relative z-10">
        <HeroSection />
        <FeatureStrip />
        <HowItWorks />
        <MetricsSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* -------------------- Ambient background -------------------- */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="haze absolute -top-40 -left-40 h-[720px] w-[720px] rounded-full opacity-60"
        style={{
          background: `radial-gradient(closest-side, ${LAVENDER}55, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="haze absolute top-[20%] -right-40 h-[640px] w-[640px] rounded-full opacity-50"
        style={{
          background: `radial-gradient(closest-side, ${BABY_BLUE}55, transparent 70%)`,
          filter: "blur(40px)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="haze absolute bottom-[5%] left-[10%] h-[520px] w-[520px] rounded-full opacity-40"
        style={{
          background: `radial-gradient(closest-side, ${MINT}55, transparent 70%)`,
          filter: "blur(50px)",
          animationDelay: "-14s",
        }}
      />
      {/* Curved degradation arcs — slow flowing motion */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.45]"
        viewBox="0 0 1440 1200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="arcGrad" x1="0" x2="1">
            <stop offset="0%" stopColor={LAVENDER} stopOpacity="0" />
            <stop offset="50%" stopColor={LAVENDER} stopOpacity="0.6" />
            <stop offset="100%" stopColor={BABY_BLUE} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arcGrad2" x1="0" x2="1">
            <stop offset="0%" stopColor={BABY_BLUE} stopOpacity="0" />
            <stop offset="50%" stopColor={BABY_BLUE} stopOpacity="0.45" />
            <stop offset="100%" stopColor={LAVENDER} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M -100 ${180 + i * 180} Q 720 ${30 + i * 170} 1540 ${260 + i * 190}`}
            stroke={i % 2 === 0 ? "url(#arcGrad)" : "url(#arcGrad2)"}
            strokeWidth="1.2"
            fill="none"
            className={i % 2 === 0 ? "arc-flow" : "arc-flow-slow"}
            style={{ animationDelay: `${i * -3}s` }}
          />
        ))}
      </svg>
      {/* Pulsing haze veil */}
      <div
        className="haze-pulse absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at 50% 30%, ${LAVENDER}1A, transparent 70%)`,
        }}
      />
    </div>
  );
}


/* -------------------- Nav -------------------- */
function LiquidNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="sticky top-4 z-40 px-4">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        className={`glass-nav mx-auto flex items-center justify-between rounded-2xl px-5 transition-all duration-300 ${
          scrolled ? "max-w-5xl h-12" : "max-w-6xl h-16"
        }`}
      >
        <SayneLogo />
        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: MUTED }}>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <Link to="/login" className="hover:text-foreground transition-colors">Stack Feed</Link>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="bg-white/60 backdrop-blur border-[color:var(--border)]">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="liquid-button text-foreground hover:opacity-95 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${BABY_BLUE} 0%, ${LAVENDER} 110%)`,
              color: "#1F1240",
            }}
          >
            <Link to="/signup">Start Free</Link>
          </Button>
        </div>
      </motion.header>
    </div>
  );
}

/* -------------------- Hero -------------------- */
function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-12 pb-24">
      <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
        <HeroCopy />
        <ProductShowcase />
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium glass-card"
        style={{ color: "#2D1F4A", borderRadius: 999 }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: MINT }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: MINT }} />
        </span>
        Now in Early Access
      </div>

      <p className="mt-4 italic text-xs font-mono" style={{ color: MUTED }}>
        {"\n"}
      </p>

      <h1 className="mt-5 font-display font-extrabold tracking-tight text-[3.2rem] md:text-[4.2rem] leading-[1.0]">
        <span className="block">Keeping</span>
        <span className="block">Peptides</span>
        <span className="block gradient-text font-display italic">Sayne.</span>
      </h1>
      <div
        className="mt-2 h-[3px] rounded-full"
        style={{
          width: "6ch",
          background: `linear-gradient(90deg, ${LAVENDER}, ${BABY_BLUE})`,
          backgroundSize: "200% 100%",
          animation: "gradient-shift 6s ease-in-out infinite",
        }}
      />

      <p className="mt-6 text-base leading-relaxed max-w-xl" style={{ color: MUTED }}>
        Track your stack. Calculate doses. Monitor potency in real time. Import protocols
        from AI. Journal your outcomes. All in one place.
      </p>

      <div className="mt-8 flex items-center gap-5 flex-wrap">
        <Button
          asChild
          size="lg"
          className="liquid-button shadow-md hover:opacity-95"
          style={{
            background: `linear-gradient(135deg, ${BABY_BLUE} 0%, ${LAVENDER} 120%)`,
            color: "#1F1240",
          }}
        >
          <Link to="/signup">
            Start Free <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <a
          href="#how"
          className="inline-flex items-center gap-2 text-sm hover:text-foreground transition-colors group"
          style={{ color: MUTED }}
        >
          <span
            className="h-7 w-7 rounded-full flex items-center justify-center glass-card group-hover:scale-105 transition-transform"
            style={{ borderRadius: 999 }}
          >
            <Play className="h-3 w-3" style={{ color: LAVENDER }} fill={LAVENDER} />
          </span>
          See how it works
        </a>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {[LAVENDER, BABY_BLUE, MINT, YELLOW, PINK].map((c, i) => (
            <span
              key={i}
              className="h-6 w-6 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
          join early researchers tracking their stacks
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------- Product showcase (layered, parallax) -------------------- */
function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 14, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 60, damping: 14, mass: 0.4 });
  const reduce = useReducedMotion();

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    mx.set(px * 14);
    my.set(py * 14);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative h-[560px] md:h-[600px]"
      style={{ perspective: 1200 }}
    >
      {/* Big dashboard window */}
      <motion.div
        style={{ x: sx, y: sy }}
        className="absolute inset-0"
      >
        <DashboardMock />
      </motion.div>

      {/* Floating vials card */}
      <motion.div
        style={{ x: useSpring(useTransform2(sx, 1.8), { stiffness: 50, damping: 14 }), y: useSpring(useTransform2(sy, 1.8), { stiffness: 50, damping: 14 }) }}
        className="absolute -right-4 top-10 w-[290px] hidden md:block floating-card"
      >
        <VialsCard />
      </motion.div>

      {/* Floating import from AI */}
      <motion.div
        style={{ x: useSpring(useTransform2(sx, -1.5), { stiffness: 50, damping: 14 }), y: useSpring(useTransform2(sy, -1.5), { stiffness: 50, damping: 14 }) }}
        className="absolute -left-3 top-6 floating-card-slow"
      >
        <FloatingPill
          icon={<Sparkles className="h-4 w-4" style={{ color: LAVENDER }} />}
          title="Import from AI"
          sub="paste any protocol"
          tint={LAVENDER}
        />
      </motion.div>

      {/* Floating receipt scan */}
      <motion.div
        style={{ x: useSpring(useTransform2(sx, -2.2), { stiffness: 50, damping: 14 }), y: useSpring(useTransform2(sy, -2.2), { stiffness: 50, damping: 14 }) }}
        className="absolute -left-2 bottom-24 floating-card"
      >
        <FloatingPill
          icon={<ReceiptText className="h-4 w-4" style={{ color: "#B8841F" }} />}
          title="Scan Receipt"
          sub="add vials instantly"
          tint={YELLOW}
        />
      </motion.div>

      {/* Floating potency gauge */}
      <motion.div
        style={{ x: useSpring(useTransform2(sx, 2.4), { stiffness: 50, damping: 14 }), y: useSpring(useTransform2(sy, 2.4), { stiffness: 50, damping: 14 }) }}
        className="absolute -right-2 bottom-4 floating-card-slow"
      >
        <PotencyGauge />
      </motion.div>
    </motion.div>
  );
}

// helper to scale a motion value
function useTransform2(mv: ReturnType<typeof useMotionValue<number>>, factor: number) {
  const out = useMotionValue(0);
  useEffect(() => {
    const unsub = mv.on("change", (v) => out.set(v * factor));
    return () => unsub();
  }, [mv, factor, out]);
  return out;
}

function DashboardMock() {
  return (
    <div className="glass-card h-full w-full p-4 flex gap-3 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[120px] shrink-0 rounded-xl bg-white/60 border border-[color:var(--border)] p-2.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 px-1 py-1">
          <span className="font-display font-bold text-[11px]">SAYNE</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: LAVENDER }} />
        </div>
        {[
          { i: HomeIcon, l: "Today", active: true },
          { i: FlaskConical, l: "My Vials" },
          { i: Layers, l: "My Stacks" },
          { i: Users, l: "Stack Feed" },
          { i: SettingsIcon, l: "Settings" },
        ].map(({ i: Icn, l, active }) => (
          <div
            key={l}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] ${
              active ? "" : ""
            }`}
            style={{
              backgroundColor: active ? `color-mix(in oklab, ${LAVENDER} 22%, white)` : "transparent",
              color: active ? "#5A3FA6" : MUTED,
              fontWeight: active ? 600 : 500,
            }}
          >
            <Icn className="h-3 w-3" />
            {l}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div>
          <div className="font-display font-bold text-[15px]">Good evening, brooke.riley194</div>
          <div className="font-mono text-[10px]" style={{ color: MUTED }}>
            wed · 14 days into your stack
          </div>
        </div>

        {/* Day calendar */}
        <div className="rounded-xl bg-white/70 border border-[color:var(--border)] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-semibold text-[11px]">Day Dose Calendar</span>
            <span className="font-mono text-[9px]" style={{ color: MUTED }}>WED · NOV 26</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: "AM", items: ["BPC-157 · 250mcg", "TB-500 · 2mg"] },
              { t: "PM", items: ["Selank · 300mcg"] },
            ].map((row) => (
              <div key={row.t} className="rounded-lg p-2" style={{ backgroundColor: "color-mix(in oklab, " + LAVENDER + " 10%, white)" }}>
                <div className="font-mono text-[9px] mb-1" style={{ color: MUTED }}>{row.t}</div>
                {row.items.map((it) => (
                  <div key={it} className="flex items-center gap-1.5 text-[10px] py-0.5">
                    <Check className="h-2.5 w-2.5" style={{ color: MINT }} />
                    {it}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Snapshot */}
        <div className="rounded-xl bg-white/70 border border-[color:var(--border)] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-semibold text-[11px]">Today's Snapshot</span>
            <TrendingUp className="h-3 w-3" style={{ color: MINT }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Mini label="Doses" value="3/5" />
            <Mini label="Potency" value="83%" />
            <Mini label="Days" value="14" />
          </div>
          <Sparkline />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[8px] uppercase tracking-wider" style={{ color: MUTED }}>{label}</div>
      <div className="font-mono font-semibold text-[12px] mt-0.5">{value}</div>
    </div>
  );
}

function Sparkline() {
  const reduce = useReducedMotion();
  const d = "M0 32 L20 28 L40 30 L60 22 L80 24 L100 14 L120 18 L140 10 L160 12 L180 6";
  return (
    <svg viewBox="0 0 180 40" className="w-full h-9">
      <defs>
        <linearGradient id="sl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={BABY_BLUE} stopOpacity="0.5" />
          <stop offset="100%" stopColor={BABY_BLUE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L180 40 L0 40 Z`}
        fill="url(#sl)"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke={BABY_BLUE}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

type Vial = { name: string; used: number; total: number; potency: number; color: string; pill: "Open" | "Low" | "Sealed" };

function VialsCard() {
  const vials: Vial[] = [
    { name: "BPC-157", used: 18, total: 20, potency: 94, color: BABY_BLUE, pill: "Open" },
    { name: "TB-500", used: 12, total: 20, potency: 78, color: YELLOW, pill: "Open" },
    { name: "Selank", used: 8, total: 20, potency: 61, color: PINK, pill: "Low" },
    { name: "MOTS-C", used: 20, total: 20, potency: 100, color: LAVENDER, pill: "Sealed" },
  ];
  return (
    <div className="glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-display font-semibold text-[12px]">Vials</div>
          <div className="font-mono text-[9px]" style={{ color: MUTED }}>4 active · 1 needs attention</div>
        </div>
        <span className="text-[9px]" style={{ color: LAVENDER }}>View all →</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {vials.map((v, i) => (
          <VialMini key={v.name} v={v} delay={0.3 + i * 0.1} />
        ))}
      </div>
    </div>
  );
}

function VialMini({ v, delay }: { v: Vial; delay: number }) {
  const reduce = useReducedMotion();
  const pct = (v.used / v.total) * 100;
  const pillBg =
    v.pill === "Low" ? `color-mix(in oklab, ${PINK} 35%, white)`
    : v.pill === "Sealed" ? `color-mix(in oklab, ${LAVENDER} 25%, white)`
    : `color-mix(in oklab, ${BABY_BLUE} 25%, white)`;
  const pillColor = v.pill === "Low" ? "#A8455F" : v.pill === "Sealed" ? "#6B4A9E" : "#1F6B8F";
  return (
    <div className="rounded-md p-2 bg-white/80" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-display font-semibold text-[10px]">{v.name}</span>
        <span className="text-[8px] px-1 py-px rounded-full font-medium" style={{ backgroundColor: pillBg, color: pillColor }}>
          {v.pill}
        </span>
      </div>
      <div className="font-mono text-[8px] mb-1 flex items-center justify-between" style={{ color: MUTED }}>
        <span>{v.used}/{v.total}</span>
        <span>{v.potency}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: `color-mix(in oklab, ${v.color} 20%, white)` }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: v.color }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function FloatingPill({ icon, title, sub, tint }: { icon: React.ReactNode; title: string; sub: string; tint: string }) {
  return (
    <div className="glass-card p-2.5 pr-3.5 flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in oklab, ${tint} 28%, white)` }}>
        {icon}
      </div>
      <div className="leading-tight">
        <div className="font-mono text-[11px] font-semibold" style={{ color: INK }}>{title}</div>
        <div className="text-[10px]" style={{ color: MUTED }}>{sub}</div>
      </div>
    </div>
  );
}

function PotencyGauge() {
  const reduce = useReducedMotion();
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = 83;
  return (
    <div className="glass-card p-3 flex items-center gap-3">
      <div className="relative h-[74px] w-[74px]">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} stroke={`color-mix(in oklab, ${LAVENDER} 25%, white)`} strokeWidth="6" fill="none" />
          <motion.circle
            cx="40" cy="40" r={r}
            stroke={LAVENDER}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 1.6, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-[13px]">{pct}%</div>
      </div>
      <div className="leading-tight">
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>Avg. Potency</div>
        <div className="font-display font-semibold text-[12px]">Across stack</div>
      </div>
    </div>
  );
}

/* -------------------- Feature strip -------------------- */
function FeatureStrip() {
  const features = [
    { icon: Activity, name: "Degradation Engine", desc: "real-time potency" },
    { icon: BookOpen, name: "Stack Journal", desc: "weekly outcomes" },
    { icon: Users, name: "Stack Feed", desc: "community protocols" },
    { icon: Wand2, name: "AI Import", desc: "paste any protocol" },
    { icon: ScanLine, name: "Receipt Scan", desc: "auto-add vials" },
  ];
  return (
    <Reveal>
      <section id="features" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="glass-card p-3 flex flex-wrap items-stretch gap-2 justify-center rounded-2xl">
          {features.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className="group bg-white/80 backdrop-blur rounded-full pl-2.5 pr-4 py-1.5 flex items-center gap-2.5 transition-all hover:shadow-md"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, ${LAVENDER} 30%, white), color-mix(in oklab, ${BABY_BLUE} 25%, white))`,
                }}
              >
                <f.icon className="h-3.5 w-3.5" style={{ color: "#6B4A9E" }} />
              </div>
              <div className="leading-tight">
                <div className="font-mono text-[11px] font-bold" style={{ color: INK }}>{f.name}</div>
                <div className="text-[10px]" style={{ color: MUTED }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/* -------------------- How it works -------------------- */
function HowItWorks() {
  const steps = [
    {
      n: "01", color: BABY_BLUE,
      title: "Add Your Vials",
      desc: "Scan a receipt or add manually. We'll identify your peptides, set up tracking, and estimate starting potency.",
      visual: <ScanVisual />,
    },
    {
      n: "02", color: LAVENDER,
      title: "Build Your Stack",
      desc: "Import an AI protocol or create your own. Organize compounds, set doses, and plan your schedule.",
      visual: <StackVisual />,
    },
    {
      n: "03", color: MINT,
      title: "Track Your Progress",
      desc: "Log doses, monitor potency, and journal outcomes. See your progress and optimize over time.",
      visual: <ChartVisual />,
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 pb-28">
      <Reveal>
        <div className="text-center mb-12">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: LAVENDER }}>How it works</div>
          <h2 className="mt-2 font-display font-bold text-3xl md:text-4xl">Three steps. Calm, precise, sustainable.</h2>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <motion.div whileHover={{ y: -4 }} className="glass-card overflow-hidden h-full transition-shadow hover:shadow-xl">
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${s.color}, color-mix(in oklab, ${s.color} 40%, white))` }} />
              <div className="p-6">
                <div className="font-display font-bold text-4xl" style={{ color: s.color }}>{s.n}</div>
                <h3 className="mt-2 font-display font-semibold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>{s.desc}</p>
                <div className="mt-5">{s.visual}</div>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ScanVisual() {
  return (
    <div className="rounded-xl bg-white/70 border border-[color:var(--border)] p-3 flex items-center gap-3">
      <div className="relative h-14 w-14 rounded-md border-2 border-dashed flex items-center justify-center" style={{ borderColor: BABY_BLUE }}>
        <ScanLine className="h-5 w-5" style={{ color: BABY_BLUE }} />
      </div>
      <div className="flex-1">
        <div className="font-display font-semibold text-[12px]">BPC-157 · 5mg</div>
        <div className="font-mono text-[10px]" style={{ color: MUTED }}>vial detected</div>
      </div>
      <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in oklab, ${MINT} 30%, white)` }}>
        <Check className="h-3.5 w-3.5" style={{ color: "#2F8C5C" }} />
      </div>
    </div>
  );
}

function StackVisual() {
  const chips = [
    { l: "SS-31", c: LAVENDER },
    { l: "MOTS-C", c: BABY_BLUE },
    { l: "BPC-157", c: MINT },
    { l: "Selank", c: PINK },
  ];
  return (
    <div className="rounded-xl bg-white/70 border border-[color:var(--border)] p-3">
      <div className="font-mono text-[10px] mb-2" style={{ color: MUTED }}>STACK · Longevity</div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.l}
            className="font-mono text-[10px] px-2 py-1 rounded-full"
            style={{
              backgroundColor: `color-mix(in oklab, ${c.c} 22%, white)`,
              color: "#3A2470",
              border: `1px solid color-mix(in oklab, ${c.c} 50%, white)`,
            }}
          >
            {c.l}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartVisual() {
  const reduce = useReducedMotion();
  const d = "M0 38 L25 30 L50 32 L75 20 L100 24 L125 14 L150 8";
  return (
    <div className="rounded-xl bg-white/70 border border-[color:var(--border)] p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono text-[10px]" style={{ color: MUTED }}>14-day outcomes</div>
        <div className="font-mono text-[10px]" style={{ color: "#2F8C5C" }}>83% potency</div>
      </div>
      <svg viewBox="0 0 150 44" className="w-full h-12">
        <defs>
          <linearGradient id="cv" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={MINT} stopOpacity="0.5" />
            <stop offset="100%" stopColor={MINT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={`${d} L150 44 L0 44 Z`}
          fill="url(#cv)"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke={MINT}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

/* -------------------- Metrics -------------------- */
function MetricsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-28">
      <Reveal>
        <div className="glass-card p-8 md:p-10 grid lg:grid-cols-[1.1fr_1.3fr_1fr] gap-8 items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: LAVENDER }}>
              Built for researchers · driven by community
            </div>
            <p className="mt-3 text-base leading-relaxed" style={{ color: INK }}>
              SAYNE is more than a tracker. It's a home for curious minds sharing real
              data and real protocols.
            </p>
            <Link to="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-medium" style={{ color: "#5A3FA6" }}>
              Explore Stack Feed <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Metric value="2,847+" label="Active Researchers" tint={LAVENDER} />
            <Metric value="18,390+" label="Stacks Tracked" tint={BABY_BLUE} />
            <Metric value="128,000+" label="Doses Logged" tint={MINT} />
            <Metric value="83%" label="Avg. Potency" tint={YELLOW} />
          </div>

          <div className="rounded-2xl bg-white/70 border border-[color:var(--border)] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: MUTED }}>Trending in Stack Feed</div>
            <TrendRow title="SS-31 + MOTS-C + BPC-157" sub="Longevity · 4 compounds" color={LAVENDER} />
            <div className="my-2 h-px" style={{ backgroundColor: BORDER }} />
            <TrendRow title="Gut Health Reset" sub="GI Support · 3 compounds" color={MINT} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Metric({ value, label, tint }: { value: string; label: string; tint: string }) {
  return (
    <div className="rounded-xl bg-white/70 border border-[color:var(--border)] p-4">
      <div className="font-display font-bold text-2xl md:text-3xl tracking-tight" style={{ color: INK }}>
        <span style={{ background: `linear-gradient(120deg, ${tint}, color-mix(in oklab, ${tint} 30%, ${INK}))`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          {value}
        </span>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{label}</div>
    </div>
  );
}

function TrendRow({ title, sub, color }: { title: string; sub: string; color: string }) {
  const reduce = useReducedMotion();
  const d = "M0 16 L12 12 L24 14 L36 8 L48 10 L60 4";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[12px] truncate" style={{ color: INK }}>{title}</div>
        <div className="font-mono text-[10px]" style={{ color: MUTED }}>{sub}</div>
      </div>
      <svg viewBox="0 0 60 20" className="w-16 h-6">
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        />
      </svg>
    </div>
  );
}

/* -------------------- Final CTA -------------------- */
function FinalCTA() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24">
      <Reveal>
        <div
          className="glass-card relative overflow-hidden text-center py-16 px-6"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${LAVENDER} 18%, white), color-mix(in oklab, ${BABY_BLUE} 12%, white))`,
          }}
        >
          <svg aria-hidden className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ctaArc" x1="0" x2="1">
                <stop offset="0%" stopColor={LAVENDER} stopOpacity="0" />
                <stop offset="50%" stopColor={LAVENDER} stopOpacity="0.5" />
                <stop offset="100%" stopColor={BABY_BLUE} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M-50 ${100 + i * 80} Q 600 ${20 + i * 60} 1250 ${160 + i * 80}`} stroke="url(#ctaArc)" strokeWidth="1.2" fill="none" />
            ))}
          </svg>
          <h2 className="relative font-display font-bold text-3xl md:text-5xl tracking-tight">
            Your stack. Your data. <span className="gradient-text">Your edge.</span>
          </h2>
          <p className="relative mt-4 text-sm md:text-base" style={{ color: MUTED }}>
            Join early access and be part of building the future of peptide tracking.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="liquid-button shadow-md hover:opacity-95"
              style={{
                background: `linear-gradient(135deg, ${BABY_BLUE} 0%, ${LAVENDER} 120%)`,
                color: "#1F1240",
              }}
            >
              <Link to="/signup">
                Start Free — It's Early Access <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="relative mt-5 font-mono text-[11px]" style={{ color: MUTED }}>
            No credit card required · Cancel anytime
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------- Footer -------------------- */
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BORDER}` }} className="relative z-10 bg-white/40 backdrop-blur">
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

/* -------------------- Reveal helper -------------------- */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
