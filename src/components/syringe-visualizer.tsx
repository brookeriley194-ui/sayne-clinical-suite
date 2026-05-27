import { useEffect, useMemo, useState } from "react";

type Props = {
  compound: string;
  dose_mcg: number;
  concentration_mcg_per_ml: number;
  potency_score: number; // 0-100
  /** Optional: days until potency dips below 70%. If omitted, estimated from potency_score. */
  days_until_degraded?: number;
};

function fluidColor(score: number) {
  if (score >= 85) return { hex: "#89CFF0", label: "Optimal" };
  if (score >= 70) return { hex: "#FFD580", label: "Acceptable" };
  if (score >= 50) return { hex: "#FFB3C6", label: "Degraded" };
  return { hex: "#DDD5F0", label: "Discard" };
}

export function SyringeVisualizer({
  compound,
  dose_mcg,
  concentration_mcg_per_ml,
  potency_score,
  days_until_degraded,
}: Props) {
  // Calc draw volume in mL
  const drawMl = useMemo(() => {
    if (!concentration_mcg_per_ml || concentration_mcg_per_ml <= 0) return 0;
    return Math.max(0, dose_mcg / concentration_mcg_per_ml);
  }, [dose_mcg, concentration_mcg_per_ml]);

  // Animate fluid from 0 -> drawMl on mount and when dose changes
  const [animatedMl, setAnimatedMl] = useState(0);
  useEffect(() => {
    setAnimatedMl(0);
    const id = requestAnimationFrame(() => setAnimatedMl(drawMl));
    return () => cancelAnimationFrame(id);
  }, [drawMl]);

  const score = Math.max(0, Math.min(100, potency_score));
  const color = fluidColor(score);

  // Syringe geometry (viewBox 400 x 120; horizontal)
  const barrelX = 40;
  const barrelW = 280;
  const barrelY = 38;
  const barrelH = 44;
  const maxMl = 1.0; // 1 mL reference syringe
  const fillW = Math.min(1, animatedMl / maxMl) * barrelW;
  const plungerX = barrelX + fillW;

  // Estimate days remaining if not provided (simple linear model toward 70%)
  const daysRemaining = useMemo(() => {
    if (typeof days_until_degraded === "number") return Math.max(0, Math.round(days_until_degraded));
    if (score <= 70) return 0;
    return Math.round(((score - 70) / 30) * 60); // up to ~60 days at 100%
  }, [days_until_degraded, score]);

  // Generate 11 major ticks (0.0 -> 1.0) with 0.1mL minor subdivisions
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10);

  return (
    <div className="w-[60%] sm:w-full max-w-xl mx-auto">
      {/* Compound label */}
      <div className="text-center mb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Loaded compound
        </div>
        <div
          className="font-display text-lg font-semibold mt-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {compound}
        </div>
      </div>

      {/* SVG syringe */}
      <div className="relative">
        <svg
          viewBox="0 0 400 120"
          className="w-full h-auto block"
          role="img"
          aria-label={`${compound} syringe drawn to ${drawMl.toFixed(2)} milliliters`}
        >
          <defs>
            {/* Frosted glass — radial highlight */}
            <radialGradient id="glass" cx="50%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </radialGradient>

            {/* Barrel outline gradient */}
            <linearGradient id="barrelEdge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DDD5F0" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#C9BFE5" />
            </linearGradient>

            {/* Fluid gradient based on potency color */}
            <linearGradient id="fluid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color.hex} stopOpacity="0.75" />
              <stop offset="50%" stopColor={color.hex} stopOpacity="1" />
              <stop offset="100%" stopColor={color.hex} stopOpacity="0.85" />
            </linearGradient>

            {/* Plunger metal */}
            <linearGradient id="plungerMetal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F3EEFF" />
              <stop offset="50%" stopColor="#9B8EC4" />
              <stop offset="100%" stopColor="#2D1F4A" />
            </linearGradient>

            {/* Drop shadow */}
            <filter id="barrelShadow" x="-10%" y="-30%" width="120%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="3" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.18" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clip the fluid to the barrel's rounded shape */}
            <clipPath id="barrelClip">
              <rect
                x={barrelX}
                y={barrelY}
                width={barrelW}
                height={barrelH}
                rx="6"
                ry="6"
              />
            </clipPath>
          </defs>

          {/* Needle */}
          <g>
            <rect x="328" y="58" width="50" height="4" fill="#9B8EC4" rx="1" />
            <polygon points="378,60 392,58.5 392,61.5" fill="#2D1F4A" />
            {/* Needle hub */}
            <rect x="320" y="50" width="14" height="20" rx="2" fill="url(#plungerMetal)" />
          </g>

          {/* Barrel shadow + body */}
          <g filter="url(#barrelShadow)">
            <rect
              x={barrelX}
              y={barrelY}
              width={barrelW}
              height={barrelH}
              rx="6"
              ry="6"
              fill="#FFFFFF"
              stroke="url(#barrelEdge)"
              strokeWidth="1.5"
            />
          </g>

          {/* Fluid fill (animated) */}
          <g clipPath="url(#barrelClip)">
            <rect
              x={barrelX}
              y={barrelY}
              width={fillW}
              height={barrelH}
              fill="url(#fluid)"
              style={{
                transition: "width 1100ms cubic-bezier(0.22, 1, 0.36, 1), fill 400ms ease",
              }}
            />
            {/* Fluid meniscus / surface highlight */}
            <rect
              x={barrelX + fillW - 1}
              y={barrelY}
              width="2"
              height={barrelH}
              fill={color.hex}
              opacity="0.6"
              style={{ transition: "x 1100ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </g>

          {/* Frosted glass overlay (sits on top of fluid for that real-glass shimmer) */}
          <rect
            x={barrelX}
            y={barrelY}
            width={barrelW}
            height={barrelH}
            rx="6"
            ry="6"
            fill="url(#glass)"
            pointerEvents="none"
          />

          {/* Measurement markings — 0.1 mL increments */}
          <g>
            {ticks.map((t, i) => {
              const x = barrelX + (t / maxMl) * barrelW;
              const isMajor = i % 5 === 0;
              return (
                <g key={t}>
                  <line
                    x1={x}
                    y1={barrelY + 2}
                    x2={x}
                    y2={barrelY + (isMajor ? 10 : 6)}
                    stroke="#2D1F4A"
                    strokeOpacity={isMajor ? 0.55 : 0.3}
                    strokeWidth={isMajor ? 0.9 : 0.6}
                  />
                  <line
                    x1={x}
                    y1={barrelY + barrelH - (isMajor ? 10 : 6)}
                    x2={x}
                    y2={barrelY + barrelH - 2}
                    stroke="#2D1F4A"
                    strokeOpacity={isMajor ? 0.55 : 0.3}
                    strokeWidth={isMajor ? 0.9 : 0.6}
                  />
                  {isMajor && (
                    <text
                      x={x}
                      y={barrelY - 5}
                      textAnchor="middle"
                      fontSize="6.5"
                      fill="#9B8EC4"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {t.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Plunger (animated to follow fluid edge) */}
          <g
            style={{
              transform: `translateX(${plungerX - barrelX - fillW}px)`,
              transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Rubber stopper */}
            <rect
              x={plungerX - 8}
              y={barrelY + 1}
              width="8"
              height={barrelH - 2}
              fill="#2D1F4A"
              rx="1.5"
              style={{ transition: "x 1100ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
            {/* Plunger rod */}
            <rect
              x={plungerX}
              y={barrelY + barrelH / 2 - 3}
              width={barrelX + barrelW + 30 - plungerX}
              height="6"
              fill="url(#plungerMetal)"
              rx="1"
              style={{ transition: "x 1100ms cubic-bezier(0.22, 1, 0.36, 1), width 1100ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
            {/* Cross-shaped rod fin */}
            <rect
              x={plungerX + (barrelX + barrelW + 30 - plungerX) / 2 - 1}
              y={barrelY + 4}
              width="2"
              height={barrelH - 8}
              fill="#9B8EC4"
              opacity="0.4"
              style={{ transition: "x 1100ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
            {/* Thumb press */}
            <rect
              x={barrelX + barrelW + 22}
              y={barrelY - 6}
              width="14"
              height={barrelH + 12}
              rx="2"
              fill="url(#plungerMetal)"
            />
          </g>

          {/* Flange (finger grip) */}
          <rect x={barrelX - 4} y={barrelY - 10} width="8" height={barrelH + 20} rx="2" fill="url(#plungerMetal)" />
        </svg>
      </div>

      {/* Readout */}
      <div className="mt-6 flex flex-col items-center text-center gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Draw volume
          </div>
          <div
            className="text-5xl sm:text-6xl font-semibold tabular-nums leading-none"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--foreground)" }}
          >
            {drawMl.toFixed(2)}
            <span className="text-2xl text-muted-foreground ml-2">mL</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Potency badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color.hex, boxShadow: `0 0 0 3px ${color.hex}33` }}
            />
            <span className="font-mono tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {score.toFixed(0)}%
            </span>
            <span className="text-muted-foreground">· {color.label}</span>
          </div>

          {/* Days remaining */}
          <div
            className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{ backgroundColor: "var(--panel)", color: "var(--foreground)" }}
          >
            <span className="font-mono tabular-nums font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {daysRemaining}
            </span>
            <span className="text-muted-foreground">days before potency drops below 70%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
