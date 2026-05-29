import { useState } from "react";
import { Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LAVENDER = "#C9A8F5";

type DoseUnit = "mcg" | "mg" | "units" | "mL";

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

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [vialAmount, setVialAmount] = useState(5);
  const [bacAmount, setBacAmount] = useState(2);
  const [bacUnit, setBacUnit] = useState<"mL" | "units">("mL");
  const [doseAmount, setDoseAmount] = useState(250);
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("mcg");

  const bacMl = bacUnit === "mL" ? bacAmount : bacAmount * 0.01;
  const concentration = (vialAmount * 1000) / Math.max(bacMl, 0.01); // mcg/mL
  const doseMcg =
    doseUnit === "mcg" ? doseAmount
    : doseUnit === "mg" ? doseAmount * 1000
    : doseUnit === "mL" ? doseAmount * concentration
    : doseAmount * 0.01 * concentration;
  const perDoseMl = doseMcg / concentration;
  const units = perDoseMl * 100;
  const dosesPerVial = Math.floor((vialAmount * 1000) / Math.max(doseMcg, 1));

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Dose Calculator</DialogTitle>
            <DialogDescription>Quick reconstitution math — no page change.</DialogDescription>
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
                <UnitToggle value={doseUnit} onChange={setDoseUnit} options={["mcg", "mg", "units", "mL"] as const} />
              </div>
              <Input type="number" step="any" value={doseAmount} onChange={(e) => setDoseAmount(Number(e.target.value))} className="font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="rounded-md bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Draw to</div>
              <div className="font-mono font-semibold tabular-nums">
                <span className="text-primary text-lg">{isFinite(units) ? units.toFixed(0) : "—"}</span>
                <span className="text-xs text-muted-foreground ml-1">u</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Volume</div>
              <div className="font-mono font-semibold tabular-nums">
                <span className="text-lg">{isFinite(perDoseMl) ? perDoseMl.toFixed(3) : "—"}</span>
                <span className="text-xs text-muted-foreground ml-1">mL</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Doses</div>
              <div className="font-mono font-semibold tabular-nums">
                <span className="text-lg">{isFinite(dosesPerVial) ? dosesPerVial : "—"}</span>
                <span className="text-xs text-muted-foreground ml-1">/vial</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">U-100 insulin syringe (1 mL = 100 units).</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
