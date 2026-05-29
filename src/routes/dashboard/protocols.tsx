import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, ClipboardPaste, Sparkles, Check, BookOpen, Share2, CircleDot, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { JournalCurveModal, ProtocolCompletionModal, type JournalProtocol } from "@/components/protocol-journal";

export const Route = createFileRoute("/dashboard/protocols")({ component: Page });

import { PEPTIDES } from "@/lib/peptides";
import { PeptideCombobox } from "@/components/peptide-combobox";
import { Trash2 } from "lucide-react";

const COMPOUNDS = PEPTIDES;
const FREQUENCIES = ["Once Daily", "Twice Daily", "Every Other Day", "Weekly", "Custom"] as const;
const ROUTES = ["Subcutaneous", "Intranasal", "Oral", "Topical"] as const;
const UNITS = ["mcg", "mg", "IU", "units"] as const;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MINT = "#98E4B2";
const PINK = "#F8C8D0";
const NAVY = "#1a1a2e";

type Stack = {
  id: string; name: string; compound: string; dose: number; dose_unit: string;
  frequency: string; route: string; duration_days: number | null;
  ongoing: boolean; notes: string | null; created_at: string; source?: string | null;
  vial_id?: string | null; time_of_day: string; fasted: boolean;
};

type VialOpt = {
  id: string; compound: string; vial_size_mg: number; status: string;
  default_dose: number | null; default_dose_unit: string | null;
};

const TIMES = ["AM", "PM", "Both"] as const;

const compoundRowSchema = z.object({
  compound: z.string().trim().min(1, "Pick a compound"),
  dose: z.number().positive("Dose must be > 0").max(100000),
  dose_unit: z.enum(UNITS),
  vial_id: z.string().nullable(),
  frequency: z.string().min(1),
  time_of_day: z.enum(TIMES),
  fasted: z.boolean(),
});

