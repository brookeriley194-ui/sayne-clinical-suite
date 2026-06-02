import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LAVENDER = "#C9A8F5";

type DoseUnit = "mcg" | "mg" | "IU" | "units" | "mL";
type SyringeKey = "insulin_0_3" | "insulin_0_5" | "insulin_1" | "standard_1" | "standard_3";

const SYRINGE_OPTS: { key: SyringeKey; label: string; sub: string; maxMl: number; insulin: boolean }[] = [
  { key: "insulin_0_3", label: "0.3 mL", sub: "30u insulin",  maxMl: 0.3, insulin: true },
  { key: "insulin_0_5", label: "0.5 mL", sub: "50u insulin",  maxMl: 0.5, insulin: true },
  { key: "insulin_1",   label: "1 mL",   sub: "100u insulin", maxMl: 1.0, insulin: true },
  { key: "standard_1",  label: "1 mL",   sub: "tuberculin",   maxMl: 1.0, insulin: false },
  { key: "standard_3",  label: "3 mL",   sub: "standard",     maxMl: 3.0, insulin: false },
];

function UnitToggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5">
      {options.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-2 py-0.5 text-[10px] rounded ${value === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function MiniSyringe({ fillPct, insulin, maxMl }: { fillPct: number; insulin: boolean; maxMl: number }) {
  const f = Math.max(0, Math.min(1, fillPct));
  const barrelX = 30;
  const barrelW = 240;
  const barrelY = 32;
  const barrelH = 22;
  const needleStart = barrelX + barrelW; // 270
  const fluidW = barrelW * f;
  const fluidX = needleStart - fluidW; // flush against needle base — no gap
  const stopperX = fluidX - 6;

  // Numbering: start at 10 at the base (closest to needle), increment by 10 toward plunger.
  // For insulin: max units = maxMl * 100. For mL syringes: increments of maxMl/10.
  const maxValue = insulin ? Math.round(maxMl * 100) : maxMl;
  const step = insulin ? 10 : maxMl / 10;
  const labels: { value: number; pos: number }[] = [];
  for (let v = step; v <= maxValue + 1e-6; v += step) {
    const frac = v / maxValue;
    labels.push({ value: v, pos: needleStart - frac * barrelW });
  }
  // Minor ticks every step/2
  const minorPositions: number[] = [];
  for (let v = step / 2; v < maxValue; v += step / 2) {
    const frac = v / maxValue;
    minorPositions.push(needleStart - frac * barrelW);
  }

  return (
    <svg viewBox="0 0 320 80" className="w-full h-auto">
      <defs>
        <linearGradient id="fcFluid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bde3f9" />
          <stop offset="100%" stopColor="#3FA8D6" />
        </linearGradient>
        <clipPath id="fcClip">
          <rect x={barrelX} y={barrelY} width={barrelW} height={barrelH} rx="4" />
        </clipPath>
      </defs>

      {/* needle */}
      <rect x={needleStart} y="42" width="40" height="3" fill="#9B8EC4" rx="1" />
      <polygon points="310,43.5 318,42 318,45" fill="#2D1F4A" />
      <rect x={needleStart - 8} y="36" width="12" height="14" rx="2" fill="#9B8EC4" />

      {/* barrel */}
      <rect x={barrelX} y={barrelY} width={barrelW} height={barrelH} rx="4" fill="#ffffff" stroke="#7A6BA8" strokeWidth="1.4" />

      {/* fluid — flush to needle base */}
      <g clipPath="url(#fcClip)">
        <rect
          y={barrelY}
          height={barrelH}
          fill="url(#fcFluid)"
          x={fluidX}
          width={fluidW}
          style={{ transition: "x 700ms cubic-bezier(0.22,1,0.36,1), width 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </g>

      {/* minor ticks */}
      {minorPositions.map((x, i) => (
        <g key={`m-${i}`}>
          <line x1={x} y1={barrelY + 1} x2={x} y2={barrelY + 5} stroke="#2D1F4A" strokeOpacity="0.5" strokeWidth="0.9" />
          <line x1={x} y1={barrelY + barrelH - 5} x2={x} y2={barrelY + barrelH - 1} stroke="#2D1F4A" strokeOpacity="0.5" strokeWidth="0.9" />
        </g>
      ))}

      {/* major ticks + labels */}
      {labels.map(({ value, pos }) => (
        <g key={value}>
          <line x1={pos} y1={barrelY + 1} x2={pos} y2={barrelY + 9} stroke="#1a1432" strokeOpacity="0.85" strokeWidth="1.4" />
          <line x1={pos} y1={barrelY + barrelH - 9} x2={pos} y2={barrelY + barrelH - 1} stroke="#1a1432" strokeOpacity="0.85" strokeWidth="1.4" />
          <text
            x={pos}
            y={barrelY - 4}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#1a1432"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {insulin ? value : value.toFixed(1)}
          </text>
        </g>
      ))}

      {/* stopper + rod */}
      <rect
        y={barrelY + 1} width="6" height={barrelH - 2} fill="#2D1F4A" rx="1"
        x={stopperX}
        style={{ transition: "x 700ms cubic-bezier(0.22,1,0.36,1)" }}
      />
      <rect
        y="42" height="3" fill="#9B8EC4" rx="1" x="8"
        width={Math.max(0, stopperX - 10)}
        style={{ transition: "width 700ms cubic-bezier(0.22,1,0.36,1)" }}
      />
      <rect x="2" y="26" width="6" height="34" rx="1.5" fill="#9B8EC4" />
      <rect x={barrelX - 4} y="24" width="6" height={barrelH + 16} rx="1.5" fill="#9B8EC4" />
    </svg>
  );
}

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [vialAmount, setVialAmount] = useState(5);
  const [bacAmount, setBacAmount] = useState(2);
  const [bacUnit, setBacUnit] = useState<"mL" | "units">("mL");
  const [doseAmount, setDoseAmount] = useState(250);
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("mcg");
  const [syringe, setSyringe] = useState<SyringeKey>("insulin_1");

  const spec = useMemo(() => SYRINGE_OPTS.find((s) => s.key === syringe)!, [syringe]);

  const bacMl = bacUnit === "mL" ? bacAmount : bacAmount * 0.01;
  const concentration = (vialAmount * 1000) / Math.max(bacMl, 0.01); // mcg/mL
  const doseMcg =
    doseUnit === "mcg" ? doseAmount
    : doseUnit === "mg" ? doseAmount * 1000
    : doseUnit === "IU" ? doseAmount // treat IU 1:1 with mcg for display purposes
    : doseUnit === "mL" ? doseAmount * concentration
    : doseAmount * 0.01 * concentration;
  const perDoseMl = doseMcg / concentration;
  const units = perDoseMl * 100;
  const dosesPerVial = Math.floor((vialAmount * 1000) / Math.max(doseMcg, 1));
  const fillPct = Math.min(1, perDoseMl / spec.maxMl);
  const overfill = perDoseMl > spec.maxMl;

  return (
    <>
      <button
        type="button"
        data-tour="floating-calc"
        onClick={() => setOpen(true)}
        aria-label="Open dose calculator"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: LAVENDER, color: "#1a1a2e" }}
      >
        <Calculator className="size-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Dose Calculator</DialogTitle>
            <DialogDescription>Quick reconstitution math — adjusts your syringe in real time.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Vial (mg)</Label>
              <Input type="number" step="any" value={vialAmount} onChange={(e) => setVialAmount(Number(e.target.value))} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">BAC</Label>
                <UnitToggle value={bacUnit} onChange={setBacUnit} options={["mL", "units"] as const} />
              </div>
              <Input type="number" step="any" value={bacAmount} onChange={(e) => setBacAmount(Number(e.target.value))} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Dose</Label>
                <UnitToggle value={doseUnit} onChange={setDoseUnit} options={["mcg", "mg", "IU", "units", "mL"] as const} />
              </div>
              <Input type="number" step="any" value={doseAmount} onChange={(e) => setDoseAmount(Number(e.target.value))} className="font-mono" />
            </div>
          </div>

          {/* Syringe selector */}
          <div className="mt-3">
            <Label className="text-xs">Which syringe?</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {SYRINGE_OPTS.map((s) => {
                const active = s.key === syringe;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSyringe(s.key)}
                    className="rounded-md border px-2 py-1.5 text-left transition-colors"
                    style={
                      active
                        ? { borderColor: LAVENDER, background: "color-mix(in oklab, #C9A8F5 14%, transparent)" }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    <div className="text-[11px] font-medium">{s.label}</div>
                    <div className="text-[9px] text-muted-foreground">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated syringe visual */}
          <div
            className="mt-3 rounded-lg p-3"
            style={{
              background: "color-mix(in oklab, #C9A8F5 6%, transparent)",
              border: "1px solid rgba(201,168,245,0.30)",
            }}
          >
            <MiniSyringe fillPct={fillPct} insulin={spec.insulin} maxMl={spec.maxMl} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-md bg-muted/40 p-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Draw to</div>
                <div className="font-mono font-semibold tabular-nums">
                  <span className="text-primary text-lg">{isFinite(units) ? units.toFixed(0) : "—"}</span>
                  <span className="text-xs text-muted-foreground ml-1">u</span>
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Volume</div>
                <div className="font-mono font-semibold tabular-nums">
                  <span className="text-lg">{isFinite(perDoseMl) ? perDoseMl.toFixed(3) : "—"}</span>
                  <span className="text-xs text-muted-foreground ml-1">mL</span>
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Doses</div>
                <div className="font-mono font-semibold tabular-nums">
                  <span className="text-lg">{isFinite(dosesPerVial) ? dosesPerVial : "—"}</span>
                  <span className="text-xs text-muted-foreground ml-1">/vial</span>
                </div>
              </div>
            </div>
            {overfill && (
              <p className="text-[11px] text-destructive mt-2">
                Exceeds syringe capacity ({spec.maxMl} mL). Choose a larger syringe.
              </p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground mt-1">U-100 insulin syringe (1 mL = 100 units).</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
