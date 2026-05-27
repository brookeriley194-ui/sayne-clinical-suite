import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Trash2, FlaskConical, Calendar as CalendarIcon, Droplet, PackageX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyCard } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReorderReminders, VialVisual, doseToMg } from "@/components/dose-shared";

export const Route = createFileRoute("/dashboard/my-vials")({ component: Page });

type Vial = {
  id: string;
  compound: string;
  vial_size_mg: number;
  bac_water_ml: number | null;
  concentration_mg_per_ml: number | null;
  reconstituted_at: string | null;
  status: string;
  lot_number: string | null;
  notes: string | null;
  created_at: string;
};

const STATUSES = ["sealed", "open", "used"] as const;

function potencyFromDays(days: number) {
  return Math.max(0, Math.round(100 - (days * 100) / 60));
}

type VialUsage = {
  mgUsed: number;
  percentLeft: number; // 0–100 remaining
  remainingDoses: number | null;
  totalDoses: number | null;
  doseLabel: string | null; // e.g. "0.25 mg"
};

function Page() {
  const [vials, setVials] = useState<Vial[]>([]);
  const [usage, setUsage] = useState<Record<string, VialUsage>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "open" | "sealed" | "used">("all");

  const load = async () => {
    setLoading(true);
    const [v, s, d] = await Promise.all([
      supabase.from("vials").select("*").order("created_at", { ascending: false }),
      supabase.from("stacks").select("id, vial_id, dose, dose_unit, created_at").not("vial_id", "is", null),
      supabase.from("stack_doses").select("stack_id"),
    ]);
    if (v.error) toast.error(v.error.message);
    const vialList = (v.data ?? []) as Vial[];
    setVials(vialList);

    const stacks = (s.data ?? []) as { id: string; vial_id: string; dose: number | null; dose_unit: string; created_at: string }[];
    const doses = (d.data ?? []) as { stack_id: string }[];
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

      // Estimate doses left using first linked stack with a parseable dose
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
    setUsage(u);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

  return (
    <>
      <PageHeader
        title="My Vials"
        subtitle="Personal inventory and reconstitution history."
        action={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2"><Plus className="size-4" /> Add Vial</Button>
            </SheetTrigger>
            <AddVialSheet onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
          </Sheet>
        }
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleVials.map((v) => (
            <VialCard
              key={v.id}
              vial={v}
              usage={usage[v.id]}
              onDelete={() => remove(v.id)}
              onMarkEmpty={() => markEmpty(v.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function VialCard({ vial, onDelete, onMarkEmpty }: { vial: Vial; onDelete: () => void; onMarkEmpty: () => void }) {
  const days = vial.reconstituted_at
    ? differenceInDays(new Date(), new Date(vial.reconstituted_at))
    : null;
  const potency = days !== null ? potencyFromDays(days) : null;
  const conc =
    vial.concentration_mg_per_ml ??
    (vial.bac_water_ml && vial.bac_water_ml > 0 ? vial.vial_size_mg / vial.bac_water_ml : null);

  const statusColor =
    vial.status === "open" ? "bg-primary/15 text-primary border-primary/30"
    : vial.status === "sealed" ? "bg-muted text-foreground/80"
    : "bg-destructive/10 text-destructive border-destructive/30";

  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center">
            <FlaskConical className="size-4" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{vial.compound}</div>
            {vial.lot_number && (
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                Lot {vial.lot_number}
              </div>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("capitalize", statusColor)}>{vial.status}</Badge>
      </div>

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
          {vial.status !== "used" && (
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
  const [compound, setCompound] = useState("");
  const [vialSize, setVialSize] = useState("");
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compound.trim() || !vialSize) {
      return toast.error("Compound and vial size are required");
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }

    const { error } = await supabase.from("vials").insert({
      doctor_id: u.user.id,
      compound: compound.trim(),
      vial_size_mg: Number(vialSize),
      bac_water_ml: bacWater ? Number(bacWater) : null,
      concentration_mg_per_ml: conc ? Number(conc) : null,
      reconstituted_at: reconDate ? reconDate.toISOString() : null,
      status,
      lot_number: lot.trim() || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vial added");
    onSaved();
  };

  return (
    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Add Vial</SheetTitle>
        <SheetDescription>Register a vial to track concentration and potency.</SheetDescription>
      </SheetHeader>
      <form onSubmit={submit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Compound *</Label>
          <Input value={compound} onChange={(e) => setCompound(e.target.value)} placeholder="e.g. Semaglutide" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Vial size (mg) *</Label>
            <Input type="number" step="0.1" value={vialSize} onChange={(e) => setVialSize(e.target.value)} placeholder="5" />
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
        <SheetFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Vial"}</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
