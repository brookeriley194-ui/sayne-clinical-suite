import { useEffect, useState, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X, Beaker, Calculator, Layers, CalendarDays, Users2, Smartphone, Share } from "lucide-react";

export const TUTORIAL_FLAG = "sayne_tutorial_completed";

type DeviceKind = "ios" | "android" | "desktop";
function detectDevice(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function Callout({
  tone,
  children,
}: {
  tone: "blue" | "lavender" | "mint" | "yellow";
  children: ReactNode;
}) {
  const map = {
    blue:     { accent: "#89CFF0", bg: "rgba(137,207,240,0.10)", text: "#3a7fa3" },
    lavender: { accent: "#C9A8F5", bg: "rgba(201,168,245,0.12)", text: "#6b4ca8" },
    mint:     { accent: "#98E4B2", bg: "rgba(152,228,178,0.14)", text: "#3d8a5a" },
    yellow:   { accent: "#FFD580", bg: "rgba(255,213,128,0.16)", text: "#9a6b1e" },
  }[tone];
  return (
    <div
      className="relative rounded-[10px] p-3 pl-4 text-sm leading-relaxed"
      style={{ background: map.bg, color: map.text }}
    >
      <span
        className="absolute left-0 top-2 bottom-2 w-[4px] rounded-full"
        style={{ background: map.accent }}
      />
      {children}
    </div>
  );
}

/* ---------- Mock illustrations using real Sayne card styles ---------- */

function VialMock({
  name, percent, color, status, doses,
}: { name: string; percent: number; color: string; status: string; doses: string }) {
  return (
    <div className="sayne-card p-4 w-full">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-display font-semibold text-sm">{name}</div>
        <span
          className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full"
          style={{ background: "var(--panel)", color: "var(--muted-foreground)" }}
        >
          {status}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground font-mono mb-2">{doses}</div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--panel)" }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>Potency</span><span>{percent}%</span>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle at 50% 50%, #C9A8F5 0%, transparent 60%)" }}
      />
      <div className="flex items-center gap-3">
        <span className="font-display text-5xl font-bold tracking-tight">SAYNE</span>
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden>
          <path d="M4 30 Q21 4 38 30" stroke="#C9A8F5" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="38" cy="30" r="3" fill="#89CFF0" />
        </svg>
      </div>
    </div>
  );
}

function StepVials() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <VialMock name="BPC-157" percent={94} color="#89CFF0" status="Open" doses="18 / 20 doses" />
      <VialMock name="Selank" percent={61} color="#FFB3C6" status="Low" doses="6 / 15 doses" />
    </div>
  );
}

function StepCalculator() {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
      <div className="sayne-card p-4 space-y-2">
        {[
          ["Compound", "BPC-157"],
          ["Vial size", "5 mg"],
          ["BAC water", "2 mL"],
          ["Dose", "250 mcg"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{v}</span>
          </div>
        ))}
        <div className="mt-3 rounded-[10px] p-3" style={{ background: "var(--panel)" }}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Draw volume</div>
          <div className="font-mono text-2xl text-foreground">0.10 mL</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-10 h-44">
          <div className="absolute inset-x-1 top-0 bottom-6 rounded-md border-2"
               style={{ borderColor: "#89CFF0", background: "rgba(137,207,240,0.10)" }}>
            <div className="absolute inset-x-0 bottom-0 rounded-b-md"
                 style={{ height: "18%", background: "#89CFF0" }} />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-6"
               style={{ background: "#2D1F4A" }} />
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">1 mL</div>
      </div>
    </div>
  );
}

function StepStack() {
  return (
    <div className="space-y-3">
      <div className="rounded-[12px] p-3" style={{ background: "rgba(201,168,245,0.18)" }}>
        <div className="text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: "#6b4ca8" }}>
          Paste from AI
        </div>
        <div className="text-xs leading-relaxed font-mono text-foreground/70">
          "Run BPC-157 250mcg subq once daily for 4 weeks…"
        </div>
      </div>
      <div className="sayne-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-semibold text-sm">BPC-157</div>
            <div className="text-[11px] text-muted-foreground font-mono">250 mcg · once daily</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "rgba(152,228,178,0.25)", color: "#3d8a5a" }}>
            Detected
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--panel)" }}>
          <div className="h-full rounded-full" style={{ width: "100%", background: "#98E4B2" }} />
        </div>
        <div className="mt-1 text-[10px] font-mono text-muted-foreground text-right">6 / 6 fields</div>
      </div>
    </div>
  );
}

