import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, differenceInDays, addDays, isSameDay, startOfDay } from "date-fns";
import {
  Plus, Trash2, Sun, Moon, Utensils, Calendar as CalendarIcon, Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatCard, EmptyCard } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DayCell, FREQUENCIES, colorFor, ReorderReminders, VialVisual, computeRemainingDoses,
  ONGOING_CYCLE_DAYS, isOngoing, parseCustomDays,
  type Stack, type DoseLog,
} from "@/components/dose-shared";
import { VialCard, computeVialUsages, type Vial as VialFull, type VialUsage } from "@/routes/dashboard/my-vials";

export const Route = createFileRoute("/dashboard/today")({ component: Page });

function potencyPct(reconstituted_at: string | null): number | null {
  if (!reconstituted_at) return null;
  const days = Math.max(0, Math.floor((Date.now() - new Date(reconstituted_at).getTime()) / 86400000));
  return Math.max(0, Math.min(100, Math.round(100 - (days * 100) / 60)));
}
function GreetingHeader({ vials }: { vials: { compound: string; reconstituted_at: string | null; status: string }[] }) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const first =
    meta.full_name?.split(" ")[0] ||
    meta.name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";
  const low = vials
    .filter((v) => v.status === "open" && v.reconstituted_at)
    .map((v) => ({ v, p: potencyPct(v.reconstituted_at) }))
    .filter((x) => x.p != null && (x.p as number) < 75)
    .sort((a, b) => (a.p as number) - (b.p as number))[0];
  return (
    <div className="mb-6 space-y-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {greet}, <span className="text-primary">{first}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your day — log doses, check your stack, stay on track.</p>
      </div>
      {low && (
        <div
          className="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: "color-mix(in oklab, #FFD580 22%, transparent)", borderColor: "color-mix(in oklab, #FFD580 60%, transparent)" }}
        >
          <span aria-hidden>⚠️</span>
          <span>
            Heads up — <strong>{low.v.compound}</strong> is at <span className="font-mono">{low.p}%</span> potency.
          </span>
        </div>
      )}
    </div>
  );
}



type Vial = VialFull;
const DOSE_UNITS = ["mg", "mcg", "units", "mL"];
const VIAL_STATUSES = ["sealed", "open", "used"] as const;

