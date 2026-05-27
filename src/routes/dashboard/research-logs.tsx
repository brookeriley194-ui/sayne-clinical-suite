import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Trash2, Sun, Moon, Utensils, Calendar as CalendarIcon, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, EmptyCard } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/research-logs")({ component: Page });

type Vial = {
  id: string;
  compound: string;
  reconstituted_at: string | null;
};

type Stack = {
  id: string;
  peptide_name: string;
  vial_id: string | null;
  reconstituted_at: string | null;
  time_of_day: string;
  fasted: boolean;
  cycle_length_days: number;
  start_date: string;
  notes: string | null;
  created_at: string;
};

function Page() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [vials, setVials] = useState<Vial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, v] = await Promise.all([
      supabase.from("stacks").select("*").order("created_at", { ascending: false }),
      supabase.from("vials").select("id, compound, reconstituted_at"),
    ]);
    if (s.error) toast.error(s.error.message);
    if (v.error) toast.error(v.error.message);
    setStacks((s.data ?? []) as Stack[]);
    setVials((v.data ?? []) as Vial[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const active = stacks.filter((s) => {
      const d = differenceInDays(new Date(), new Date(s.start_date));
      return d >= 0 && d <= s.cycle_length_days;
    }).length;
    return { total: stacks.length, active, am: stacks.filter(s => s.time_of_day === "AM").length };
  }, [stacks]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("stacks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed from stack");
    load();
  };

  return (
    <>
      <PageHeader
        title="Research Logs"
        subtitle="Track your current stack and cycle progression."
        action={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2"><Plus className="size-4" /> Add to Stack</Button>
            </SheetTrigger>
            <AddStackSheet vials={vials} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
          </Sheet>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active in stack" value={stats.active} />
        <StatCard label="Total entries" value={stats.total} />
        <StatCard label="AM dosing" value={stats.am} />
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold">Current Stack</h2>
        <span className="text-xs text-muted-foreground">{stacks.length} {stacks.length === 1 ? "compound" : "compounds"}</span>
      </div>

      {loading ? (
        <div className="sayne-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : stacks.length === 0 ? (
        <EmptyCard
          title="Your stack is empty"
          body="Click 'Add to Stack' to log a peptide you're currently running. Link a vial from My Vials to auto-pull reconstitution data."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stacks.map((s) => <StackCard key={s.id} stack={s} onDelete={() => remove(s.id)} />)}
        </div>
      )}
    </>
  );
}

function StackCard({ stack, onDelete }: { stack: Stack; onDelete: () => void }) {
  const start = new Date(stack.start_date);
  const daysElapsed = Math.max(0, differenceInDays(new Date(), start));
  const daysRemaining = Math.max(0, stack.cycle_length_days - daysElapsed);
  const pct = Math.min(100, Math.round((daysElapsed / stack.cycle_length_days) * 100));
  const done = daysElapsed >= stack.cycle_length_days;

  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
            <FlaskConical className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{stack.peptide_name}</div>
            <div className="text-xs text-muted-foreground">
              Started {format(start, "MMM d, yyyy")}
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          {stack.time_of_day === "AM" ? <Sun className="size-3" /> : <Moon className="size-3" />}
          {stack.time_of_day}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Utensils className="size-3" />
          {stack.fasted ? "Fasted" : "Fed"}
        </Badge>
        {stack.reconstituted_at && (
          <Badge variant="outline" className="gap-1">
            <CalendarIcon className="size-3" />
            Recon {format(new Date(stack.reconstituted_at), "MMM d")}
          </Badge>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Cycle progress</span>
          <span className="font-mono tabular-nums">
            {done ? "Complete" : `${daysRemaining}d remaining`} · {daysElapsed}/{stack.cycle_length_days}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", done ? "bg-muted-foreground" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AddStackSheet({ vials, onClose, onSaved }: { vials: Vial[]; onClose: () => void; onSaved: () => void }) {
  const [peptide, setPeptide] = useState("");
  const [vialId, setVialId] = useState<string>("none");
  const [reconDate, setReconDate] = useState<Date | undefined>();
  const [timeOfDay, setTimeOfDay] = useState("AM");
  const [fasted, setFasted] = useState(false);
  const [cycleLength, setCycleLength] = useState("30");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  // Auto-fill from linked vial
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
    const cycle = Number(cycleLength);
    if (!cycle || cycle < 1) return toast.error("Cycle length must be at least 1 day");

    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }

    const { error } = await supabase.from("stacks").insert({
      doctor_id: u.user.id,
      peptide_name: peptide.trim(),
      vial_id: vialId === "none" ? null : vialId,
      reconstituted_at: reconDate ? reconDate.toISOString() : null,
      time_of_day: timeOfDay,
      fasted,
      cycle_length_days: cycle,
      start_date: format(startDate, "yyyy-MM-dd"),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Added to your stack");
    onSaved();
  };

  return (
    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Add to Stack</SheetTitle>
        <SheetDescription>Log a peptide you're currently running.</SheetDescription>
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
            <Label>Cycle length (days)</Label>
            <Input type="number" min="1" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} />
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
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add to Stack"}</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