function StepToday() {
  const Item = ({ label, done }: { label: string; done?: boolean }) => (
    <div className="flex items-center gap-2 text-sm">
      <span
        className="inline-flex items-center justify-center h-4 w-4 rounded border"
        style={{ borderColor: "var(--border)", background: done ? "#89CFF0" : "transparent" }}
      >
        {done && <span className="text-[10px] text-foreground">✓</span>}
      </span>
      <span className={done ? "line-through text-muted-foreground" : ""}>{label}</span>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="sayne-card p-3">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Wed 27</div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground mb-1">AM</div>
            <Item label="AOD 9604 — 300 mcg" done />
            <Item label="Selank — 200 mcg" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-muted-foreground mb-1">PM</div>
            <Item label="Semax — 400 mcg" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Active", "5"], ["Doses", "1/3"], ["Tracked", "14d"]].map(([k, v]) => (
          <div key={k} className="sayne-card p-2 text-center">
            <div className="font-display text-lg font-bold">{v}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepInstall({ device }: { device: DeviceKind }) {
  if (device === "ios") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="sayne-card p-4 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center"
                 style={{ background: "rgba(137,207,240,0.18)" }}>
              <Share className="h-5 w-5" style={{ color: "#3a7fa3" }} />
            </div>
            <div>
              <div className="text-sm font-medium">Share</div>
              <div className="text-[11px] text-muted-foreground font-mono">Safari toolbar</div>
            </div>
          </div>
          <span className="text-xl">→</span>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center"
                 style={{ background: "rgba(201,168,245,0.18)" }}>
              <Smartphone className="h-5 w-5" style={{ color: "#6b4ca8" }} />
            </div>
            <div className="text-sm font-medium">Add to Home Screen</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Tap the Share icon at the bottom of Safari, then tap Add to Home Screen.
        </p>
      </div>
    );
  }
  if (device === "android") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="sayne-card p-4 w-full">
          <div className="flex items-center justify-between text-sm">
            <span>Chrome menu</span>
            <span className="font-mono text-lg">⋮</span>
          </div>
          <div className="mt-3 rounded-[10px] p-3" style={{ background: "rgba(137,207,240,0.14)" }}>
            <div className="text-sm font-medium" style={{ color: "#3a7fa3" }}>Install app</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Tap the menu in Chrome, then tap Install app.
        </p>
      </div>
    );
  }
  return (
    <div className="sayne-card p-5 text-center">
      <Smartphone className="h-8 w-8 mx-auto mb-2" style={{ color: "#C9A8F5" }} />
      <div className="text-sm">
        Sayne works on your phone too — open <span className="font-mono">sayne.io</span> on your phone to install it.
      </div>
    </div>
  );
}

