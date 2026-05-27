import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard } from "@/components/dashboard-ui";
import { SyringeVisualizer } from "@/components/syringe-visualizer";

export const Route = createFileRoute("/dashboard/calculator")({ component: Page });

const COMPOUNDS = ["BPC-157", "TB-500", "Ipamorelin", "CJC-1295", "Selank", "Semax", "PT-141"];

function Page() {
  const [compound, setCompound] = useState("BPC-157");
  const [doseMcg, setDoseMcg] = useState(250);
  const [vialMg, setVialMg] = useState(5);
  const [bacWaterMl, setBacWaterMl] = useState(2);
  const [potency, setPotency] = useState(92);

  const concentration_mcg_per_ml = (vialMg * 1000) / Math.max(bacWaterMl, 0.01);
  const perDoseMl = doseMcg / concentration_mcg_per_ml;
  const dosesPerVial = Math.floor((vialMg * 1000) / Math.max(doseMcg, 1));

  return (
    <>
      <PageHeader title="Dose Calculator" subtitle="Compute reconstitution and dosing across vial concentrations." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Concentration" value={(concentration_mcg_per_ml / 1000).toFixed(2)} unit="mg/mL" />
        <StatCard label="Per dose" value={perDoseMl.toFixed(2)} unit="mL" />
        <StatCard label="Doses / vial" value={String(dosesPerVial)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-medium">Inputs</h3>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-muted-foreground">Compound</span>
              <select value={compound} onChange={(e) => setCompound(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
                {COMPOUNDS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-muted-foreground">Vial size (mg)</span>
              <input type="number" value={vialMg} onChange={(e) => setVialMg(+e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Bac. water (mL)</span>
              <input type="number" step="0.1" value={bacWaterMl} onChange={(e) => setBacWaterMl(+e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Dose (mcg)</span>
              <input type="number" value={doseMcg} onChange={(e) => setDoseMcg(+e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Potency score: {potency}%</span>
              <input type="range" min={0} max={100} value={potency} onChange={(e) => setPotency(+e.target.value)} className="mt-1 w-full" />
            </label>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 flex items-center justify-center">
          <SyringeVisualizer
            compound={compound}
            dose_mcg={doseMcg}
            concentration_mcg_per_ml={concentration_mcg_per_ml}
            potency_score={potency}
          />
        </div>
      </div>
    </>
  );
}
