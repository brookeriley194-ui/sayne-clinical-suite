import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Trash2, Calendar as CalendarIcon, Droplet, PackageX, Undo2, ReceiptText, Upload, Calculator as CalcIcon, Loader2, X, Save, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyCard } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReorderReminders, VialVisual, doseToMg } from "@/components/dose-shared";
import { SyringeVisualizer, SYRINGE_SPECS, type SyringeType } from "@/components/syringe-visualizer";
import { PeptideCombobox } from "@/components/peptide-combobox";

export const Route = createFileRoute("/dashboard/my-vials")({ component: Page });

export type Vial = {
  id: string;
  compound: string;
  vial_size_mg: number;
  bac_water_ml: number | null;
  concentration_mg_per_ml: number | null;
  reconstituted_at: string | null;
  status: string;
  lot_number: string | null;
  notes: string | null;
  default_dose: number | null;
  default_dose_unit: string | null;
  created_at: string;
};


const STATUSES = ["sealed", "open", "used"] as const;

export function potencyFromDays(days: number) {
  return Math.max(0, Math.round(100 - (days * 100) / 60));
}

export type VialUsage = {
  mgUsed: number;
  percentLeft: number; // 0–100 remaining
  remainingDoses: number | null;
  totalDoses: number | null;
  doseLabel: string | null; // e.g. "0.25 mg"
};