function StepFeed() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="sayne-card p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Weekly check-in</div>
        {[["Energy", 78], ["Sleep", 65], ["Recovery", 82], ["Mood", 71]].map(([k, v]) => (
          <div key={k as string}>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{k}</span><span>{v}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--panel)" }}>
              <div className="h-full rounded-full" style={{ width: `${v}%`, background: "#C9A8F5" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="sayne-card p-3 space-y-2">
        <div className="font-display font-semibold text-sm">BPC-157 protocol</div>
        <div className="text-[10px] font-mono text-muted-foreground">4-week cycle · subq</div>
        <div className="rounded-[10px] p-2" style={{ background: "rgba(152,228,178,0.18)" }}>
          <div className="text-[10px] font-mono" style={{ color: "#3d8a5a" }}>Outcome</div>
          <div className="font-display text-xl font-bold" style={{ color: "#3d8a5a" }}>8.2 / 10</div>
        </div>
        <button
          className="w-full text-xs font-medium rounded-md py-1.5"
          style={{ background: "#89CFF0", color: "#2D1F4A" }}
        >
          Import This Stack
        </button>
      </div>
    </div>
  );
}

/* ---------- Step config ---------- */

type Step = {
  title: string;
  italicSub?: string;
  body: string;
  visual: ReactNode;
  callout?: { tone: "blue" | "lavender" | "mint" | "yellow"; text: string };
  icon?: React.ComponentType<{ className?: string }>;
};

function buildSteps(device: DeviceKind): Step[] {
  return [
    {
      title: "Welcome to Sayne.",
      italicSub: "Keeping Peptides Sayne.",
      body: "Sayne is your personal peptide research companion. Track your vials, manage your stack, monitor compound potency, and log your outcomes — all in one place. This takes 60 seconds.",
      visual: <StepWelcome />,
    },
    {
      title: "Start with your vials.",
      body: "Every compound you have lives in My Vials. Add vials manually, or use Scan Receipt to upload a purchase receipt and Sayne adds them automatically. Each vial tracks its remaining doses, concentration, and potency in real time.",
      visual: <StepVials />,
      callout: { tone: "blue", text: "Tip: Use Scan Receipt after every peptide order. Sayne adds all your vials in one tap." },
      icon: Beaker,
    },
    {
      title: "Never guess your draw volume again.",
      body: "The Dose Calculator computes your exact draw volume based on your vial size, BAC water amount, and desired dose. Select your syringe type and Sayne shows you exactly where to draw to. Access it from any page using the calculator button.",
      visual: <StepCalculator />,
      callout: { tone: "lavender", text: "Tip: Tap Calculate Dose on any vial card to open the calculator pre-filled for that vial." },
      icon: Calculator,
    },
    {
      title: "Build your stack.",
      body: "A stack is your active research protocol — the compounds you are running, how much, and how often. Build one manually or paste a protocol you got from Claude, ChatGPT, or Gemini and Sayne parses it automatically. Your stack feeds your Today dashboard.",
      visual: <StepStack />,
      callout: { tone: "mint", text: "Tip: Copy your AI protocol and paste it directly into Import from AI. Sayne handles the rest." },
      icon: Layers,
    },
    {
      title: "Your daily command center.",
      body: "The Today page shows everything happening right now. Your AM and PM doses for the day with checkboxes. Your active stack summary. Your vial inventory at a glance. Check off doses as you take them — Sayne automatically updates your vial inventory.",
      visual: <StepToday />,
      callout: { tone: "yellow", text: "Tip: Check off your doses every day. This builds your outcome data over time." },
      icon: CalendarDays,
    },
    {
      title: "Add Sayne to your home screen.",
      body: "Sayne works best as an app on your phone. No App Store needed — add it to your home screen in two taps and it opens just like a native app.",
      visual: <StepInstall device={device} />,
      callout: { tone: "blue", text: "Installed apps load faster and feel just like a native app." },
      icon: Smartphone,
    },
    {
      title: "Track outcomes. Share what works.",
      body: "The Stack Journal lets you log how you feel each week while on a protocol — energy, sleep, recovery, and mood. Over time this builds your personal outcome curve. When a cycle is complete you can share it anonymously to the Stack Feed so others can learn from your experience.",
      visual: <StepFeed />,
      callout: { tone: "lavender", text: "Tip: Weekly check-ins take 60 seconds and unlock your full outcome curve at cycle end." },
      icon: Users2,
    },
  ];
}

/* ---------- Modal ---------- */

export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const device = useMemo(detectDevice, []);
  const steps = useMemo(() => buildSteps(device), [device]);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => { if (open) setIndex(0); }, [open]);

  if (!open) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const finish = () => {
    try { localStorage.setItem(TUTORIAL_FLAG, "true"); } catch {}
    onClose();
  };

  const next = () => { if (isLast) return finish(); setDir(1); setIndex((i) => i + 1); };
  const prev = () => { if (index === 0) return; setDir(-1); setIndex((i) => i - 1); };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center"
         style={{ background: "rgba(201,168,245,0.55)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div
        className="relative bg-card w-full md:max-w-[560px] md:rounded-[20px] md:my-8 overflow-hidden flex flex-col"
        style={{
          boxShadow: "0 30px 80px -28px rgba(120,90,200,0.35), 0 12px 30px -12px rgba(120,90,200,0.18)",
          maxHeight: "100dvh",
        }}
      >
        {/* Header: dots + skip */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <motion.span
                key={i}
                animate={{
                  width: i === index ? 22 : 6,
                  backgroundColor: i === index ? "#89CFF0" : "rgba(201,168,245,0.3)",
                }}
                transition={{ duration: 0.25 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Skip tutorial <X className="h-3 w-3" />
          </button>
        </div>

        {/* Body */}
        <div className="relative px-6 pt-6 pb-4 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              initial={{ x: dir * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -dir * 40, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  {step.title}
                </h2>
                {step.italicSub && (
                  <p className="italic font-mono text-sm" style={{ color: "#C9A8F5" }}>
                    {step.italicSub}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              <div className="py-2">{step.visual}</div>
              {step.callout && <Callout tone={step.callout.tone}>{step.callout.text}</Callout>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between"
             style={{ borderColor: "color-mix(in oklab, var(--border) 60%, transparent)" }}>
          <span className="text-[11px] font-mono text-muted-foreground">
            Step {index + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prev} disabled={index === 0}>
              Previous
            </Button>
            {isLast ? (
              <Button
                size="sm"
                onClick={finish}
                style={{ background: "#89CFF0", color: "#2D1F4A" }}
                className="hover:opacity-90"
              >
                Start Using Sayne →
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={next}
                style={{ background: "#89CFF0", color: "#2D1F4A" }}
                className="hover:opacity-90"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