function Page() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [vials, setVials] = useState<Vial[]>([]);
  const [vialUsage, setVialUsage] = useState<Record<string, VialUsage>>({});
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [doseCounts, setDoseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Stack | null>(null);
  


  const load = async () => {
    setLoading(true);
    const in30 = format(addDays(new Date(), 30), "yyyy-MM-dd");
    const past30 = format(addDays(new Date(), -30), "yyyy-MM-dd");
    const [v, d, dc, p, vs] = await Promise.all([
      supabase.from("vials").select("*").order("created_at", { ascending: false }),
      supabase.from("stack_doses").select("id, stack_id, dose_date, period").gte("dose_date", past30).lte("dose_date", in30),
      supabase.from("stack_doses").select("stack_id"),
      supabase.from("protocols").select("*").order("created_at", { ascending: false }),
      supabase.from("stacks").select("id, vial_id, dose, dose_unit, created_at").not("vial_id", "is", null),
    ]);
    const protocolStacks: Stack[] = ((p.data ?? []) as ProtocolRow[]).map((r) => ({
      id: r.id,
      peptide_name: r.compound,
      vial_id: null,
      reconstituted_at: null,
      time_of_day: r.time_of_day ?? "AM",
      fasted: !!r.fasted,
      cycle_length_days: r.ongoing ? ONGOING_CYCLE_DAYS : (r.duration_days ?? 30),
      start_date: (r.created_at ?? new Date().toISOString()).slice(0, 10),
      dose: r.dose ?? null,
      dose_unit: r.dose_unit ?? "mg",
      frequency: r.frequency ?? "daily",
      notes: null,
      created_at: r.created_at,
    }));
    setStacks(protocolStacks);
    const vialList = (v.data ?? []) as Vial[];
    setVials(vialList);
    setVialUsage(computeVialUsages(
      vialList,
      (vs.data ?? []) as { id: string; vial_id: string; dose: number | null; dose_unit: string; created_at: string }[],
      (dc.data ?? []) as { stack_id: string }[],
    ));
    setDoses((d.data ?? []) as DoseLog[]);
    const counts: Record<string, number> = {};
    for (const row of (dc.data ?? []) as { stack_id: string }[]) {
      counts[row.stack_id] = (counts[row.stack_id] ?? 0) + 1;
    }
    setDoseCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("today-protocols")
      .on("postgres_changes", { event: "*", schema: "public", table: "protocols" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("stack:prefill");
    if (!raw) return;
    sessionStorage.removeItem("stack:prefill");
    let p: Partial<Stack> & { peptide_name?: string; dose?: number; dose_unit?: string; reconstituted_at?: string | null };
    try { p = JSON.parse(raw); } catch { return; }
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data, error } = await supabase.from("stacks").insert({
        doctor_id: u.user.id,
        peptide_name: p.peptide_name ?? "New peptide",
        dose: p.dose ?? null,
        dose_unit: p.dose_unit ?? "mg",
        reconstituted_at: p.reconstituted_at ?? null,
        time_of_day: "AM",
        fasted: false,
        cycle_length_days: 30,
        start_date: format(new Date(), "yyyy-MM-dd"),
        frequency: "daily",
      }).select().single();
      if (error) { toast.error(error.message); return; }
      toast.success("Added to stack — finish setting it up");
      await load();
      setEditing(data as Stack);

      setSheetOpen(true);
    })();
  }, []);

  const stats = useMemo(() => {
    const active = stacks.filter((s) => {
      const e = differenceInDays(new Date(), new Date(s.start_date));
      return e >= 0 && e <= s.cycle_length_days;
    }).length;
    return { total: stacks.length, active, am: stacks.filter((s) => s.time_of_day === "AM").length };
  }, [stacks]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("stacks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed from stack");
    load();
  };

  const changeVialStatus = async (vialId: string, status: string) => {
    const { error } = await supabase.from("vials").update({ status }).eq("id", vialId);
    if (error) return toast.error(error.message);
    toast.success(`Vial status: ${status}`);
    load();
  };


  const toggleDose = async (stack: Stack, date: Date, period: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = doses.find((dd) => dd.stack_id === stack.id && dd.dose_date === dateStr && dd.period === period);
    if (existing) {
      const { error } = await supabase.from("stack_doses").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
      setDoses((prev) => prev.filter((d) => d.id !== existing.id));
      setDoseCounts((prev) => ({ ...prev, [stack.id]: Math.max(0, (prev[stack.id] ?? 0) - 1) }));
    } else {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return toast.error("Not signed in");
      const { data, error } = await supabase.from("stack_doses").insert({
        doctor_id: u.user.id, stack_id: stack.id, dose_date: dateStr, period,
      }).select().single();
      if (error) return toast.error(error.message);
      setDoses((prev) => [...prev, data as DoseLog]);
      setDoseCounts((prev) => ({ ...prev, [stack.id]: (prev[stack.id] ?? 0) + 1 }));
    }
  };

  const openAdd = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (s: Stack) => { setEditing(s); setSheetOpen(true); };

  return (
    <>
      <GreetingHeader vials={vials} />
      <div className="mb-4 flex justify-end">
        <Button className="gap-2" onClick={openAdd}><Plus className="size-4" /> Add to Stack</Button>
      </div>

      <ReorderReminders />

      <DoseCalendar stacks={stacks} doses={doses} onToggle={toggleDose} />

      <div className="mt-6" />

      <MyVialsSection vials={vials} usage={vialUsage} onReload={load} />

      <div className="mt-6" />

      <ProtocolStacksSection />


      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <StackSheet
          key={editing?.id ?? "new"}
          editing={editing}
          vials={vials}
          onClose={() => setSheetOpen(false)}
          onSaved={() => { setSheetOpen(false); load(); }}
        />
      </Sheet>
    </>
  );
}

