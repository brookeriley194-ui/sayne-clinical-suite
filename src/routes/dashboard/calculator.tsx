import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader, StatCard } from "@/components/dashboard-ui";
import { SyringeVisualizer, SYRINGE_SPECS, type SyringeType } from "@/components/syringe-visualizer";

export const Route = createFileRoute("/dashboard/calculator")({ component: Page });

const COMPOUNDS = [
  "NAD+", "BPC-157", "TB-500", "Thymosin Alpha-1", "Thymosin Beta-4", "Ipamorelin", "CJC-1295",
  "CJC-1295 DAC", "CJC-1295 No DAC", "Sermorelin", "Tesamorelin", "GHRP-2", "GHRP-6", "Hexarelin",
  "MK-677 (Ibutamoren)", "Selank", "Semax", "N-Acetyl Selank", "N-Acetyl Semax", "PT-141 (Bremelanotide)",
  "Melanotan I", "Melanotan II", "Semaglutide", "Tirzepatide", "Retatrutide", "Liraglutide", "Cagrilintide",
  "AOD-9604", "HGH (Somatropin)", "IGF-1 LR3", "IGF-1 DES", "MGF", "PEG-MGF", "Follistatin 344",
  "Follistatin 315", "Epitalon (Epithalon)", "Pinealon", "Cerebrolysin", "DSIP", "GHK-Cu", "AHK-Cu",
  "Snap-8", "Argireline", "Matrixyl", "Kisspeptin-10", "Gonadorelin", "HCG", "Triptorelin",
  "Adipotide (FTPP)", "5-Amino-1MQ", "SS-31 (Elamipretide)", "MOTS-c", "Humanin", "Pinealon",
  "Oxytocin", "Vasopressin", "Glutathione", "Methylene Blue", "L-Carnitine", "Glow (GHK-Cu+...)",
  "KPV", "LL-37", "Thymalin", "Thymogen", "Lipo-C (MIC)", "Glycine", "Taurine", "NAC",
  "Tirzepatide+Retatrutide", "Survodutide", "Mazdutide", "Orforglipron", "Bremelanotide",
  "BPC-157 Arginate", "TB-4 Frag", "Larazotide", "DLA", "P21", "Dihexa", "Cortagen", "Vesugen",
  "Bronchogen", "Prostagen", "Cardiogen", "Pancragen", "Ovagen", "Testagen", "Livagen",
  "Thymalin", "Glandokort", "Pinealon", "Pancragen", "Cardiogen", "Endoluten", "Sigumir",
  "Vladonix", "Chelohart", "Cerluten", "Bonothyrk", "Crystagen", "Honluten", "Stamakort",
  "Suprefort", "Ventfort", "Visoluten", "Zhenoluten", "Ovariamin",
].filter((c, i, a) => a.indexOf(c) === i).sort((a, b) => a.localeCompare(b));
type MassUnit = "mg" | "mL";
type DoseUnit = "mcg" | "mg" | "units" | "mL";
type DiluentUnit = "mL" | "units" | "mcg";

const SYRINGE_OPTIONS: { type: SyringeType; label: string; sub: string }[] = [
  { type: "insulin_0_3", label: "0.3 mL", sub: "30 units · insulin" },
  { type: "insulin_0_5", label: "0.5 mL", sub: "50 units · insulin" },
  { type: "insulin_1",   label: "1 mL",   sub: "100 units · insulin" },
  { type: "standard_1",  label: "1 mL",   sub: "tuberculin" },
  { type: "standard_3",  label: "3 mL",   sub: "standard" },
];

// Peptide potency model: 100% on day 0 → 70% at day 30 → 0% at day 60 (linear).
function potencyFromDays(days: number) {
  if (days <= 0) return 100;
  return Math.max(0, Math.min(100, 100 - (days * 100) / 60));
}

function SyringeIcon({ scale, selected }: { scale: number; selected: boolean }) {
  const barrelW = 30 + scale * 50;
  const stroke = selected ? "var(--primary)" : "var(--muted-foreground)";
  return (
    <svg viewBox="0 0 110 28" className="w-full h-8">
      <rect x={4} y={9} width={barrelW} height={10} rx={2} fill="none" stroke={stroke} strokeWidth={1.2} />
      <rect x={barrelW + 4} y={11} width={12} height={6} fill={stroke} opacity={0.6} />
      <rect x={barrelW + 16} y={13} width={22} height={2} fill={stroke} />
      <polygon points={`${barrelW + 38},14 ${barrelW + 44},13 ${barrelW + 44},15`} fill={stroke} />
    </svg>
  );
}