const schema = z.object({
  name: z.string().trim().min(1, "Give your stack a name").max(120),
  compounds: z.array(compoundRowSchema).min(1, "Add at least one compound"),
  route: z.enum(ROUTES),
  ongoing: z.boolean(),
  duration_days: z.number().int().positive().max(3650).nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

function Page() {
  const { user } = useAuth();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<{ name: string; rows: Stack[] } | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("protocols").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setStacks((data ?? []) as Stack[]);
  }
  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (sessionStorage.getItem("stack:prefill")) setBuildOpen(true);
  }, []);

  const groupedStacks = (() => {
    const map = new Map<string, Stack[]>();
    for (const s of stacks) {
      const arr = map.get(s.name) ?? [];
      arr.push(s);
      map.set(s.name, arr);
    }
    return Array.from(map.entries()).map(([name, rows]) => ({ name, rows }));
  })();

  async function handleDeleteStack(name: string, rows: Stack[]) {
    if (!confirm(`Delete the entire "${name}" stack? This removes ${rows.length} compound${rows.length === 1 ? "" : "s"}.`)) return;
    const ids = rows.map((r) => r.id);
    const { error } = await supabase.from("protocols").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success("Stack deleted");
    void load();
  }

  function handleEditStack(name: string, rows: Stack[]) {
    setEditingStack({ name, rows });
    setBuildOpen(true);
  }

  return (
    <>
      <PageHeader
        title="My Stacks"
        subtitle="Track everything you're running. Import from AI, build your own, or grab one from the community."
        action={
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => { setEditingStack(null); setBuildOpen(true); }}
              className="gap-2 hover:opacity-90"
              style={{ backgroundColor: BABY_BLUE, color: NAVY }}
            >
              <Plus className="h-4 w-4" />
              Build a Stack
            </Button>
            <Button
              onClick={() => setImportOpen(true)}
              className="gap-2 hover:opacity-90"
              style={{ backgroundColor: LAVENDER, color: NAVY }}
            >
              <ClipboardPaste className="h-4 w-4" />
              Import from AI
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="stacks">
        <TabsList className="mb-4">
          <TabsTrigger value="stacks">My Stacks</TabsTrigger>
          <TabsTrigger value="log">Research Log</TabsTrigger>
        </TabsList>

        <TabsContent value="stacks">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold">My Stacks</h2>
            <span className="text-xs text-muted-foreground font-mono">{groupedStacks.length} stack{groupedStacks.length === 1 ? "" : "s"}</span>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : groupedStacks.length === 0 ? (
            <div className="sayne-card p-10 text-center">
              <p className="text-sm text-muted-foreground">No stacks yet. Build one or import from AI to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedStacks.map((g) => (
                <StackGroup
                  key={g.name}
                  name={g.name}
                  rows={g.rows}
                  onEdit={() => handleEditStack(g.name, g.rows)}
                  onDelete={() => handleDeleteStack(g.name, g.rows)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="log">
          <ResearchLog stacks={stacks} loading={loading} />
        </TabsContent>
      </Tabs>

      <ImportFromAIModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSaved={() => { setImportOpen(false); void load(); }}
      />

      <BuildStackModal
        open={buildOpen}
        onClose={() => { setBuildOpen(false); setEditingStack(null); }}
        onSaved={() => { setBuildOpen(false); setEditingStack(null); void load(); }}
        userId={user?.id ?? null}
        editing={editingStack}
      />
    </>
  );
}

function StackGroup({
  name, rows, onEdit, onDelete,
}: { name: string; rows: Stack[]; onEdit: () => void; onDelete: () => void }) {
  const first = rows[0];
  const status = deriveStatus(first);
  const remaining = daysRemaining(first);
  const [journalOpen, setJournalOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const jp: JournalProtocol = {
    id: first.id, name: first.name, compound: first.compound,
    created_at: first.created_at, ongoing: first.ongoing, duration_days: first.duration_days,
  };
  return (
    <div className="sayne-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: `color-mix(in oklab, ${status.color} 35%, transparent)`, color: NAVY }}
            >
              {status.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              {rows.length} compound{rows.length === 1 ? "" : "s"} · {first.route} · {first.ongoing ? "Ongoing" : remaining != null ? `${remaining}d left` : `${first.duration_days}d`}
            </span>
          </div>
          <h3
            className="text-2xl font-semibold leading-tight truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {name}
          </h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setJournalOpen(true)} className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Journal
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCompleteOpen(true)} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Mark Complete
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}
            className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <JournalCurveModal open={journalOpen} onOpenChange={setJournalOpen} protocol={jp} />
      <ProtocolCompletionModal open={completeOpen} onOpenChange={setCompleteOpen} protocol={jp} />


      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">
        {rows.length} compound{rows.length === 1 ? "" : "s"} in this stack
      </div>
      <div className="divide-y rounded-lg border" style={{ borderColor: "var(--border)" }}>
        {rows.map((r) => {
          const rRemaining = daysRemaining(r);
          return (
            <div key={r.id} className="p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <div className="font-semibold text-sm">{r.compound}</div>
                {!r.vial_id && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">vial not set up</div>
                )}
              </div>
              <div className="flex items-baseline gap-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="text-lg font-semibold tabular-nums">{r.dose}</span>
                <span className="text-xs text-muted-foreground">{r.dose_unit}</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: "var(--panel)", border: "1px solid var(--border)" }}>
                {r.frequency}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: "var(--panel)", border: "1px solid var(--border)" }}>
                {r.route}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{ backgroundColor: `color-mix(in oklab, ${LAVENDER} 30%, transparent)`, color: NAVY }}>
                {r.ongoing ? "Ongoing" : rRemaining != null ? `${rRemaining}d left` : `${r.duration_days ?? "—"}d`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function deriveStatus(s: Stack): { label: string; color: string } {
  if (s.ongoing) return { label: "Active", color: MINT };
  if (s.duration_days) {
    const started = new Date(s.created_at).getTime();
    const ends = started + s.duration_days * 86400000;
    if (Date.now() > ends) return { label: "Completed", color: BABY_BLUE };
    return { label: "Active", color: MINT };
  }
  return { label: "Planning", color: LAVENDER };
}

function daysRemaining(s: Stack): number | null {
  if (s.ongoing || !s.duration_days) return null;
  const started = new Date(s.created_at).getTime();
  const ends = started + s.duration_days * 86400000;
  const remaining = Math.ceil((ends - Date.now()) / 86400000);
  return Math.max(0, remaining);
}

function StackCard({ s }: { s: Stack }) {
  const navigate = useNavigate();
  const isAi = s.source === "ai_import";
  const status = deriveStatus(s);
  const remaining = daysRemaining(s);
  const isActive = status.label === "Active";
  // Today's dose log not tracked per-stack at this layer — placeholder unchecked.
  const doseLogged = false;

  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: `color-mix(in oklab, ${status.color} 35%, transparent)`, color: NAVY }}
            >
              {status.label}
            </span>
            {isAi && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: LAVENDER, color: NAVY }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI Import
              </span>
            )}
          </div>
          <h3
            className="text-xl font-semibold leading-tight truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {s.compound}
          </h3>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate mt-0.5">
            {s.name}
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <span className="text-2xl font-semibold tabular-nums">{s.dose}</span>
        <span className="text-sm text-muted-foreground">{s.dose_unit}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: "var(--panel)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
          {s.frequency}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: "var(--panel)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
          {s.route}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono"
          style={{ backgroundColor: "color-mix(in oklab, var(--secondary) 35%, transparent)", color: "var(--foreground)" }}>
          {s.ongoing ? "Ongoing" : remaining != null ? `${remaining}d left` : `${s.duration_days}d`}
        </span>
      </div>

      {isActive && (
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
          style={{
            backgroundColor: doseLogged
              ? `color-mix(in oklab, ${MINT} 25%, transparent)`
              : "var(--panel)",
            border: `1px solid color-mix(in oklab, ${doseLogged ? MINT : "var(--border)"} 60%, transparent)`,
          }}
        >
          {doseLogged ? (
            <Check className="h-3.5 w-3.5" style={{ color: NAVY }} />
          ) : (
            <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="font-medium">Today's Dose</span>
          <span className="text-muted-foreground ml-auto">
            {doseLogged ? "Logged" : "Not yet"}
          </span>
        </div>
      )}

      {s.notes && <p className="text-xs text-muted-foreground line-clamp-2">{s.notes}</p>}

      <div className="mt-auto grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => toast.success("Dose logged for today")}
          className="inline-flex items-center justify-center gap-1.5 rounded-md h-9 text-xs font-medium hover:opacity-90"
          style={{ backgroundColor: MINT, color: NAVY }}
        >
          <Check className="h-3.5 w-3.5" />
          Log Dose
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard/research-logs" })}
          className="inline-flex items-center justify-center gap-1.5 rounded-md h-9 text-xs font-medium border hover:bg-[var(--panel)]"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Journal
        </button>
        <button
          type="button"
          onClick={() => toast("Sharing to feed coming soon")}
          className="inline-flex items-center justify-center gap-1.5 rounded-md h-9 text-xs font-medium hover:opacity-90"
          style={{ backgroundColor: LAVENDER, color: NAVY }}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </div>
    </div>
  );
}