export function computeVialUsages(
  vialList: Vial[],
  stacks: { id: string; vial_id: string; dose: number | null; dose_unit: string; created_at: string }[],
  doses: { stack_id: string }[],
): Record<string, VialUsage> {
  const countByStack = new Map<string, number>();
  for (const dd of doses) countByStack.set(dd.stack_id, (countByStack.get(dd.stack_id) ?? 0) + 1);
  const u: Record<string, VialUsage> = {};
  for (const vial of vialList) {
    const conc = vial.concentration_mg_per_ml ??
      (vial.bac_water_ml && vial.bac_water_ml > 0 ? vial.vial_size_mg / vial.bac_water_ml : null);
    const linked = stacks
      .filter((st) => st.vial_id === vial.id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

    let mgUsed = 0;
    for (const st of linked) {
      if (!st.dose) continue;
      const mg = doseToMg(st.dose, st.dose_unit, conc);
      if (mg == null) continue;
      mgUsed += mg * (countByStack.get(st.id) ?? 0);
    }
    const mgRemaining = Math.max(0, vial.vial_size_mg - mgUsed);
    const percentLeft = vial.vial_size_mg > 0
      ? Math.max(0, Math.min(100, (mgRemaining / vial.vial_size_mg) * 100))
      : 0;

    let remainingDoses: number | null = null;
    let totalDoses: number | null = null;
    let doseLabel: string | null = null;
    const primary = linked.find((st) => st.dose && doseToMg(st.dose, st.dose_unit, conc) != null);
    if (primary && primary.dose) {
      const mgPer = doseToMg(primary.dose, primary.dose_unit, conc)!;
      if (mgPer > 0) {
        totalDoses = Math.floor(vial.vial_size_mg / mgPer);
        remainingDoses = Math.floor(mgRemaining / mgPer);
        doseLabel = `${primary.dose} ${primary.dose_unit}`;
      }
    }
    u[vial.id] = { mgUsed, percentLeft, remainingDoses, totalDoses, doseLabel };
  }
  return u;
}

function Page() {
  const [vials, setVials] = useState<Vial[]>([]);
  const [usage, setUsage] = useState<Record<string, VialUsage>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "open" | "sealed" | "used">("all");

  const load = async () => {
    setLoading(true);
    const [v, s, d] = await Promise.all([
      supabase.from("vials").select("*").order("created_at", { ascending: false }),
      supabase.from("protocols").select("id, vial_id, dose, dose_unit, created_at").not("vial_id", "is", null),
      supabase.from("stack_doses").select("stack_id"),
    ]);
    if (v.error) toast.error(v.error.message);
    const vialList = (v.data ?? []) as Vial[];
    setVials(vialList);

    const stacks = (s.data ?? []) as { id: string; vial_id: string; dose: number | null; dose_unit: string; created_at: string }[];
    const doses = (d.data ?? []) as { stack_id: string }[];
    setUsage(computeVialUsages(vialList, stacks, doses));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("vials-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "vials" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "protocols" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "stack_doses" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);


  const stats = useMemo(() => {
    const open = vials.filter((v) => v.status === "open").length;
    const sealed = vials.filter((v) => v.status === "sealed").length;
    const used = vials.filter((v) => v.status === "used").length;
    return { open, sealed, used, all: vials.length };
  }, [vials]);

  const visibleVials = useMemo(
    () => (tab === "all" ? vials : vials.filter((v) => v.status === tab)),
    [vials, tab],
  );

  const remove = async (id: string) => {
    const { error } = await supabase.from("vials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Vial removed");
    load();
  };

  const markEmpty = async (id: string) => {
    const { error } = await supabase.from("vials").update({ status: "used" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Vial marked empty");
    load();
  };

  const restore = async (id: string, status: "open" | "sealed") => {
    const { error } = await supabase.from("vials").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Moved back to ${status}`);
    load();
  };

  const changeStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vials").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status updated to ${status}`);
    load();
  };


  return (
    <>
      <PageHeader
        title="My Vials"
        subtitle="Personal inventory and reconstitution history."
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" data-tour="scan-receipt" onClick={() => setReceiptOpen(true)}>
              <ReceiptText className="size-4" /> Import Receipt
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2"><Plus className="size-4" /> Add Vial</Button>
              </SheetTrigger>
              <AddVialSheet onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
            </Sheet>
          </div>
        }
      />

      <ImportReceiptDialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        onSaved={() => { setReceiptOpen(false); load(); }}
      />


      <ReorderReminders />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { key: "all", label: "All", count: stats.all },
          { key: "open", label: "Open", count: stats.open },
          { key: "sealed", label: "Sealed", count: stats.sealed },
          { key: "used", label: "Used", count: stats.used },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "sayne-card p-4 text-left transition-all hover:border-primary/40",
              tab === t.key && "border-primary ring-2 ring-primary/20",
            )}
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</div>
            <div className="mt-1 font-display text-2xl font-semibold font-mono tabular-nums">{t.count}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sayne-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : vials.length === 0 ? (
        <EmptyCard
          title="No vials yet"
          body="Click 'Add Vial' to register your first vial and start tracking concentration, potency, and remaining doses."
        />
      ) : visibleVials.length === 0 ? (
        <div className="sayne-card p-10 text-center text-sm text-muted-foreground">
          No {tab} vials. Switch tabs to see others.
        </div>
      ) : (
        <div data-tour="vials-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleVials.map((v) => (
            <VialCard
              key={v.id}
              vial={v}
              usage={usage[v.id]}
              onDelete={() => remove(v.id)}
              onMarkEmpty={() => markEmpty(v.id)}
              onRestore={(s) => restore(v.id, s)}
              onChangeStatus={(s) => changeStatus(v.id, s)}
              onUpdated={load}
            />
          ))}

        </div>
      )}
    </>
  );
}

