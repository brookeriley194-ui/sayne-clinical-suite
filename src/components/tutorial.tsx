import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Share, Layers, FlaskConical, Sparkles } from "lucide-react";

export const TUTORIAL_FLAG = "sayne_tutorial_completed";


type DeviceKind = "ios" | "android" | "desktop";
function detectDevice(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}
function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/* ------------------------- Logo (matches dashboard) ------------------------- */
function SayneWordmark({ size = "lg" }: { size?: "lg" | "xl" }) {
  const cls = size === "xl" ? "text-5xl" : "text-3xl";
  const dot = size === "xl" ? "h-3 w-3" : "h-2 w-2";
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`font-display ${cls} font-bold tracking-tight text-foreground`}>SAYNE</span>
      <span aria-hidden className={`${dot} rounded-full`} style={{ backgroundColor: "var(--secondary)" }} />
    </div>
  );
}

/* ------------------------------ Step config ------------------------------- */

type Placement = "auto" | "center";

type TourStep = {
  id: string;
  route?: string;
  selector?: string;            // data-tour key (without brackets)
  placement?: Placement;
  title: string;
  italicSub?: string;
  body: string;
  note?: string;                // optional callout shown below body
  visual?: ReactNode;           // optional inline visual
  cta?: string;                 // override Next label
  mobileOnly?: boolean;
  beforeShow?: () => void | Promise<void>;
};

