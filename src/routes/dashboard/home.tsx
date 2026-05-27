import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import {
  Beaker, Calculator, FileText, ArrowRight, Newspaper, Sparkles, Droplet, FlaskConical, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DayCell, ReorderReminders, type Stack, type DoseLog } from "@/components/dose-shared";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/home")({ component: HomePage });

type Vial = {
  id: string;
  compound: string;
  vial_size_mg: number;
  bac_water_ml: number | null;
  reconstituted_at: string | null;
  status: string;
};

const NEWS: { title: string; source: string; url: string; tag: string }[] = [
  { title: "BPC-157 in tendon and ligament healing: emerging evidence", source: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/?term=BPC-157", tag: "Research" },
  { title: "GLP-1 receptor agonists: latest clinical trials", source: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/?term=GLP-1+receptor+agonist", tag: "Clinical" },
  { title: "Examine.com — Peptide therapy overview", source: "Examine", url: "https://examine.com/categories/peptides/", tag: "Guides" },
  { title: "Peptide Sciences research blog", source: "Peptide Sciences", url: "https://www.peptidesciences.com/information/peptides-research/", tag: "Blog" },
  { title: "TB-500 mechanism and recovery applications", source: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/?term=thymosin+beta+4", tag: "Research" },
  { title: "Tesamorelin and growth hormone secretagogues", source: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/?term=tesamorelin", tag: "Clinical" },
];

function HomePage() {
  const { user } = useAuth();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [vials, setVials] = useState<Vial[]>([]);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const past = format(addDays(new Date(), -2), "yyyy-MM-dd");
    const future = format(addDays(new Date(), 2), "yyyy-MM-dd");
    const [s, v, d] = await Promise.all([
      supabase.from("stacks").select("*").order("created_at", { ascending: false }),
      supabase.from("vials").select("id, compound, vial_size_mg, bac_water_ml, reconstituted_at, status").order("created_at", { ascending: false }),
      supabase.from("stack_doses").select("id, stack_id, dose_date, period").gte("dose_date", past).lte("dose_date", future),
    ]);
    setStacks((s.data ?? []) as Stack[]);
    setVials((v.data ?? []) as Vial[]);
    setDoses((d.data ?? []) as DoseLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleDose = async (stack: Stack, date: Date, period: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = doses.find((dd) => dd.stack_id === stack.id && dd.dose_date === dateStr && dd.period === period);
    if (existing) {
      const { error } = await supabase.from("stack_doses").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
      setDoses((prev) => prev.filter((d) => d.id !== existing.id));
    } else {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return toast.error("Not signed in");
      const { data, error } = await supabase.from("stack_doses").insert({
        doctor_id: u.user.id, stack_id: stack.id, dose_date: dateStr, period,
      }).select().single();
      if (error) return toast.error(error.message);
      setDoses((prev) => [...prev, data as DoseLog]);
    }
  };

  const name = useMemo(() => {
    if (!user) return "";
    const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
    if (meta.full_name) return meta.full_name.split(" ")[0];
    if (meta.name) return meta.name.split(" ")[0];
    return user.email?.split("@")[0] ?? "Researcher";
  }, [user]);

  const today = startOfDay(new Date());

  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-background p-6 md:p-8">
        <div
          className="absolute -top-20 -right-20 size-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
              <Sparkles className="size-3.5" /> {format(today, "EEEE, MMMM d")}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Welcome, <span className="text-primary">{name || "Researcher"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Here's your day at a glance — today's doses, your vial inventory, and a quick calculator.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/research-logs">
              <Button variant="outline" className="gap-2"><FileText className="size-4" /> Logs</Button>
            </Link>
          </div>
        </div>
      </div>

      <ReorderReminders />


      {/* Day view */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl font-bold">Today's Stack</h2>
          <Link to="/dashboard/research-logs" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Open full calendar <ArrowRight className="size-3" />
          </Link>
        </div>
        {loading ? (
          <div className="sayne-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : stacks.length === 0 ? (
          <div className="sayne-card p-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">No peptides in your stack yet.</p>
            <Link to="/dashboard/research-logs">
              <Button size="sm">Add your first peptide</Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl">
            <DayCell day={today} stacks={stacks} doses={doses} onToggle={toggleDose} isToday size="xl" />
          </div>
        )}
      </section>

      {/* Two-column: Vials + Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VialsSection vials={vials} loading={loading} />
        <QuickCalculator />
      </div>

      {/* News */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Newspaper className="size-5 text-primary" /> Peptide Research & News
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Hand-picked clinical research and trusted peptide blogs.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEWS.map((n) => (
            <a
              key={n.url}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sayne-card p-4 group hover:border-primary/50 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{n.tag}</Badge>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="font-medium text-sm leading-snug">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-auto">{n.source}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function VialsSection({ vials, loading }: { vials: Vial[]; loading: boolean }) {
  return (
    <section className="sayne-card p-5 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Beaker className="size-5 text-primary" /> My Vials
        </h2>
        <Link to="/dashboard/my-vials" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          View all <ArrowRight className="size-3" />
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
      ) : vials.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">No vials logged yet.</p>
          <Link to="/dashboard/my-vials"><Button size="sm" variant="outline">Add a vial</Button></Link>
        </div>
      ) : (
        <ul className="divide-y divide-border/50 -mx-1">
          {vials.slice(0, 5).map((v) => (
            <li key={v.id} className="flex items-center gap-3 px-1 py-2.5">
              <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <FlaskConical className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{v.compound}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {v.vial_size_mg}mg
                  {v.bac_water_ml ? ` · ${v.bac_water_ml}mL BAC` : ""}
                  {v.reconstituted_at ? ` · recon ${format(new Date(v.reconstituted_at), "MMM d")}` : ""}
                </div>
              </div>
              <Badge variant={v.status === "sealed" ? "outline" : v.status === "open" ? "default" : "secondary"} className="text-[10px] capitalize">
                {v.status}
              </Badge>
            </li>
          ))}
          {vials.length > 5 && (
            <li className="pt-2.5 text-xs text-muted-foreground text-center">
              +{vials.length - 5} more
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function QuickCalculator() {
  const [vialAmount, setVialAmount] = useState(5);
  const [vialUnit, setVialUnit] = useState<"mg" | "mL">("mg");
  const [bacAmount, setBacAmount] = useState(2);
  const [bacUnit, setBacUnit] = useState<"mL" | "units">("mL");
  const [doseAmount, setDoseAmount] = useState(250);
  const [doseUnit, setDoseUnit] = useState<"mcg" | "mg" | "units" | "mL">("mcg");

  const vialMg = vialAmount; // treat mL value numerically; advisory below
  const bacMl = bacUnit === "mL" ? bacAmount : bacAmount * 0.01;
  const concentration = (vialMg * 1000) / Math.max(bacMl, 0.01); // mcg/mL

  const doseMcg =
    doseUnit === "mcg" ? doseAmount
    : doseUnit === "mg" ? doseAmount * 1000
    : doseUnit === "mL" ? doseAmount * concentration
    : doseAmount * 0.01 * concentration; // units

  const perDoseMl = doseMcg / concentration;
  const units = perDoseMl * 100;
  const dosesPerVial = Math.floor((vialMg * 1000) / Math.max(doseMcg, 1));

  const UnitToggle = <T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] }) => (
    <div className="inline-flex rounded-md border bg-background p-0.5 ml-1">
      {options.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-1.5 py-0.5 text-[10px] rounded ${value === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {u}
        </button>
      ))}
    </div>
  );

  return (
    <section className="sayne-card p-5 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Calculator className="size-5 text-primary" /> Quick Calculator
        </h2>
        <Link to="/dashboard/calculator" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Full calculator <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Vial</Label>
            <UnitToggle value={vialUnit} onChange={setVialUnit} options={["mg", "mL"] as const} />
          </div>
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

      <div className="grid grid-cols-3 gap-2 mt-auto">
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
      <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
        <Droplet className="size-2.5" /> Units shown for U-100 insulin syringe (1 mL = 100 units).
      </p>
    </section>
  );
}