export function VialCard({ vial, usage, onDelete, onMarkEmpty, onRestore, onChangeStatus, onUpdated }: { vial: Vial; usage?: VialUsage; onDelete: () => void; onMarkEmpty: () => void; onRestore: (status: "open" | "sealed") => void; onChangeStatus: (status: string) => void; onUpdated: () => void }) {
  const days = vial.reconstituted_at
    ? differenceInDays(new Date(), new Date(vial.reconstituted_at))
    : null;
  const potency = days !== null ? potencyFromDays(days) : null;
  const conc =
    vial.concentration_mg_per_ml ??
    (vial.bac_water_ml && vial.bac_water_ml > 0 ? vial.vial_size_mg / vial.bac_water_ml : null);

  const triggerColor =
    vial.status === "open" ? "bg-primary/15 text-primary border-primary/30"
    : vial.status === "sealed" ? "bg-muted text-foreground/80 border-border"
    : "bg-destructive/10 text-destructive border-destructive/30";

  const isUsed = vial.status === "used";
  const percentLeft = isUsed ? 0 : (usage?.percentLeft ?? 100);

  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <VialVisual fillPercent={percentLeft} size="sm" empty={isUsed} />
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{vial.compound}</div>
            {vial.lot_number && (
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                Lot {vial.lot_number}
              </div>
            )}
          </div>
        </div>
        <Select value={vial.status} onValueChange={onChangeStatus}>
          <SelectTrigger className={cn("h-7 w-[100px] text-xs capitalize font-medium", triggerColor)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {!isUsed && (
        <div className="rounded-md border bg-sky-500/5 border-sky-500/20 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining doses</span>
            <span className="text-[10px] font-mono text-muted-foreground">{Math.round(percentLeft)}% left</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            {usage?.remainingDoses != null && usage.totalDoses != null ? (
              <>
                <span className="font-mono tabular-nums text-2xl font-semibold">{usage.remainingDoses}</span>
                <span className="text-xs text-muted-foreground font-mono">/ {usage.totalDoses} doses</span>
                {usage.doseLabel && (
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">@ {usage.doseLabel}</span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Link this vial to a stack entry to estimate doses
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 transition-all" style={{ width: `${percentLeft}%` }} />
          </div>
        </div>
      )}


      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Size" value={`${vial.vial_size_mg}`} unit="mg" />
        <Metric label="BAC" value={vial.bac_water_ml ? `${vial.bac_water_ml}` : "—"} unit="mL" />
        <Metric label="Conc." value={conc ? conc.toFixed(2) : "—"} unit="mg/mL" />
      </div>

      {potency !== null && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Potency</span>
            <span className="font-mono">{potency}% · day {days}/60</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all",
                potency > 70 ? "bg-primary" : potency > 40 ? "bg-yellow-500" : "bg-destructive")}
              style={{ width: `${potency}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground gap-2">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="size-3" />
          {vial.reconstituted_at
            ? `Recon. ${format(new Date(vial.reconstituted_at), "MMM d")}`
            : `Added ${format(new Date(vial.created_at), "MMM d")}`}
        </span>
        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5">
                <CalcIcon className="size-3.5" /> Calc
              </Button>
            </SheetTrigger>
            <VialCalcSheet vial={vial} onUpdated={onUpdated} />
          </Sheet>
          {vial.status === "used" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onRestore("open")} className="h-7 text-xs gap-1.5">
                <Undo2 className="size-3.5" /> Open
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onRestore("sealed")} className="h-7 text-xs gap-1.5">
                Sealed
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkEmpty}
              className="h-7 text-xs gap-1.5"
            >
              <PackageX className="size-3.5" /> Vial empty
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" />
          </Button>
        </div>

      </div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums">
        {value} <span className="text-muted-foreground font-normal">{unit}</span>
      </div>
    </div>
  );
}

function AddVialSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const navigate = useNavigate();
  const [compound, setCompound] = useState("");
  const [customCompound, setCustomCompound] = useState("");
  const [vialSize, setVialSize] = useState("");
  const [vialUnit, setVialUnit] = useState<"mg" | "mL">("mg");
  const [bacWater, setBacWater] = useState("");
  const [reconDate, setReconDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<string>("sealed");
  const [lot, setLot] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const conc =
    vialSize && bacWater && Number(bacWater) > 0
      ? (Number(vialSize) / Number(bacWater)).toFixed(2)
      : null;

  const save = async (goToCalculator: boolean) => {
    const finalCompound = (compound === "Other" ? customCompound : compound).trim();
    if (!finalCompound || !vialSize) {
      toast.error("Compound and vial size are required");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }

    const { error } = await supabase.from("vials").insert({
      doctor_id: u.user.id,
      compound: finalCompound,
      vial_size_mg: Number(vialSize),
      bac_water_ml: bacWater ? Number(bacWater) : null,
      concentration_mg_per_ml: conc ? Number(conc) : null,
      reconstituted_at: reconDate ? reconDate.toISOString() : null,
      status,
      lot_number: lot.trim() || null,
      notes: (vialUnit === "mL" ? `Vial size entered in mL. ` : "") + (notes.trim() || "") || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vial added");

    if (goToCalculator) {
      sessionStorage.setItem("calc:prefill", JSON.stringify({
        compound: finalCompound,
        vialAmount: Number(vialSize),
        vialUnit,
        bacWater: bacWater ? Number(bacWater) : 2,
      }));
      navigate({ to: "/dashboard/calculator" });
    } else {
      onSaved();
    }
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); save(false); };


  return (
    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Add Vial</SheetTitle>
        <SheetDescription>Register a vial to track concentration and potency.</SheetDescription>
      </SheetHeader>
      <form onSubmit={submit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Compound *</Label>
          <PeptideCombobox value={compound} onChange={setCompound} placeholder="Select peptide…" />
          {compound === "Other" && (
            <Input
              autoFocus
              value={customCompound}
              onChange={(e) => setCustomCompound(e.target.value)}
              placeholder="Enter peptide name"
              className="mt-2"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Vial size *</Label>
            <div className="flex gap-2">
              <Input type="number" step="0.1" value={vialSize} onChange={(e) => setVialSize(e.target.value)} placeholder="5" className="flex-1" />
              <div className="inline-flex rounded-md border bg-background p-0.5">
                {(["mg", "mL"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setVialUnit(u)}
                    className={`px-2.5 text-xs rounded ${vialUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>BAC water (mL)</Label>
            <Input type="number" step="0.1" value={bacWater} onChange={(e) => setBacWater(e.target.value)} placeholder="2" />
          </div>
        </div>
        {conc && (
          <div className="rounded-md bg-muted/40 p-3 flex items-center gap-2 text-sm">
            <Droplet className="size-4 text-primary" />
            Concentration: <span className="font-mono font-semibold">{conc} mg/mL</span>
          </div>
        )}
        <div className="space-y-2">
          <Label>Date reconstituted</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start font-normal">
                <CalendarIcon className="size-4 mr-2" />
                {reconDate ? format(reconDate, "PPP") : "Not yet reconstituted"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={reconDate} onSelect={setReconDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lot #</Label>
            <Input value={lot} onChange={(e) => setLot(e.target.value)} placeholder="optional" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes" />
        </div>
        <SheetFooter className="gap-2 flex-col sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => save(true)}>
            Save & Go to Calculator
          </Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Vial"}</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}

/* ========================== Inline Vial Calculator ========================== */

const SYRINGE_OPTIONS: { type: SyringeType; label: string; sub: string }[] = [
  { type: "insulin_0_3", label: "0.3 mL", sub: "30u insulin" },
  { type: "insulin_0_5", label: "0.5 mL", sub: "50u insulin" },
  { type: "insulin_1",   label: "1 mL",   sub: "100u insulin" },
  { type: "standard_1",  label: "1 mL",   sub: "tuberculin" },
  { type: "standard_3",  label: "3 mL",   sub: "standard" },
];

function VialCalcSheet({ vial, onUpdated }: { vial: Vial; onUpdated: () => void }) {
  const navigate = useNavigate();

  const [size, setSize] = useState<string>(String(vial.vial_size_mg));
  const [sizeUnit, setSizeUnit] = useState<"mg" | "mL">("mg");
  const [bacWater, setBacWater] = useState<string>(vial.bac_water_ml ? String(vial.bac_water_ml) : "");
  const [reconDate, setReconDate] = useState<Date | undefined>(
    vial.reconstituted_at ? new Date(vial.reconstituted_at) : undefined,
  );
  const [dose, setDose] = useState<string>(vial.default_dose != null ? String(vial.default_dose) : "");
  const [unit, setUnit] = useState<"mcg" | "mg" | "IU" | "units">(
    (["mcg","mg","IU","units"] as const).includes(vial.default_dose_unit as "mcg") ? (vial.default_dose_unit as "mcg") : "mcg",
  );
  const syringeKey = `calc:syringe:${vial.id}`;
  const [syringeType, setSyringeType] = useState<SyringeType>(() => {
    if (typeof window === "undefined") return "insulin_1";
    const saved = localStorage.getItem(syringeKey);
    const valid: SyringeType[] = ["insulin_0_3","insulin_0_5","insulin_1","standard_1","standard_3"];
    return (saved && (valid as string[]).includes(saved)) ? (saved as SyringeType) : "insulin_1";
  });
  useEffect(() => {
    try { localStorage.setItem(syringeKey, syringeType); } catch { /* ignore */ }
  }, [syringeKey, syringeType]);
  const [saving, setSaving] = useState(false);


  // If sold pre-mixed in mL, treat numeric value as mg-equivalent of solution volume basis.
  const sizeMg = size ? Number(size) : 0;
  const bacMl = bacWater ? Number(bacWater) : null;
  const conc = bacMl && bacMl > 0 ? sizeMg / bacMl : null;
  const concMcgMl = conc ? conc * 1000 : 0;

  const mg = dose ? doseToMg(Number(dose), unit, conc) : null;
  const doseMcg = mg != null ? mg * 1000 : 0;
  const volumeMl = mg != null && conc && conc > 0 ? mg / conc : null;
  const units100 = volumeMl != null ? volumeMl * 100 : null;
  const dosesPerVial = mg && mg > 0 && sizeMg > 0 ? Math.floor(sizeMg / mg) : null;

  const days = reconDate ? Math.max(0, Math.floor((Date.now() - reconDate.getTime()) / 86400000)) : 0;
  const potency = reconDate ? potencyFromDays(days) : 100;

  const persistVial = async () => {
    const patch: { vial_size_mg?: number; bac_water_ml?: number | null; concentration_mg_per_ml?: number | null; reconstituted_at?: string | null; default_dose?: number | null; default_dose_unit?: string | null } = {};
    if (sizeMg > 0 && sizeMg !== vial.vial_size_mg) patch.vial_size_mg = sizeMg;
    if (bacMl != null && bacMl !== vial.bac_water_ml) patch.bac_water_ml = bacMl;
    if (conc != null && conc !== vial.concentration_mg_per_ml) patch.concentration_mg_per_ml = conc;
    const newRecon = reconDate ? reconDate.toISOString() : null;
    if (newRecon !== vial.reconstituted_at) patch.reconstituted_at = newRecon;
    if (dose) { patch.default_dose = Number(dose); patch.default_dose_unit = unit; }
    if (Object.keys(patch).length === 0) return true;
    const { error } = await supabase.from("vials").update(patch).eq("id", vial.id);
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  const onSave = async () => {
    setSaving(true);
    const ok = await persistVial();
    setSaving(false);
    if (!ok) return;
    toast.success("Vial updated");
    onUpdated();
  };

  const onSaveAndAddToStack = async () => {
    if (!dose || !mg) { toast.error("Enter a dose first"); return; }
    setSaving(true);
    const ok = await persistVial();
    if (!ok) { setSaving(false); return; }
    sessionStorage.setItem("stack:prefill", JSON.stringify({
      compound: vial.compound,
      dose: Number(dose),
      dose_unit: unit,
      vial_id: vial.id,
    }));
    setSaving(false);
    toast.success("Opening stack builder…");
    onUpdated();
    navigate({ to: "/dashboard/protocols" });
  };

  return (
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="font-display">{vial.compound} · Calculator</SheetTitle>
        <SheetDescription>Reconstitution math, potency, and syringe draw — saved to this vial.</SheetDescription>
      </SheetHeader>

      <div className="py-4 space-y-5">
        {/* Vial setup */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/40 p-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Size</span>
              <div className="inline-flex rounded border bg-background overflow-hidden">
                {(["mg", "mL"] as const).map((u) => (
                  <button key={u} type="button" onClick={() => setSizeUnit(u)}
                    className={cn("px-1 text-[9px] font-mono transition-colors",
                      sizeUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <Input type="number" step="0.1" value={size} onChange={(e) => setSize(e.target.value)}
              placeholder="0" className="h-7 mt-1 text-sm font-mono text-center px-1" />
          </div>
          <div className="rounded-md bg-muted/40 p-2 text-left">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">BAC (mL)</div>
            <Input type="number" step="0.1" value={bacWater} onChange={(e) => setBacWater(e.target.value)}
              placeholder="mL" className="h-7 mt-1 text-sm font-mono text-center px-1" />
          </div>
          <Metric label="Conc." value={conc ? conc.toFixed(2) : "—"} unit="mg/mL" />
        </div>

        {/* Recon date + potency */}
        <div className="space-y-2">
          <Label className="text-xs">Date reconstituted</Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={cn("flex-1 justify-start font-normal", !reconDate && "text-muted-foreground")}>
                  <CalendarIcon className="size-4 mr-2" />
                  {reconDate ? format(reconDate, "PPP") : "Not set"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={reconDate} onSelect={setReconDate}
                  disabled={(d) => d > new Date()} initialFocus />
              </PopoverContent>
            </Popover>
            {reconDate && (
              <div className="text-right text-xs font-mono text-muted-foreground">
                <div>{days}d ago</div>
                <div>{potency}%</div>
              </div>
            )}
          </div>
          {reconDate && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full transition-all" style={{
                width: `${potency}%`,
                backgroundColor: potency >= 85 ? "#89CFF0" : potency >= 70 ? "#FFD580" : potency >= 50 ? "#FFB3C6" : "#DDD5F0",
              }} />
            </div>
          )}
        </div>

        {/* Dose input */}
        <div className="space-y-2">
          <Label className="text-xs">Desired dose</Label>
          <div className="flex gap-2">
            <Input type="number" inputMode="decimal" step="any" min="0" value={dose}
              onChange={(e) => setDose(e.target.value)} placeholder="e.g. 250" className="flex-1 font-mono" />
            <div className="inline-flex rounded-md border overflow-hidden">
              {(["mcg", "mg", "IU", "units"] as const).map((u) => (
                <button key={u} type="button" onClick={() => setUnit(u)}
                  className={cn("px-2.5 text-xs font-mono transition-colors",
                    unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Syringe selector */}
        <div>
          <Label className="text-xs mb-2 block">Which syringe?</Label>
          <div className="grid grid-cols-3 gap-2">
            {SYRINGE_OPTIONS.map((opt) => {
              const selected = syringeType === opt.type;
              return (
                <button key={opt.type} type="button" onClick={() => setSyringeType(opt.type)}
                  className={cn("rounded-md border p-2 text-left transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground">{opt.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualizer */}
        {conc && (
          <div className="rounded-md border bg-card p-3 flex items-center justify-center">
            <SyringeVisualizer
              compound={vial.compound}
              dose_mcg={doseMcg}
              concentration_mcg_per_ml={concMcgMl}
              potency_score={potency}
              syringe_type={syringeType}
            />
          </div>
        )}

        {/* Result panel */}
        {volumeMl != null && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Draw to</div>
              <div className="font-mono font-semibold tabular-nums">
                <span className="text-primary text-lg">{units100 != null ? units100.toFixed(0) : "—"}</span>
                <span className="text-xs text-muted-foreground ml-1">u</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Volume</div>
              <div className="font-mono font-semibold tabular-nums">
                <span className="text-lg">{volumeMl.toFixed(3)}</span>
                <span className="text-xs text-muted-foreground ml-1">mL</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Doses</div>
              <div className="font-mono font-semibold tabular-nums">
                <span className="text-lg">{dosesPerVial ?? "—"}</span>
                <span className="text-xs text-muted-foreground ml-1">/vial</span>
              </div>
            </div>
          </div>
        )}

        {!conc && (
          <div className="rounded-md border bg-yellow-500/5 border-yellow-500/30 p-3 text-xs">
            Add a BAC water amount above to enable calculations.
          </div>
        )}
      </div>

      <SheetFooter className="gap-2 flex-col sm:flex-row">
        <Button type="button" variant="outline" disabled={saving} onClick={onSave} className="gap-2">
          <Save className="size-4" /> Save
        </Button>
        <Button type="button" disabled={saving || !mg} onClick={onSaveAndAddToStack} className="gap-2">
          <Layers className="size-4" /> Save & Add to Stack
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}

/* ============================ Import Receipt ============================ */

type ParsedVial = {
  compound: string;
  vial_size_mg: number | null;
  quantity: number | null;
  lot_number: string | null;
  notes: string | null;
};

function ImportReceiptDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ParsedVial[]>([]);

  useEffect(() => {
    if (!open) { setPreview(null); setRows([]); setParsing(false); setSaving(false); }
  }, [open]);

  const pickFile = () => fileRef.current?.click();

  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image of your receipt");
      return;
    }
    if (file.size > 6_000_000) {
      toast.error("Image is larger than 6 MB — try a smaller photo");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      setParsing(true);
      try {
        const { data, error } = await supabase.functions.invoke("parse-receipt", {
          body: { image: dataUrl },
        });
        if (error) throw error;
        const vials = (data?.vials ?? []) as ParsedVial[];
        if (vials.length === 0) {
          toast.error("Couldn't find any vials on that receipt");
        } else {
          toast.success(`Found ${vials.length} item${vials.length === 1 ? "" : "s"}`);
        }
        setRows(vials);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to parse receipt";
        toast.error(msg);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateRow = (i: number, patch: Partial<ParsedVial>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const importAll = async () => {
    const usable = rows.filter((r) => r.compound.trim() && r.vial_size_mg && r.vial_size_mg > 0);
    if (usable.length === 0) {
      toast.error("Each item needs a compound and vial size");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }

    const inserts = usable.flatMap((r) => {
      const qty = Math.max(1, r.quantity ?? 1);
      return Array.from({ length: qty }).map(() => ({
        doctor_id: u.user!.id,
        compound: r.compound.trim(),
        vial_size_mg: Number(r.vial_size_mg),
        status: "sealed",
        lot_number: r.lot_number?.trim() || null,
        notes: r.notes?.trim() || null,
      }));
    });

    const { error } = await supabase.from("vials").insert(inserts);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Added ${inserts.length} vial${inserts.length === 1 ? "" : "s"}`);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ReceiptText className="size-5" /> Import from Receipt
          </DialogTitle>
          <DialogDescription>
            Upload a photo of your supplier receipt. AI will extract each vial — review and edit before saving.
          </DialogDescription>
        </DialogHeader>

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }} />

        {!preview && (
          <button type="button" onClick={pickFile}
            className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/50 transition-colors">
            <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
            <div className="font-medium">Tap to upload receipt photo</div>
            <div className="text-xs text-muted-foreground mt-1">JPG or PNG · up to 6 MB</div>
          </button>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <img src={preview} alt="Receipt" className="w-24 h-24 object-cover rounded-md border" />
              <div className="flex-1 text-sm">
                {parsing ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Reading receipt…
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{rows.length} item{rows.length === 1 ? "" : "s"} found</div>
                    <div className="text-xs text-muted-foreground">Edit anything that's wrong, then import.</div>
                  </div>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={pickFile}>Re-upload</Button>
            </div>

            {!parsing && rows.length > 0 && (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {rows.map((r, i) => (
                  <div key={i} className="rounded-md border p-3 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-[10px] uppercase">Compound</Label>
                      <Input value={r.compound} onChange={(e) => updateRow(i, { compound: e.target.value })} />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px] uppercase">Size (mg)</Label>
                      <Input type="number" step="0.1" value={r.vial_size_mg ?? ""}
                        onChange={(e) => updateRow(i, { vial_size_mg: e.target.value ? Number(e.target.value) : null })}
                        className="font-mono" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] uppercase">Qty</Label>
                      <Input type="number" min="1" value={r.quantity ?? 1}
                        onChange={(e) => updateRow(i, { quantity: e.target.value ? Number(e.target.value) : 1 })}
                        className="font-mono" />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(i)}
                        className="h-8 text-destructive hover:text-destructive">
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={saving || parsing || rows.length === 0} onClick={importAll}>
            {saving ? "Saving…" : `Import ${rows.length || ""} vial${rows.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