function DoseCalendar({
  stacks, doses, onToggle,
}: { stacks: Stack[]; doses: DoseLog[]; onToggle: (s: Stack, d: Date, p: string) => void }) {
  const today = startOfDay(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);

  const monthDays = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  const weekStart = addDays(today, -today.getDay() + weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayDate = addDays(today, dayOffset);

  return (
    <div className="sayne-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            {view === "month" ? "30-Day" : view === "week" ? "Week" : "Day"} Dose Calendar
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">AM on top, PM on bottom. Check off each dose as you take it.</p>
        </div>
        <div className="flex items-center gap-2">
          {view === "week" && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w - 1)} className="h-7 px-2">‹</Button>
              <span className="text-xs text-muted-foreground font-mono w-32 text-center">
                {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w + 1)} className="h-7 px-2">›</Button>
            </div>
          )}
          {view === "day" && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setDayOffset((d) => d - 1)} className="h-7 px-2">‹</Button>
              <span className="text-xs text-muted-foreground font-mono w-36 text-center">
                {format(dayDate, "EEE, MMM d")}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setDayOffset((d) => d + 1)} className="h-7 px-2">›</Button>
            </div>
          )}
          <div className="inline-flex rounded-md border p-0.5 bg-muted/30">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "text-xs px-3 py-1 rounded transition-colors capitalize",
                  view === v ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >{v}</button>
            ))}
          </div>
        </div>
      </div>

      {stacks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {stacks.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs">
              <span className="size-2.5 rounded-full" style={{ background: colorFor(s.id) }} />
              <span className="text-muted-foreground">
                {s.peptide_name}
                {s.dose != null && <span className="ml-1 font-mono">{s.dose}{s.dose_unit}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {stacks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Add a peptide to your stack to see the calendar.</p>
      ) : view === "month" ? (
        <div className="grid grid-cols-7 gap-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[10px] uppercase tracking-wider text-muted-foreground text-center pb-1">{d}</div>
          ))}
          {Array.from({ length: today.getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
          {monthDays.map((day) => (
            <DayCell key={day.toISOString()} day={day} stacks={stacks} doses={doses} onToggle={onToggle} isToday={isSameDay(day, today)} />
          ))}
        </div>
      ) : view === "week" ? (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <DayCell key={day.toISOString()} day={day} stacks={stacks} doses={doses} onToggle={onToggle} isToday={isSameDay(day, today)} size="lg" />
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <DayCell day={dayDate} stacks={stacks} doses={doses} onToggle={onToggle} isToday={isSameDay(dayDate, today)} size="xl" />
        </div>
      )}
    </div>
  );
}