/* ----------------------- Inline visual: draining vial ---------------------- */
function DrainingVialVisual() {
  return (
    <div className="flex items-center justify-center my-3">
      <div className="relative" style={{ width: 64, height: 96 }}>
        {/* glow */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse"
          style={{ background: "radial-gradient(circle, rgba(137,207,240,0.55), transparent 70%)" }}
        />
        <svg viewBox="0 0 64 96" width="64" height="96" className="relative">
          {/* cap */}
          <rect x="20" y="2" width="24" height="8" rx="2" fill="#9aa3b2" />
          <rect x="22" y="10" width="20" height="6" rx="1" fill="#cdd3dc" />
          {/* body */}
          <rect x="14" y="16" width="36" height="74" rx="6" fill="rgba(255,255,255,0.06)" stroke="#C9A8F5" strokeWidth="1.5" />
          {/* liquid clip */}
          <defs>
            <clipPath id="vialClip">
              <rect x="15.5" y="17.5" width="33" height="71" rx="5" />
            </clipPath>
            <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9CD7F0" />
              <stop offset="100%" stopColor="#3FA8D6" />
            </linearGradient>
          </defs>
          <g clipPath="url(#vialClip)">
            <motion.rect
              x="14"
              y="20"
              width="36"
              height="70"
              fill="url(#liquidGrad)"
              initial={{ y: 20 }}
              animate={{ y: [20, 40, 55, 70, 20] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* surface shimmer */}
            <motion.ellipse
              cx="32"
              rx="16"
              ry="1.6"
              fill="rgba(255,255,255,0.55)"
              initial={{ cy: 22 }}
              animate={{ cy: [22, 42, 57, 72, 22] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
          {/* drop falling out */}
          <motion.circle
            cx="32"
            cy="92"
            r="2.2"
            fill="#3FA8D6"
            initial={{ cy: 92, opacity: 0 }}
            animate={{ cy: [92, 96, 92], opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeIn" }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ------------------- Inline visual: calculator preview ------------------- */
function CalculatorPreviewVisual() {
  // Cycle through a few "draw volumes" to show the syringe adjusting
  const [step, setStep] = useState(0);
  const frames = useMemo(
    () => [
      { unit: "mcg", value: "250", fill: 0.25, ml: "0.25", units: 25 },
      { unit: "mg",  value: "1",   fill: 0.50, ml: "0.50", units: 50 },
      { unit: "units", value: "75", fill: 0.75, ml: "0.75", units: 75 },
      { unit: "mL",  value: "0.40", fill: 0.40, ml: "0.40", units: 40 },
    ],
    [],
  );
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % frames.length), 1600);
    return () => window.clearInterval(id);
  }, [frames.length]);
  const f = frames[step];

  return (
    <div
      className="mt-3 rounded-lg p-3"
      style={{
        background: "color-mix(in oklab, var(--primary) 6%, transparent)",
        border: "1px solid rgba(201,168,245,0.30)",
      }}
    >
      {/* Unit toggle */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
          Desired dose
        </span>
        <div className="inline-flex rounded-md border bg-background p-0.5">
          {(["mcg", "mg", "IU", "units", "mL"] as const).map((u) => (
            <span
              key={u}
              className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                f.unit === u ? "text-primary-foreground" : "text-muted-foreground"
              }`}
              style={f.unit === u ? { background: "#C9A8F5", color: "#2D1F4A" } : undefined}
            >
              {u}
            </span>
          ))}
        </div>
      </div>

      {/* Animated value */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${f.unit}-${f.value}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="font-mono text-lg tabular-nums mb-2"
        >
          {f.value} <span className="text-xs text-muted-foreground">{f.unit}</span>
        </motion.div>
      </AnimatePresence>

      {/* Mini syringe with animated blue fill */}
      <svg viewBox="0 0 200 40" className="w-full h-auto">
        <defs>
          <linearGradient id="tourSyrFluid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bde3f9" />
            <stop offset="100%" stopColor="#3FA8D6" />
          </linearGradient>
          <clipPath id="tourSyrClip">
            <rect x="20" y="14" width="140" height="14" rx="3" />
          </clipPath>
        </defs>
        {/* needle */}
        <rect x="160" y="20" width="22" height="2" fill="#9B8EC4" rx="1" />
        <rect x="156" y="16" width="6" height="10" fill="#9B8EC4" rx="1" />
        {/* barrel */}
        <rect x="20" y="14" width="140" height="14" rx="3" fill="#ffffff" stroke="#C9BFE5" strokeWidth="1" />
        {/* fluid (fills from needle end → animated) */}
        <g clipPath="url(#tourSyrClip)">
          <motion.rect
            y="14"
            height="14"
            fill="url(#tourSyrFluid)"
            initial={false}
            animate={{ x: 20 + 140 * (1 - f.fill), width: 140 * f.fill }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </g>
        {/* stopper */}
        <motion.rect
          y="14"
          width="4"
          height="14"
          fill="#2D1F4A"
          initial={false}
          animate={{ x: 20 + 140 * (1 - f.fill) - 4 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* plunger rod */}
        <motion.rect
          y="20"
          height="2"
          fill="#9B8EC4"
          initial={false}
          animate={{ width: Math.max(0, 20 + 140 * (1 - f.fill) - 8) }}
          x="8"
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* flange */}
        <rect x="6" y="10" width="4" height="22" rx="1" fill="#9B8EC4" />
      </svg>

      {/* Readout */}
      <div className="flex items-center justify-between mt-1 text-[11px]">
        <span className="text-muted-foreground">Draw</span>
        <span className="font-mono tabular-nums">
          <span className="text-base text-foreground">{f.ml}</span>
          <span className="text-muted-foreground ml-1">mL</span>
          <span className="text-muted-foreground mx-1">·</span>
          <span className="text-foreground">{f.units}</span>
          <span className="text-muted-foreground ml-1">u</span>
        </span>
      </div>
    </div>
  );
}



function buildSteps(device: DeviceKind): TourStep[] {
  return [
    {
      id: "welcome",
      route: "/dashboard/today",
      placement: "center",
      title: "Welcome to Sayne.",
      italicSub: "Keeping Peptides Sayne.",
      body: "Let's take a quick tour. We'll walk through the actual app so you know exactly how everything works. Takes about 60 seconds.",
      cta: "Start the tour",
    },
    {
      id: "import-from-ai",
      route: "/dashboard/protocols",
      selector: "stack-actions",
      title: "Start with your protocol.",
      body: "Most people start here. Got a protocol from Claude, ChatGPT, or Gemini? Paste it into Import from AI and Sayne organizes it into a stack automatically. No AI protocol? Tap Build a Stack to create one manually.",
      note: "Don't want to build a stack yet? We got you — head to My Vials to add your vials first.",
    },
    {
      id: "stack-card",
      route: "/dashboard/protocols",
      selector: "stack-card",
      title: "Your stacks live here.",
      body: "Each stack holds all the compounds you're running together, with doses, frequency, and how many days are left. One protocol becomes one organized stack.",
    },
    {
      id: "vials",
      route: "/dashboard/my-vials",
      selector: "scan-receipt",
      title: "Track your inventory.",
      body: "Your vials track remaining doses and real-time potency. Add them manually, or tap Import Receipt to upload a purchase receipt and Sayne adds them automatically.",
      note: "Didn't import all your vials from the My Stacks tab? No worries — you can upload the rest right here.",
    },
    {
      id: "calculator",
      route: "/dashboard/my-vials",
      selector: "floating-calc",
      title: "Never guess a dose.",
      body: "Tap the calculator on any page (or Calculate Dose on a vial) and Sayne shows your exact draw volume on your syringe. Whether you use mcg, mg, units, or mL, your syringe will adjust automatically. No math required.",
      note: "On the go and need a quick calculator? It lives on every page so you can pull it up anytime.",
      visual: <CalculatorPreviewVisual />,
    },
    {
      id: "today",
      route: "/dashboard/today",
      selector: "today-calendar",
      title: "Your daily command center.",
      body: "Today shows your AM and PM doses. Check them off as you take them — and don't forget to log them daily so you don't break your streak.",
      note: "Vials automatically drain as you log doses. When inventory hits a low threshold, Sayne reminds you to reorder so you never run out mid-protocol.",
      visual: <DrainingVialVisual />,
    },

    {
      id: "research-log",
      route: "/dashboard/protocols",
      selector: "research-log-tab",
      title: "Track your outcomes.",
      body: "Log how you feel each week in the Research Log to build your outcome curve over time — see what's actually working for you across energy, sleep, recovery, and mood.",
    },
    {
      id: "stack-feed",
      route: "/dashboard/stack-feed",
      selector: "stack-feed-header",
      title: "Learn from the community.",
      body: "Browse the Stack Feed to see real protocols other researchers are running, filter by goal or compound, and import a stack into your own setup with one tap.",
      cta: device === "desktop" ? "Start Using Sayne →" : "Next",
    },
    {
      id: "install",
      placement: "center",
      mobileOnly: true,
      title: "Add Sayne to your home screen.",
      body:
        device === "ios"
          ? "Tap the Share icon at the bottom of Safari, then choose Add to Home Screen."
          : "Tap the Chrome menu (⋮) in the top right, then tap Install app.",
      cta: "Start Using Sayne →",
    },
  ];
}

/* ------------------------------- Geometry --------------------------------- */

type Rect = { x: number; y: number; w: number; h: number };

function useSpotlight(selector: string | undefined, active: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    // Always clear stale rect first so the previous step's spotlight
    // doesn't briefly appear as a "random white box" on the new page.
    setRect(null);
    if (!active || !selector) return;
    let raf = 0;
    let tries = 0;
    let stopped = false;


    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (!el) {
        if (tries++ < 30 && !stopped) {
          raf = window.setTimeout(measure, 100) as unknown as number;
        } else {
          setRect(null);
        }
        return;
      }
      // Scroll into view smoothly
      try { el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch {}
      // Allow scroll animation to settle, then measure
      window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      }, 250);
    };

    measure();

    const onResize = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      stopped = true;
      clearTimeout(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [selector, active]);

  return rect;
}

function tooltipPosition(rect: Rect | null, cardW: number, cardH: number) {
  if (!rect) return null;
  const pad = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Prefer below, then above, then right, then left
  const below = rect.y + rect.h + pad + cardH <= vh;
  const above = rect.y - pad - cardH >= 0;
  const right = rect.x + rect.w + pad + cardW <= vw;

  let top: number;
  let left: number;
  if (below) {
    top = rect.y + rect.h + pad;
    left = Math.min(Math.max(rect.x, 12), vw - cardW - 12);
  } else if (above) {
    top = rect.y - pad - cardH;
    left = Math.min(Math.max(rect.x, 12), vw - cardW - 12);
  } else if (right) {
    top = Math.min(Math.max(rect.y, 12), vh - cardH - 12);
    left = rect.x + rect.w + pad;
  } else {
    top = Math.min(Math.max(rect.y, 12), vh - cardH - 12);
    left = Math.max(rect.x - pad - cardW, 12);
  }
  // Final clamp so the card can never sit off-screen
  top = Math.max(12, Math.min(top, Math.max(12, vh - cardH - 12)));
  left = Math.max(12, Math.min(left, Math.max(12, vw - cardW - 12)));
  return { top, left };

}

/* --------------------------------- Tour ----------------------------------- */

export function Tutorial({
  open,
  onClose,
  startStep = 0,
}: { open: boolean; onClose: () => void; startStep?: number }) {
  const device = useMemo(detectDevice, []);
  const allSteps = useMemo(() => buildSteps(device), [device]);
  const steps = useMemo(
    () => allSteps.filter((s) => (s.mobileOnly ? isMobileViewport() : true)),
    [allSteps],
  );
  const [index, setIndex] = useState(startStep);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setIndex(Math.min(Math.max(startStep, 0), steps.length - 1));
  }, [open, startStep, steps.length]);

  // Navigate when step changes
  useEffect(() => {
    if (!open) return;
    const target = steps[index]?.route;
    if (target) navigate({ to: target }).catch(() => {});
  }, [open, index, steps, navigate]);

  const step = steps[index];
  const isCenter = step?.placement === "center" || !step?.selector;
  const rect = useSpotlight(isCenter ? undefined : step?.selector, open);

  // Track viewport so the card can become a bottom sheet on phones
  const [vw, setVw] = useState<number>(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  const isPhone = vw < 768;

  // Card size estimate (used to compute placement)
  const cardW = Math.min(360, vw - 24);
  const isCalcStep = step?.id === "calculator";
  const cardH = isCalcStep ? 460 : 220;
  const pos = !isCenter && !isPhone && rect ? tooltipPosition(rect, cardW, cardH) : null;


  const [showChoice, setShowChoice] = useState(false);

  const closeChoice = () => {
    setShowChoice(false);
    onClose();
  };

  if (showChoice) {
    return <CompletionChoice onClose={closeChoice} />;
  }

  if (!open || !step) {
    return null;
  }

  const isLast = index === steps.length - 1;
  const finish = () => {
    try { localStorage.setItem(TUTORIAL_FLAG, "true"); } catch {}
    setShowChoice(true);
  };
  const skip = () => {
    try { localStorage.setItem(TUTORIAL_FLAG, "true"); } catch {}
    setShowChoice(true);
  };
  const next = () => (isLast ? finish() : setIndex((i) => i + 1));
  const prev = () => (index === 0 ? null : setIndex((i) => i - 1));

  const ctaLabel = step.cta ?? (isLast ? "Start Using Sayne →" : "Next");


  // Spotlight padding around the highlighted element
  const SP = 8;
  const spotX = rect ? rect.x - SP : 0;
  const spotY = rect ? rect.y - SP : 0;
  const spotW = rect ? rect.w + SP * 2 : 0;
  const spotH = rect ? rect.h + SP * 2 : 0;

  return (
    <div className="fixed inset-0 z-[100]" aria-modal role="dialog">
      {/* Overlay with cutout (SVG mask) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ touchAction: "none" }}
      >
        <defs>
          <mask id="sayne-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && !isCenter && (
              <motion.rect
                initial={false}
                animate={{ x: spotX, y: spotY, width: spotW, height: spotH }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 12, 30, 0.62)"
          mask="url(#sayne-tour-mask)"
        />
      </svg>

      {/* Lavender glow ring around the spotlight */}
      {rect && !isCenter && (
        <motion.div
          initial={false}
          animate={{ x: spotX, y: spotY, width: spotW, height: spotH }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="absolute pointer-events-none"
          style={{
            top: 0,
            left: 0,
            borderRadius: 14,
            border: "2px solid #C9A8F5",
            boxShadow:
              "0 0 0 6px rgba(201,168,245,0.18), 0 0 32px 4px rgba(201,168,245,0.45)",
          }}
        />
      )}

      {/* Tooltip / centered card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          className="absolute pointer-events-auto"
          style={
            isPhone
              ? {
                  // Bottom sheet on phones — always fully on-screen
                  left: 12,
                  right: 12,
                  bottom: "calc(12px + env(safe-area-inset-bottom))",
                  width: "auto",
                }
              : isCenter || !pos
                ? {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: `min(${cardW + 40}px, calc(100vw - 24px))`,
                  }
                : { top: pos.top, left: pos.left, width: cardW }
          }
        >
          <div
            className="bg-card rounded-[16px] p-5 overflow-y-auto"
            style={{ maxHeight: "calc(100dvh - 24px - env(safe-area-inset-bottom))" }}
            style={{
              border: "1.5px solid #C9A8F5",
              boxShadow:
                "0 24px 60px -20px rgba(120,90,200,0.45), 0 8px 24px -10px rgba(120,90,200,0.25)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 gap-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Step {index + 1} of {steps.length}
              </span>
              <button
                onClick={skip}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Skip tour <X className="h-3 w-3" />
              </button>
            </div>

            {/* Welcome step logo */}
            {step.id === "welcome" && (
              <div className="flex justify-center mb-4 mt-1">
                <SayneWordmark size="xl" />
              </div>
            )}

            {/* Install step icon */}
            {step.id === "install" && (
              <div className="flex justify-center mb-3">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(201,168,245,0.18)" }}
                >
                  {device === "ios" ? (
                    <Share className="h-6 w-6" style={{ color: "#6b4ca8" }} />
                  ) : (
                    <Smartphone className="h-6 w-6" style={{ color: "#6b4ca8" }} />
                  )}
                </div>
              </div>
            )}

            <h3 className="font-display text-xl font-bold leading-tight text-foreground">
              {step.title}
            </h3>
            {step.italicSub && (
              <p className="italic font-mono text-sm mt-1" style={{ color: "#C9A8F5" }}>
                {step.italicSub}
              </p>
            )}

            {/* For the calculator step, the tip sits right under the title */}
            {step.id === "calculator" && step.note && (
              <div
                className="mt-3 rounded-md px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: "rgba(201,168,245,0.12)",
                  border: "1px solid rgba(201,168,245,0.35)",
                  color: "var(--foreground)",
                }}
              >
                <span className="font-mono uppercase tracking-wider text-[9px] mr-1" style={{ color: "#8a6dc9" }}>
                  Tip
                </span>
                {step.note}
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {step.body}
            </p>
            {step.visual}
            {step.id !== "calculator" && step.note && (
              <div
                className="mt-3 rounded-md px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: "rgba(201,168,245,0.12)",
                  border: "1px solid rgba(201,168,245,0.35)",
                  color: "var(--foreground)",
                }}
              >
                <span className="font-mono uppercase tracking-wider text-[9px] mr-1" style={{ color: "#8a6dc9" }}>
                  Tip
                </span>
                {step.note}
              </div>
            )}


            {/* Footer */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={index === 0}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                onClick={next}
                style={{ background: "#89CFF0", color: "#2D1F4A" }}
                className="hover:opacity-90"
              >
                {ctaLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* --------------------- Completion Choice Modal --------------------- */

type ChoiceKey = "stack" | "vials" | "feed";

export function CompletionChoice({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [burst, setBurst] = useState<ChoiceKey | null>(null);

  const choices: { key: ChoiceKey; label: string; sub: string; to: string; Icon: typeof Layers }[] = [
    {
      key: "stack",
      label: "I already have a stack protocol — let's build.",
      sub: "Go to My Stacks and create or import your protocol.",
      to: "/dashboard/protocols",
      Icon: Layers,
    },
    {
      key: "vials",
      label: "I don't have a stack protocol — add vials.",
      sub: "Start by logging the vials you already have.",
      to: "/dashboard/my-vials",
      Icon: FlaskConical,
    },
    {
      key: "feed",
      label: "I want to explore stacks.",
      sub: "Browse community protocols on the Stack Feed.",
      to: "/dashboard/stack-feed",
      Icon: Sparkles,
    },
  ];

  const pick = (c: (typeof choices)[number]) => {
    if (burst) return;
    setBurst(c.key);
    window.setTimeout(() => {
      navigate({ to: c.to }).catch(() => {});
      onClose();
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(15,12,30,0.72)", backdropFilter: "blur(6px)" }} />

      {/* Ambient pulsing glow behind card */}
      <motion.div
        aria-hidden
        className="absolute"
        style={{
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,245,0.45), transparent 65%)",
          filter: "blur(40px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative w-full max-w-md rounded-[18px] p-6"
        style={{
          background: "var(--card)",
          border: "1.5px solid #C9A8F5",
          boxShadow:
            "0 30px 80px -20px rgba(120,90,200,0.55), 0 0 0 1px rgba(201,168,245,0.25)",
        }}
      >
        <div className="text-center mb-5">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#8a6dc9" }}>
            You're all set
          </span>
          <h3 className="font-display text-2xl font-bold leading-tight mt-1">Where do you want to start?</h3>
          <p className="text-sm text-muted-foreground mt-1">Pick the path that fits you — you can always switch later.</p>
        </div>

        <div className="space-y-3">
          {choices.map((c) => {
            const active = burst === c.key;
            return (
              <button
                key={c.key}
                onClick={() => pick(c)}
                className="relative w-full text-left rounded-xl px-4 py-3 flex items-start gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "rgba(201,168,245,0.08)",
                  border: "1px solid rgba(201,168,245,0.35)",
                }}
              >
                <span
                  className="mt-0.5 h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(201,168,245,0.22)" }}
                >
                  <c.Icon className="h-5 w-5" style={{ color: "#6b4ca8" }} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-sm leading-snug">{c.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{c.sub}</span>
                </span>

                {/* glowing ring on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
                  style={{
                    boxShadow:
                      "0 0 0 1px rgba(201,168,245,0.6), 0 0 24px 2px rgba(201,168,245,0.45)",
                  }}
                />

                {/* purple burst on click */}
                <AnimatePresence>
                  {active && (
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0.9, scale: 0.2 }}
                      animate={{ opacity: 0, scale: 2.4 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.65, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 rounded-xl"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(201,168,245,0.75), rgba(201,168,245,0) 65%)",
                      }}
                    />
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 mx-auto block text-[11px] text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
      </motion.div>
    </div>
  );
}

