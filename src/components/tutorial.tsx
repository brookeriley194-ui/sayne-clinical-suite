import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Share } from "lucide-react";

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
  cta?: string;                 // override Next label
  mobileOnly?: boolean;
  beforeShow?: () => void | Promise<void>;
};

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
      selector: "import-from-ai",
      title: "Start with your protocol.",
      body: "Most people start here. Got a protocol from Claude, ChatGPT, or Gemini? Paste it and Sayne organizes it into a stack automatically — no manual entry.",
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
    },
    {
      id: "calculator",
      route: "/dashboard/my-vials",
      selector: "floating-calc",
      title: "Never guess a dose.",
      body: "Tap the calculator on any page (or Calculate Dose on a vial) and Sayne shows your exact draw volume on your syringe. No math required.",
    },
    {
      id: "today",
      route: "/dashboard/today",
      selector: "today-calendar",
      title: "Your daily command center.",
      body: "Today shows your AM and PM doses. Check them off as you take them — Sayne automatically updates your vial inventory and builds your tracking history.",
    },
    {
      id: "research-log",
      route: "/dashboard/protocols",
      selector: "research-log-tab",
      title: "Track outcomes, learn from others.",
      body: "Log how you feel each week to build your outcome curve over time. Browse the community Stack Feed to see what protocols others are running.",
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
    if (!active || !selector) { setRect(null); return; }
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

  // Card size estimate (used to compute placement)
  const cardW = Math.min(360, (typeof window !== "undefined" ? window.innerWidth : 360) - 24);
  const cardH = 220;
  const pos = !isCenter && rect ? tooltipPosition(rect, cardW, cardH) : null;

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;
  const finish = () => {
    try { localStorage.setItem(TUTORIAL_FLAG, "true"); } catch {}
    navigate({ to: "/dashboard/my-vials" }).catch(() => {});
    onClose();
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
            isCenter || !pos
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
            className="bg-card rounded-[16px] p-5"
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
                onClick={finish}
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
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {step.body}
            </p>

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