function StackCard({
  stack, vial, dosesTaken, onDelete, onEdit, onChangeVialStatus,
}: {
  stack: Stack;
  vial: Vial | null;
  dosesTaken: number;
  onDelete: () => void;
  onEdit: () => void;
  onChangeVialStatus: (vialId: string, status: string) => void;
}) {
  const start = new Date(stack.start_date);
  const ongoing = isOngoing(stack);
  const daysElapsed = Math.max(0, differenceInDays(new Date(), start));
  const daysRemaining = ongoing ? 0 : Math.max(0, stack.cycle_length_days - daysElapsed);
  const pct = ongoing ? 0 : Math.min(100, Math.round((daysElapsed / stack.cycle_length_days) * 100));
  const done = !ongoing && daysElapsed >= stack.cycle_length_days;
  const customDays = parseCustomDays(stack.frequency);
  const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const freqLabel = customDays
    ? customDays.length ? customDays.sort((a, b) => a - b).map((d) => DAY_ABBR[d]).join("/") : "Custom"
    : FREQUENCIES.find((f) => f.value === stack.frequency)?.label ?? stack.frequency;
  const conc = vial?.concentration_mg_per_ml ??
    (vial?.bac_water_ml && vial.bac_water_ml > 0 ? vial.vial_size_mg / vial.bac_water_ml : null);
  const { remaining, total, percentLeft } = computeRemainingDoses(stack, vial?.vial_size_mg ?? null, dosesTaken, conc);
  const stackColor = colorFor(stack.id);

  const vialStatusColor = !vial ? ""
    : vial.status === "open" ? "bg-primary/15 text-primary border-primary/30"
    : vial.status === "sealed" ? "bg-muted text-foreground/80 border-border"
    : "bg-destructive/10 text-destructive border-destructive/30";

  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <VialVisual fillPercent={percentLeft} size="md" />
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{stack.peptide_name}</div>
            <div className="text-xs text-muted-foreground">Started {format(start, "MMM d, yyyy")}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {vial && (
            <Select value={vial.status} onValueChange={(s) => onChangeVialStatus(vial.id, s)}>
              <SelectTrigger className={cn("h-7 w-[92px] text-xs capitalize font-medium", vialStatusColor)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-8"><Pencil className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-2">
        {stack.dose != null && (
          <div className="rounded-md bg-muted/40 p-3 flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</span>
            <span className="font-mono tabular-nums text-lg font-semibold">{stack.dose}</span>
            <span className="text-sm text-muted-foreground font-mono">{stack.dose_unit}</span>
          </div>
        )}
        <div
          className="rounded-md p-3 flex items-baseline gap-2 border"
          style={{ background: `${stackColor}12`, borderColor: `${stackColor}40` }}
        >
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</span>
          {remaining != null && total != null ? (
            <>
              <span className="font-mono tabular-nums text-lg font-semibold">{remaining}</span>
              <span className="text-xs text-muted-foreground font-mono">/ {total} doses</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Link a vial to track</span>
          )}
        </div>
      </div>


      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          {stack.time_of_day === "AM" ? <Sun className="size-3" /> : <Moon className="size-3" />}
          {stack.time_of_day}
        </Badge>
        <Badge variant="outline" className="gap-1"><Utensils className="size-3" />{stack.fasted ? "Fasted" : "Fed"}</Badge>
        {stack.dose == null && <Badge variant="outline">{freqLabel}</Badge>}
        {stack.reconstituted_at && (
          <Badge variant="outline" className="gap-1"><CalendarIcon className="size-3" />Recon {format(new Date(stack.reconstituted_at), "MMM d")}</Badge>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Cycle progress</span>
          <span className="font-mono tabular-nums">
            {ongoing
              ? `Ongoing · day ${daysElapsed + 1}`
              : `${done ? "Complete" : `${daysRemaining}d remaining`} · ${daysElapsed}/${stack.cycle_length_days}`}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", ongoing ? "bg-primary/60" : done ? "bg-muted-foreground" : "bg-primary")}
            style={{ width: ongoing ? "100%" : `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StackSheet({
  editing, vials, onClose, onSaved,
}: { editing: Stack | null; vials: Vial[]; onClose: () => void; onSaved: () => void }) {
  const [peptide, setPeptide] = useState(editing?.peptide_name ?? "");
  const [vialId, setVialId] = useState<string>(editing?.vial_id ?? "none");
  const [reconDate, setReconDate] = useState<Date | undefined>(editing?.reconstituted_at ? new Date(editing.reconstituted_at) : undefined);
  const [timeOfDay, setTimeOfDay] = useState(editing?.time_of_day ?? "AM");
  const [fasted, setFasted] = useState(editing?.fasted ?? false);
  const editingOngoing = editing ? editing.cycle_length_days >= ONGOING_CYCLE_DAYS : false;
  const [ongoing, setOngoing] = useState(editingOngoing);
  const [cycleLength, setCycleLength] = useState(editingOngoing ? "30" : String(editing?.cycle_length_days ?? 30));
  const [startDate, setStartDate] = useState<Date>(editing ? new Date(editing.start_date) : new Date());
  const [dose, setDose] = useState(editing?.dose != null ? String(editing.dose) : "");
  const [doseUnit, setDoseUnit] = useState(editing?.dose_unit ?? "mg");
  const editingCustom = editing ? parseCustomDays(editing.frequency) : null;
  const [frequency, setFrequency] = useState(editingCustom ? "custom" : (editing?.frequency ?? "daily"));
  const [customDays, setCustomDays] = useState<number[]>(editingCustom ?? []);
  const [saving, setSaving] = useState(false);

  const onVialChange = (id: string) => {
    setVialId(id);
    if (id === "none") return;
    const v = vials.find((x) => x.id === id);
    if (v) {
      if (!peptide) setPeptide(v.compound);
      if (v.reconstituted_at) setReconDate(new Date(v.reconstituted_at));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peptide.trim()) return toast.error("Peptide name is required");
    let cycle: number;
    if (ongoing) {
      cycle = ONGOING_CYCLE_DAYS;
    } else {
      cycle = Number(cycleLength);
      if (!cycle || cycle < 1) return toast.error("Cycle length must be at least 1 day");
    }
    let freqValue = frequency;
    if (frequency === "custom") {
      if (customDays.length === 0) return toast.error("Pick at least one day for custom frequency");
      freqValue = "custom:" + [...customDays].sort((a, b) => a - b).join(",");
    }

    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }

    const payload = {
      doctor_id: u.user.id,
      peptide_name: peptide.trim(),
      vial_id: vialId === "none" ? null : vialId,
      reconstituted_at: reconDate ? reconDate.toISOString() : null,
      time_of_day: timeOfDay,
      fasted,
      cycle_length_days: cycle,
      start_date: format(startDate, "yyyy-MM-dd"),
      dose: dose ? Number(dose) : null,
      dose_unit: doseUnit,
      frequency: freqValue,
    };

    const { error } = editing
      ? await supabase.from("stacks").update(payload).eq("id", editing.id)
      : await supabase.from("stacks").insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Stack updated" : "Added to your stack");
    onSaved();
  };

  return (
    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{editing ? "Edit Stack Entry" : "Add to Stack"}</SheetTitle>
        <SheetDescription>{editing ? "Update this peptide's dosing or schedule." : "Log a peptide you're currently running."}</SheetDescription>
      </SheetHeader>
      <form onSubmit={submit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Link a vial (optional)</Label>
          <Select value={vialId} onValueChange={onVialChange}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — enter manually</SelectItem>
              {vials.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.compound}{v.reconstituted_at ? ` · recon ${format(new Date(v.reconstituted_at), "MMM d")}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Peptide name *</Label>
          <Input value={peptide} onChange={(e) => setPeptide(e.target.value)} placeholder="e.g. Semaglutide" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2 col-span-2">
            <Label>Dose</Label>
            <Input type="number" step="any" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="0.25" />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={doseUnit} onValueChange={setDoseUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOSE_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {frequency === "custom" && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="text-xs text-muted-foreground">Pick the days of the week</div>
              <div className="flex flex-wrap gap-1.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, idx) => {
                  const active = customDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setCustomDays((prev) =>
                          prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
                        )
                      }
                      className={cn(
                        "h-9 min-w-[42px] px-2 rounded-md border text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Date reconstituted</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start font-normal">
                <CalendarIcon className="size-4 mr-2" />
                {reconDate ? format(reconDate, "PPP") : "Not set"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={reconDate} onSelect={setReconDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Time of day</Label>
            <Select value={timeOfDay} onValueChange={setTimeOfDay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Cycle length (days)</Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ongoing}
                  onChange={(e) => setOngoing(e.target.checked)}
                  className="size-3.5 accent-primary cursor-pointer"
                />
                Ongoing
              </label>
            </div>
            <Input
              type="number"
              min="1"
              value={ongoing ? "" : cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              disabled={ongoing}
              placeholder={ongoing ? "No fixed end" : "30"}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label>Fasted</Label>
            <p className="text-xs text-muted-foreground">Take on an empty stomach</p>
          </div>
          <Switch checked={fasted} onCheckedChange={setFasted} />
        </div>

        <div className="space-y-2">
          <Label>Cycle start date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start font-normal">
                <CalendarIcon className="size-4 mr-2" />
                {format(startDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <SheetFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add to Stack"}</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}

type ProtocolRow = {
  id: string; name: string; compound: string; dose: number; dose_unit: string;
  frequency: string; route: string; duration_days: number | null;
  ongoing: boolean; time_of_day: string; fasted: boolean; created_at: string;
};

function ProtocolStacksSection() {
  const [rows, setRows] = useState<ProtocolRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("protocols").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as ProtocolRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("protocols-today")
      .on("postgres_changes", { event: "*", schema: "public", table: "protocols" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const grouped = (() => {
    const map = new Map<string, ProtocolRow[]>();
    for (const r of rows) {
      const arr = map.get(r.name) ?? [];
      arr.push(r);
      map.set(r.name, arr);
    }
    return Array.from(map.entries());
  })();

  return (
    <>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold">Current Stack</h2>
        <span className="text-xs text-muted-foreground">
          {grouped.length} stack{grouped.length === 1 ? "" : "s"} · {rows.length} compound{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      {loading ? (
        <div className="sayne-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : grouped.length === 0 ? (
        <EmptyCard title="Your stack is empty" body="Head to My Stacks to build one — it'll show up here in real time." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([name, items]) => {
            const first = items[0];
            return (
              <div key={name} className="sayne-card p-5">
                <div className="mb-3">
                  <h3 className="font-display text-2xl font-semibold">{name}</h3>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {items.length} compound{items.length === 1 ? "" : "s"} · {first.route} · {first.ongoing ? "Ongoing" : first.duration_days ? `${first.duration_days}d cycle` : ""}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((r) => (
                    <div key={r.id} className="rounded-lg border p-3 space-y-2">
                      <div className="font-semibold text-sm">{r.compound}</div>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-xl font-semibold tabular-nums">{r.dose}</span>
                        <span className="text-xs text-muted-foreground">{r.dose_unit}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{r.frequency}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.time_of_day}</Badge>
                        {r.fasted && <Badge variant="outline" className="text-[10px]">Fasted</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