function Page() {
  const navigate = useNavigate();
  const [compound, setCompound] = useState("BPC-157");
  const [vialAmount, setVialAmount] = useState(5);
  const [vialUnit, setVialUnit] = useState<MassUnit>("mg");
  const [bacWater, setBacWater] = useState(2);
  const [bacUnit, setBacUnit] = useState<DiluentUnit>("mL");
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("mcg");
  const [doseValue, setDoseValue] = useState(250);
  const [syringeType, setSyringeType] = useState<SyringeType>("insulin_1");
  const [reconDate, setReconDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const raw = sessionStorage.getItem("calc:prefill");
    if (!raw) return;
    sessionStorage.removeItem("calc:prefill");
    try {
      const p = JSON.parse(raw);
      if (p.compound) {
        if (!COMPOUNDS.includes(p.compound)) COMPOUNDS.push(p.compound);
        setCompound(p.compound);
      }
      if (p.vialAmount) setVialAmount(p.vialAmount);
      if (p.vialUnit) setVialUnit(p.vialUnit);
      if (p.bacWater) setBacWater(p.bacWater);
    } catch { /* ignore */ }
  }, []);

  const addToStack = () => {
    sessionStorage.setItem("stack:prefill", JSON.stringify({
      peptide_name: compound,
      dose: doseValue,
      dose_unit: doseUnit,
      reconstituted_at: reconDate ? reconDate.toISOString() : null,
    }));
    navigate({ to: "/dashboard/research-logs" });
  };


  // If vial is sold as a pre-mixed liquid (mL), assume entered value is the
  // total mL and treat mass as the same number of mg (user can override via BAC).
  const vialMg = vialUnit === "mg" ? vialAmount : vialAmount;

  // Convert diluent to mL. units = 0.01 mL each (U-100). mcg isn't a volume —
  // treat as mL with a small advisory note.
  const bacWaterMl =
    bacUnit === "mL" ? bacWater : bacUnit === "units" ? bacWater * 0.01 : bacWater;

  const concentration_mcg_per_ml = (vialMg * 1000) / Math.max(bacWaterMl, 0.01);

  const doseMcg =
    doseUnit === "mcg"
      ? doseValue
      : doseUnit === "mg"
      ? doseValue * 1000
      : doseUnit === "mL"
      ? doseValue * concentration_mcg_per_ml
      : doseValue * 0.01 * concentration_mcg_per_ml;

  const perDoseMl = doseMcg / concentration_mcg_per_ml;
  const dosesPerVial = Math.floor((vialMg * 1000) / Math.max(doseMcg, 1));

  // Days since reconstitution → potency
  const daysSinceRecon = reconDate
    ? Math.max(0, Math.floor((Date.now() - reconDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const potency = Math.round(potencyFromDays(daysSinceRecon));
  const daysUntil70 = Math.max(0, 30 - daysSinceRecon);

  return (
    <>
      <PageHeader title="Dose Calculator" subtitle="Compute reconstitution and dosing across vial concentrations." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Concentration" value={(concentration_mcg_per_ml / 1000).toFixed(2)} unit="mg/mL" />
        <StatCard label="Per dose" value={perDoseMl.toFixed(2)} unit="mL" />
        <StatCard label="Doses / vial" value={String(dosesPerVial)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-5">
          <h3 className="font-medium">Inputs</h3>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-muted-foreground">Compound</span>
              <select value={compound} onChange={(e) => setCompound(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
                {COMPOUNDS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

            <div>
              <span className="text-muted-foreground">Vial size</span>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={vialAmount}
                  onChange={(e) => setVialAmount(+e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-2"
                />
                <div className="inline-flex rounded-md border bg-background p-0.5">
                  {(["mg", "mL"] as MassUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setVialUnit(u)}
                      className={`px-3 py-1 text-xs rounded ${vialUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {vialUnit === "mL" && (
                <div className="mt-1 text-xs text-muted-foreground">Pre-mixed liquid vials — total volume in mL.</div>
              )}
            </div>

            {/* Bac. water with unit toggle */}
            <div>
              <span className="text-muted-foreground">Bacteriostatic water</span>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={bacWater}
                  onChange={(e) => setBacWater(+e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-2"
                />
                <div className="inline-flex rounded-md border bg-background p-0.5">
                  {(["mcg", "units", "mL"] as DiluentUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setBacUnit(u)}
                      className={`px-3 py-1 text-xs rounded ${bacUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ≈ {bacWaterMl.toFixed(2)} mL
                {bacUnit === "mcg" && " · mcg is a mass unit — treated as mL for diluent"}
              </div>
            </div>

            {/* Dose with unit toggle */}
            <div>
              <span className="text-muted-foreground">Dose</span>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={doseValue}
                  onChange={(e) => setDoseValue(+e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-2"
                />
                <div className="inline-flex rounded-md border bg-background p-0.5">
                  {(["mcg", "mg", "units", "mL"] as DoseUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setDoseUnit(u)}
                      className={`px-3 py-1 text-xs rounded ${doseUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {doseUnit !== "mcg" && (
                <div className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ≈ {doseMcg.toFixed(1)} mcg
                </div>
              )}
            </div>

            {/* Date reconstituted */}
            <div>
              <span className="text-muted-foreground">Date reconstituted</span>
              <div className="mt-1 flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("flex-1 justify-start text-left font-normal", !reconDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reconDate ? format(reconDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reconDate}
                      onSelect={setReconDate}
                      disabled={(d) => d > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="text-xs text-muted-foreground text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <div>{daysSinceRecon} days ago</div>
                  <div>potency {potency}%</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${potency}%`,
                    backgroundColor:
                      potency >= 85 ? "#89CFF0" : potency >= 70 ? "#FFD580" : potency >= 50 ? "#FFB3C6" : "#DDD5F0",
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {daysUntil70 > 0 ? `${daysUntil70} days before potency drops below 70%` : "Below 70% — consider discarding"}
              </div>
            </div>
          </div>

          {/* Syringe type selector */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Which syringe do you have?</div>
            <div className="grid grid-cols-2 gap-2">
              {SYRINGE_OPTIONS.map((opt) => {
                const selected = syringeType === opt.type;
                const scale = SYRINGE_SPECS[opt.type].maxMl / 3;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSyringeType(opt.type)}
                    className={`text-left rounded-md border p-3 transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <SyringeIcon scale={scale} selected={selected} />
                    <div className="mt-2 text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 flex items-center justify-center">
          <SyringeVisualizer
            compound={compound}
            dose_mcg={doseMcg}
            concentration_mcg_per_ml={concentration_mcg_per_ml}
            potency_score={potency}
            days_until_degraded={daysUntil70}
            syringe_type={syringeType}
          />
        </div>
      </div>
    </>
  );
}