/* ============================== Build a Stack ============================== */

type CompoundRow = {
  compound: string;
  customCompound: string;
  dose: string;
  dose_unit: typeof UNITS[number];
  vial_id: string;
  frequency: typeof FREQUENCIES[number];
  customDays: number[];
  time_of_day: typeof TIMES[number];
  fasted: boolean;
};

const emptyRow = (): CompoundRow => ({
  compound: "", customCompound: "", dose: "", dose_unit: "mcg", vial_id: "none",
  frequency: "Once Daily", customDays: [], time_of_day: "AM", fasted: false,
});

function BuildStackModal({
  open, onClose, onSaved, userId, editing,
}: { open: boolean; onClose: () => void; onSaved: () => void; userId: string | null; editing?: { name: string; rows: Stack[] } | null }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<CompoundRow[]>([emptyRow()]);
  const [route, setRoute] = useState<typeof ROUTES[number]>("Subcutaneous");
  const [ongoing, setOngoing] = useState(false);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [vials, setVials] = useState<VialOpt[]>([]);
  const [vialProtocols, setVialProtocols] = useState<Record<string, { dose: number | null; dose_unit: string; frequency: string; duration_days: number | null; ongoing: boolean; time_of_day: string; fasted: boolean }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName(""); setRows([emptyRow()]);
      setRoute("Subcutaneous"); setOngoing(false);
      setDuration(""); setNotes(""); setSaving(false);
      return;
    }
    void supabase.from("vials")
      .select("id, compound, vial_size_mg, status, default_dose, default_dose_unit")
      .neq("status", "used")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVials((data ?? []) as VialOpt[]));

    // Pull most recent protocol per vial so we can autofill dose/freq/cycle
    void supabase.from("protocols")
      .select("vial_id, dose, dose_unit, frequency, duration_days, ongoing, time_of_day, fasted, created_at")
      .not("vial_id", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const map: Record<string, { dose: number | null; dose_unit: string; frequency: string; duration_days: number | null; ongoing: boolean; time_of_day: string; fasted: boolean }> = {};
        for (const p of (data ?? []) as any[]) {
          if (p.vial_id && !map[p.vial_id]) {
            map[p.vial_id] = {
              dose: p.dose, dose_unit: p.dose_unit, frequency: p.frequency,
              duration_days: p.duration_days, ongoing: p.ongoing,
              time_of_day: p.time_of_day ?? "AM", fasted: !!p.fasted,
            };
          }
        }
        setVialProtocols(map);
      });

    // Prefill from existing stack when editing
    if (editing && editing.rows.length) {
      const first = editing.rows[0];
      setName(editing.name);
      setRoute((ROUTES as readonly string[]).includes(first.route) ? (first.route as typeof ROUTES[number]) : "Subcutaneous");
      setOngoing(first.ongoing);
      setDuration(first.duration_days != null ? String(first.duration_days) : "");
      setNotes(first.notes ?? "");
      setRows(editing.rows.map((s) => {
        const r = emptyRow();
        if ((COMPOUNDS as readonly string[]).includes(s.compound)) r.compound = s.compound;
        else { r.compound = "Other"; r.customCompound = s.compound; }
        r.dose = String(s.dose);
        if ((UNITS as readonly string[]).includes(s.dose_unit)) r.dose_unit = s.dose_unit as typeof UNITS[number];
        r.vial_id = s.vial_id ?? "none";
        if ((FREQUENCIES as readonly string[]).includes(s.frequency)) {
          r.frequency = s.frequency as typeof FREQUENCIES[number];
        } else if (s.frequency.startsWith("Custom")) {
          r.frequency = "Custom";
          const match = s.frequency.match(/\(([^)]+)\)/);
          if (match) {
            r.customDays = match[1].split(",").map((d) => DAY_LABELS.indexOf(d.trim())).filter((i) => i >= 0);
          }
        }
        if ((TIMES as readonly string[]).includes(s.time_of_day)) r.time_of_day = s.time_of_day as typeof TIMES[number];
        r.fasted = !!s.fasted;
        return r;
      }));
      return;
    }

    const raw = sessionStorage.getItem("stack:prefill");
    if (raw) {
      sessionStorage.removeItem("stack:prefill");
      try {
        const p = JSON.parse(raw) as { compound?: string; dose?: number; dose_unit?: string; vial_id?: string };
        const r = emptyRow();
        if (p.compound) {
          if ((COMPOUNDS as readonly string[]).includes(p.compound)) r.compound = p.compound;
          else { r.compound = "Other"; r.customCompound = p.compound; }
        }
        if (p.dose != null) r.dose = String(p.dose);
        if (p.dose_unit && (UNITS as readonly string[]).includes(p.dose_unit)) {
          r.dose_unit = p.dose_unit as typeof UNITS[number];
        }
        if (p.vial_id) r.vial_id = p.vial_id;
        setRows([r]);
      } catch { /* ignore */ }
    }
  }, [open, editing]);

  function handleVialChange(i: number, vialId: string) {
    if (vialId === "none") { updateRow(i, { vial_id: "none" }); return; }
    const vial = vials.find((v) => v.id === vialId);
    const patch: Partial<CompoundRow> = { vial_id: vialId };
    if (vial) {
      if ((COMPOUNDS as readonly string[]).includes(vial.compound)) {
        patch.compound = vial.compound;
        patch.customCompound = "";
      } else {
        patch.compound = "Other";
        patch.customCompound = vial.compound;
      }
      // Prefer the dose stored directly on the vial (from My Vials calculator)
      if (vial.default_dose != null) patch.dose = String(vial.default_dose);
      if (vial.default_dose_unit && (UNITS as readonly string[]).includes(vial.default_dose_unit)) {
        patch.dose_unit = vial.default_dose_unit as typeof UNITS[number];
      }
    }
    const prior = vialProtocols[vialId];
    if (prior) {
      if (patch.dose == null && prior.dose != null) patch.dose = String(prior.dose);
      if (patch.dose_unit == null && prior.dose_unit && (UNITS as readonly string[]).includes(prior.dose_unit)) {
        patch.dose_unit = prior.dose_unit as typeof UNITS[number];
      }
      if (prior.frequency && (FREQUENCIES as readonly string[]).includes(prior.frequency)) {
        patch.frequency = prior.frequency as typeof FREQUENCIES[number];
      }
      if (prior.time_of_day && (TIMES as readonly string[]).includes(prior.time_of_day)) {
        patch.time_of_day = prior.time_of_day as typeof TIMES[number];
      }
      patch.fasted = !!prior.fasted;
      // Cycle is shared across the stack — only apply when the first vial is linked
      if (i === 0) {
        if (prior.ongoing) { setOngoing(true); setDuration(""); }
        else if (prior.duration_days != null) { setOngoing(false); setDuration(String(prior.duration_days)); }
      }
    }
    updateRow(i, patch);
  }


  function updateRow(i: number, patch: Partial<CompoundRow>) {
    setRows((prev) => prev.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, ...patch };
      // Auto-match a vial by compound name when none is linked
      if (patch.compound !== undefined && next.vial_id === "none" && next.compound && next.compound !== "Other") {
        const n = next.compound.toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = vials.find((v) => v.compound.toLowerCase().replace(/[^a-z0-9]/g, "") === n);
        if (match) next.vial_id = match.id;
      }
      return next;
    }));
  }
  function removeRow(i: number) {
    setRows((prev) => prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i));
  }
  function toggleRowDay(i: number, d: number) {
    setRows((prev) => prev.map((r, idx) => {
      if (idx !== i) return r;
      const has = r.customDays.includes(d);
      return { ...r, customDays: has ? r.customDays.filter((x) => x !== d) : [...r.customDays, d].sort() };
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { toast.error("Not signed in"); return; }

    const compoundsPayload = rows.map((r) => {
      let freqValue: string = r.frequency;
      if (r.frequency === "Custom") {
        freqValue = r.customDays.length
          ? `Custom (${r.customDays.map((d) => DAY_LABELS[d]).join(", ")})`
          : "Custom";
      }
      return {
        compound: (r.compound === "Other" ? r.customCompound : r.compound).trim(),
        dose: Number(r.dose),
        dose_unit: r.dose_unit,
        vial_id: r.vial_id === "none" ? null : r.vial_id,
        frequency: freqValue,
        time_of_day: r.time_of_day,
        fasted: r.fasted,
      };
    });

    const badCustom = rows.findIndex((r) => r.frequency === "Custom" && r.customDays.length === 0);
    if (badCustom !== -1) { toast.error(`Compound #${badCustom + 1}: pick at least one day for Custom`); return; }

    const parsed = schema.safeParse({
      name, compounds: compoundsPayload, route, ongoing,
      duration_days: ongoing ? null : (duration ? Number(duration) : null), notes,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!ongoing && !parsed.data.duration_days) { toast.error("Enter cycle length or mark ongoing"); return; }

    const inserts = parsed.data.compounds.map((c) => ({
      name: parsed.data.name,
      compound: c.compound,
      dose: c.dose,
      dose_unit: c.dose_unit,
      frequency: c.frequency,
      time_of_day: c.time_of_day,
      fasted: c.fasted,
      route: parsed.data.route,
      ongoing: parsed.data.ongoing,
      duration_days: parsed.data.duration_days,
      notes: parsed.data.notes || null,
      doctor_id: userId,
      source: "manual",
      vial_id: c.vial_id,
    }));

    setSaving(true);
    if (editing) {
      const oldIds = editing.rows.map((r) => r.id);
      const { error: delErr } = await supabase.from("protocols").delete().in("id", oldIds);
      if (delErr) { setSaving(false); toast.error(delErr.message); return; }
    }
    const { error } = await supabase.from("protocols").insert(inserts);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Stack updated" : (inserts.length > 1 ? `Stack with ${inserts.length} compounds saved` : "Stack saved"));
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Plus className="h-5 w-5" style={{ color: BABY_BLUE }} />
            {editing ? "Edit Stack" : "Build a Stack"}
          </DialogTitle>
          <DialogDescription>
            Stack one or more compounds, link vials, and set the schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="pname">What are you researching?</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recovery & gut healing cycle" maxLength={120} required />
          </div>

          {/* ---- Compounds (multi) ---- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Compounds in this stack</Label>
              <Button type="button" size="sm" variant="outline"
                onClick={() => setRows((p) => [...p, emptyRow()])}
                className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add compound
              </Button>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Compound #{i + 1}</span>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Link vial <span className="text-muted-foreground">(optional — autofills compound &amp; dose)</span></Label>
                  <Select value={r.vial_id} onValueChange={(v) => handleVialChange(i, v)}>
                    <SelectTrigger><SelectValue placeholder="No vial linked" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No vial linked</SelectItem>
                      {vials.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.compound} · {v.vial_size_mg}mg ({v.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {r.vial_id === "none" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Peptide</Label>
                    <PeptideCombobox value={r.compound} onChange={(v) => updateRow(i, { compound: v })} />
                    {r.compound === "Other" && (
                      <Input value={r.customCompound}
                        onChange={(e) => updateRow(i, { customCompound: e.target.value })}
                        placeholder="Enter peptide name" />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Dose</Label>
                  <div className="flex gap-2">
                    <Input type="number" inputMode="decimal" step="any" min="0"
                      value={r.dose} onChange={(e) => updateRow(i, { dose: e.target.value })}
                      required className="flex-1 font-mono" />
                    <div className="inline-flex rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      {UNITS.map((u) => (
                        <button key={u} type="button" onClick={() => updateRow(i, { dose_unit: u })}
                          className="px-2.5 text-xs font-mono transition-colors"
                          style={{
                            backgroundColor: r.dose_unit === u ? "var(--primary)" : "transparent",
                            color: r.dose_unit === u ? "var(--primary-foreground, #fff)" : "var(--muted-foreground)",
                          }}>{u}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">How often?</Label>
                    <Select value={r.frequency} onValueChange={(v) => updateRow(i, { frequency: v as typeof FREQUENCIES[number] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {r.frequency === "Custom" && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {DAY_LABELS.map((d, idx) => {
                          const on = r.customDays.includes(idx);
                          return (
                            <button key={d} type="button" onClick={() => toggleRowDay(i, idx)}
                              className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                              style={{
                                backgroundColor: on ? BABY_BLUE : "transparent",
                                color: on ? NAVY : "var(--foreground)",
                                borderColor: on ? BABY_BLUE : "var(--border)",
                              }}>
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Time of day</Label>
                    <div className="inline-flex w-full rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      {TIMES.map((t) => (
                        <button key={t} type="button" onClick={() => updateRow(i, { time_of_day: t })}
                          className="flex-1 px-2.5 py-2 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: r.time_of_day === t ? BABY_BLUE : "transparent",
                            color: r.time_of_day === t ? NAVY : "var(--muted-foreground)",
                          }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={r.fasted} onCheckedChange={(v) => updateRow(i, { fasted: !!v })} />
                  <span>Take fasted</span>
                </label>

              </div>
            ))}
          </div>

          {/* ---- Shared schedule ---- */}
          <div className="space-y-2">
            <Label>How are you taking it?</Label>
            <Select value={route} onValueChange={(v) => setRoute(v as typeof ROUTES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration">How long is this cycle? (days)</Label>
              <button type="button" onClick={() => setOngoing((v) => !v)}
                className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                style={{
                  backgroundColor: ongoing ? "var(--primary)" : "var(--panel)",
                  color: ongoing ? "#fff" : "var(--foreground)",
                }}>
                {ongoing ? "Ongoing ✓" : "Mark as Ongoing"}
              </button>
            </div>
            <Input id="duration" type="number" min="1" max="3650" value={duration}
              onChange={(e) => setDuration(e.target.value)} disabled={ongoing}
              placeholder={ongoing ? "Ongoing — no fixed end" : "e.g. 30"}
              className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes or goals for this cycle <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000}
              placeholder="What you're hoping to learn, stacking notes, titration plan…" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}
              className="hover:opacity-90"
              style={{ backgroundColor: BABY_BLUE, color: NAVY }}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Save Stack"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================== Import from AI ============================== */

type Parsed = {
  compound: string | null;
  dose: number | null;
  dose_unit: string | null;
  frequency: string | null;
  route: string | null;
  duration_days: number | null;
  ongoing: boolean;
  notes: string | null;
};

type VialLite = { id: string; compound: string };

function normalizeCompound(c: string) {
  return c.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function generateStackName(text: string, list: Parsed[]) {
  const lower = text.toLowerCase();
  const goalMap: [RegExp, string][] = [
    [/gut|leaky|bpc[- ]?157|repair/, "Gut Repair"],
    [/recovery|healing|injury|tendon|tb[- ]?500/, "Recovery"],
    [/anxiety|mood|stress|calm|selank/, "Calm"],
    [/sleep|insomnia|dsip/, "Sleep"],
    [/fat loss|weight|glp|tirzep|semaglu|reta/, "Fat Loss"],
    [/cognitive|focus|nootropic|semax/, "Cognitive"],
    [/growth|\bgh\b|ghrp|cjc|ipamor|hexarelin|tesamor/, "Growth"],
    [/energy|mitochon|mots/, "Energy"],
    [/longevity|epital|nad|ss[- ]?31/, "Longevity"],
    [/libido|pt[- ]?141/, "Libido"],
    [/skin|hair|ghk/, "Skin & Hair"],
  ];
  const goals: string[] = [];
  for (const [re, label] of goalMap) {
    if (re.test(lower) && !goals.includes(label)) goals.push(label);
  }
  if (goals.length === 0) {
    const first = list.find((p) => p.compound)?.compound;
    return first ? `${first} Stack` : "My Stack";
  }
  if (goals.length === 1) return `${goals[0]} Stack`;
  if (goals.length === 2) return `${goals[0]} & ${goals[1]} Stack`;
  return `${goals.slice(0, -1).join(", ")} & ${goals[goals.length - 1]} Stack`;
}

function ImportFromAIModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedList, setParsedList] = useState<Parsed[] | null>(null);
  const [stackName, setStackName] = useState("");
  const [userVials, setUserVials] = useState<VialLite[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadVials() {
    const { data } = await supabase
      .from("vials")
      .select("id, compound")
      .neq("status", "used");
    setUserVials((data ?? []) as VialLite[]);
  }

  useEffect(() => {
    if (!open) {
      setText(""); setParsedList(null); setAgreed(false);
      setParsing(false); setSaving(false); setStackName("");
      return;
    }
    void loadVials();
  }, [open]);

  function matchVial(compound: string | null): string | null {
    if (!compound) return null;
    const n = normalizeCompound(compound);
    return userVials.find((v) => normalizeCompound(v.compound) === n)?.id ?? null;
  }

  async function handleParse() {
    if (text.trim().length < 5) { toast.error("Paste a protocol first"); return; }
    setParsing(true);
    const { data, error } = await supabase.functions.invoke("parse-protocol", {
      body: { text: text.trim() },
    });
    setParsing(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Could not parse protocol");
      return;
    }
    const list = ((data as any).protocols as Parsed[]) ?? [];
    if (list.length === 0) {
      toast.error("No compounds detected — try rewording");
      return;
    }
    const items = list.map((p) => ({ ...p }));
    setParsedList(items);
    setStackName(generateStackName(text, items));
  }

  function updateOne(i: number, patch: Partial<Parsed>) {
    setParsedList((prev) => prev ? prev.map((p, idx) => idx === i ? { ...p, ...patch } : p) : prev);
  }

  async function handleSave() {
    if (!user) { toast.error("Not signed in"); return; }
    if (!parsedList) return;
    if (!agreed) { toast.error("Please acknowledge the disclaimer"); return; }
    const finalName = stackName.trim() || "My Stack";

    const rows = parsedList.map((p) => {
      const compound = (COMPOUNDS as readonly string[]).includes(p.compound ?? "")
        ? (p.compound as string) : (p.compound ?? "Other");
      const dose_unit = (UNITS as readonly string[]).includes(p.dose_unit ?? "")
        ? (p.dose_unit as string) : "mcg";
      const frequency = (FREQUENCIES as readonly string[]).includes(p.frequency ?? "")
        ? (p.frequency as string) : "Once Daily";
      const route = (ROUTES as readonly string[]).includes(p.route ?? "")
        ? (p.route as string) : "Subcutaneous";
      return {
        name: finalName,
        compound,
        dose: p.dose ?? 0,
        dose_unit,
        frequency,
        route,
        ongoing: p.ongoing || !p.duration_days,
        duration_days: p.ongoing ? null : p.duration_days,
        notes: p.notes,
        doctor_id: user.id,
        source: "ai_import",
        vial_id: matchVial(p.compound),
      };
    });

    const bad = rows.findIndex((r) => !r.dose || r.dose <= 0);
    if (bad !== -1) { toast.error(`Compound #${bad + 1}: dose is required`); return; }

    setSaving(true);
    const { error } = await supabase.from("protocols").insert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }

    const unmatched = rows.filter((r) => !r.vial_id).length;
    toast.success(`Your stack has been imported — ${finalName}`);
    if (unmatched > 0) {
      setTimeout(() => {
        toast(`${unmatched} of your compounds don't have vials yet. Add them now?`, {
          duration: 10000,
          action: {
            label: "Add Vials",
            onClick: () => navigate({ to: "/dashboard/my-vials" }),
          },
          cancel: { label: "Later", onClick: () => {} },
        });
      }, 400);
    }
    onSaved();
  }

  const total = parsedList?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="font-display text-xl flex items-center gap-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: LAVENDER }} />
            Import Your AI Protocol
          </DialogTitle>
          <DialogDescription
            style={{ color: `color-mix(in oklab, ${LAVENDER} 70%, var(--muted-foreground))` }}
          >
            Got a protocol from Claude, ChatGPT, or Gemini? Paste it below and Sayne will organize it automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              maxLength={8000}
              placeholder="e.g. BPC-157 250mcg subcutaneous once daily for 12 weeks, reconstituted in 2mL BAC water. Stack with TB-500 500mcg twice weekly..."
              className="font-mono text-sm"
              style={{
                backgroundColor: `color-mix(in oklab, ${LAVENDER} 14%, transparent)`,
                borderColor: `color-mix(in oklab, ${LAVENDER} 40%, transparent)`,
              }}
            />
          </div>

          <Button
            onClick={handleParse}
            disabled={parsing}
            className="w-full hover:opacity-90"
            style={{ backgroundColor: LAVENDER, color: NAVY }}
          >
            <Sparkles className="h-4 w-4" />
            {parsing ? "Parsing…" : "Parse My Protocol"}
          </Button>

          {parsedList && total > 0 && (
            <div className="space-y-4">
              <div
                className="sayne-card p-4 space-y-2"
                style={{
                  backgroundColor: `color-mix(in oklab, ${LAVENDER} 10%, transparent)`,
                  borderColor: `color-mix(in oklab, ${LAVENDER} 40%, transparent)`,
                }}
              >
                <Label htmlFor="stack-name" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Stack name
                </Label>
                <Input
                  id="stack-name"
                  value={stackName}
                  onChange={(e) => setStackName(e.target.value)}
                  maxLength={120}
                  className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none h-auto py-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: NAVY }}
                />
              </div>

              <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                {total} compound{total === 1 ? "" : "s"} in this stack
              </div>

              {parsedList.map((p, i) => (
                <ParsedCompoundCard
                  key={i}
                  index={i}
                  p={p}
                  matchedVialId={matchVial(p.compound)}
                  userId={user?.id ?? null}
                  onUpdate={(patch) => updateOne(i, patch)}
                  onVialAdded={loadVials}
                />
              ))}
            </div>
          )}

          {parsedList && total > 0 && (
            <>
              <p
                className="text-xs italic"
                style={{ color: `color-mix(in oklab, ${LAVENDER} 70%, var(--muted-foreground))` }}
              >
                This protocol was created by an external AI tool and imported by you for personal research tracking. Sayne organizes and tracks your stack — it does not provide medical advice. Always do your own research and consult a qualified professional before beginning any protocol.
              </p>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <span className="text-xs text-muted-foreground">
                  I understand this is for research tracking purposes only.
                </span>
              </label>

              <Button
                onClick={handleSave}
                disabled={!agreed || saving}
                className="w-full hover:opacity-90"
                style={{ backgroundColor: MINT, color: NAVY }}
              >
                <Check className="h-4 w-4" />
                {saving ? "Saving…" : "Save to My Stacks"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParsedCompoundCard({
  index, p, onUpdate, matchedVialId, userId, onVialAdded,
}: {
  index: number; p: Parsed; onUpdate: (patch: Partial<Parsed>) => void;
  matchedVialId: string | null; userId: string | null; onVialAdded: () => Promise<void> | void;
}) {
  const [addingVial, setAddingVial] = useState(false);
  const [vialSize, setVialSize] = useState("");
  const [savingVial, setSavingVial] = useState(false);

  async function quickAddVial() {
    if (!userId || !p.compound) return;
    if (!vialSize || Number(vialSize) <= 0) { toast.error("Enter vial size in mg"); return; }
    setSavingVial(true);
    const { error } = await supabase.from("vials").insert({
      doctor_id: userId,
      compound: p.compound,
      vial_size_mg: Number(vialSize),
      status: "sealed",
    });
    setSavingVial(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${p.compound} vial added`);
    setAddingVial(false);
    setVialSize("");
    await onVialAdded();
  }
  const fields = [
    p.compound,
    p.dose,
    p.frequency,
    p.route,
    p.ongoing ? "ongoing" : p.duration_days,
    p.notes,
  ];
  const detected = fields.filter((v) => v !== null && v !== undefined && v !== "").length;
  const pct = Math.round((detected / 6) * 100);

  return (
    <div className="sayne-card p-5 space-y-4">
      <div className="flex items-baseline justify-between">
        <h4
          className="text-xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: p.compound ? NAVY : "var(--muted-foreground)" }}
        >
          {p.compound ?? `Compound #${index + 1}`}
        </h4>
        <span className="text-xs font-mono tabular-nums" style={{ color: MINT }}>
          {pct}%
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Detected {detected} of 6 fields
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--panel)" }}>
          <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: MINT }} />
        </div>
      </div>

      {p.compound && (
        matchedVialId ? (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in oklab, ${MINT} 28%, transparent)`,
              color: NAVY,
              border: `1px solid color-mix(in oklab, ${MINT} 50%, transparent)`,
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Linked to your {p.compound} vial
          </div>
        ) : (
          <div
            className="rounded-md px-3 py-2 text-xs"
            style={{
              backgroundColor: "color-mix(in oklab, #FBE7A1 35%, transparent)",
              border: "1px solid color-mix(in oklab, #E8C76A 45%, transparent)",
              color: "#6b5413",
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium">No {p.compound} vial yet</span>
              {!addingVial && (
                <button
                  type="button"
                  onClick={() => setAddingVial(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold hover:opacity-90"
                  style={{ backgroundColor: NAVY, color: "#fff" }}
                >
                  <Plus className="h-3 w-3" /> Add vial
                </button>
              )}
            </div>
            {addingVial && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Input
                  type="number" step="any" min="0"
                  placeholder="Vial size (mg)"
                  value={vialSize}
                  onChange={(e) => setVialSize(e.target.value)}
                  className="h-8 font-mono text-xs flex-1 min-w-[120px] bg-white"
                />
                <Button
                  type="button" size="sm" onClick={quickAddVial} disabled={savingVial}
                  className="h-8 text-xs" style={{ backgroundColor: MINT, color: NAVY }}
                >
                  {savingVial ? "Saving…" : "Save vial"}
                </Button>
                <Button
                  type="button" size="sm" variant="ghost" onClick={() => { setAddingVial(false); setVialSize(""); }}
                  className="h-8 text-xs"
                >
                  Skip
                </Button>
              </div>
            )}
          </div>
        )
      )}

      <ParsedRow label="Compound" value={p.compound}>
        <Select value={p.compound ?? ""} onValueChange={(v) => onUpdate({ compound: v })}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Pick a compound" /></SelectTrigger>
          <SelectContent>
            {COMPOUNDS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </ParsedRow>

      <ParsedRow label="Dose" value={p.dose != null ? `${p.dose} ${p.dose_unit ?? ""}` : null}>
        <div className="flex gap-2">
          <Input
            type="number" step="any" min="0"
            value={p.dose ?? ""}
            onChange={(e) => onUpdate({ dose: e.target.value ? Number(e.target.value) : null })}
            className="h-8 font-mono"
            placeholder="Dose"
          />
          <Select value={p.dose_unit ?? "mcg"} onValueChange={(v) => onUpdate({ dose_unit: v })}>
            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </ParsedRow>

      <ParsedRow label="Frequency" value={p.frequency}>
        <Select value={p.frequency ?? ""} onValueChange={(v) => onUpdate({ frequency: v })}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Pick a frequency" /></SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </ParsedRow>

      <ParsedRow label="Route" value={p.route}>
        <Select value={p.route ?? ""} onValueChange={(v) => onUpdate({ route: v })}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Pick a route" /></SelectTrigger>
          <SelectContent>
            {ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </ParsedRow>

      <ParsedRow
        label="Duration"
        value={p.ongoing ? "Ongoing" : p.duration_days ? `${p.duration_days} days` : null}
      >
        <div className="flex gap-2 items-center">
          <Input
            type="number" min="1" max="3650"
            value={p.duration_days ?? ""}
            onChange={(e) => onUpdate({ duration_days: e.target.value ? Number(e.target.value) : null })}
            disabled={p.ongoing}
            className="h-8 font-mono flex-1"
            placeholder="Days"
          />
          <button
            type="button"
            onClick={() => onUpdate({ ongoing: !p.ongoing })}
            className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: p.ongoing ? "var(--primary)" : "var(--panel)",
              color: p.ongoing ? "#fff" : "var(--foreground)",
            }}
          >
            {p.ongoing ? "Ongoing ✓" : "Mark ongoing"}
          </button>
        </div>
      </ParsedRow>

      <ParsedRow label="Notes" value={p.notes}>
        <Textarea
          value={p.notes ?? ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={2}
          maxLength={2000}
          placeholder="Special instructions"
          className="text-sm"
        />
      </ParsedRow>
    </div>
  );
}

function ParsedRow({
  label, value, children,
}: { label: string; value: string | number | null; children: React.ReactNode }) {
  const detected = value !== null && value !== undefined && value !== "";
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
      <div className="text-xs uppercase tracking-wider text-muted-foreground pt-1.5">{label}</div>
      <div className="min-w-0">
        {detected ? (
          <div
            className="text-sm font-medium"
            style={{
              color: NAVY,
              fontFamily: label === "Compound"
                ? "'Space Grotesk', sans-serif"
                : label === "Dose"
                ? "'JetBrains Mono', monospace"
                : undefined,
            }}
          >
            {String(value)}
          </div>
        ) : (
          <div className="space-y-1.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: PINK, color: "#7a2d3d" }}
            >
              Not found
            </span>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function ResearchLog({ stacks, loading }: { stacks: Stack[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const withNotes = stacks.filter((s) => s.notes && s.notes.trim().length > 0);
  if (stacks.length === 0) {
    return (
      <div className="sayne-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No stacks yet — add notes to a stack to start a research log.</p>
      </div>
    );
  }
  if (withNotes.length === 0) {
    return (
      <div className="sayne-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No journal entries yet. Add notes when building or editing a stack.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {withNotes.map((s) => (
        <div key={s.id} className="sayne-card p-5">
          <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
            <h3 className="font-display text-base font-semibold">{s.compound}</h3>
            <span className="text-[11px] text-muted-foreground font-mono">{format(new Date(s.created_at), "MMM d, yyyy")}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap text-foreground/90">{s.notes}</p>
        </div>
      ))}
    </div>
  );
}
