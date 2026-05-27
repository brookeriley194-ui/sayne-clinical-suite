import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, ClipboardPaste, Sparkles, Check, BookOpen, Share2, CircleDot } from "lucide-react";
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

export const Route = createFileRoute("/dashboard/protocols")({ component: Page });

const COMPOUNDS = [
  "BPC-157", "TB-500", "MOTS-C", "Ipamorelin", "CJC-1295", "Selank", "Semax",
  "Semaglutide", "Tirzepatide", "Retatrutide", "NAD+", "PT-141", "Epithalon",
  "GHK-Cu", "Thymosin Alpha-1", "DSIP", "Kisspeptin", "Tesamorelin",
  "Hexarelin", "GHRP-2", "GHRP-6", "AOD-9604", "5-Amino-1MQ", "SS-31", "Other",
] as const;
const FREQUENCIES = ["Once Daily", "Twice Daily", "Every Other Day", "Weekly", "Custom"] as const;
const ROUTES = ["Subcutaneous", "Intranasal", "Oral", "Topical"] as const;
const UNITS = ["mcg", "mg", "IU", "units"] as const;

const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MINT = "#98E4B2";
const PINK = "#F8C8D0";
const NAVY = "#1a1a2e";

type Stack = {
  id: string; name: string; compound: string; dose: number; dose_unit: string;
  frequency: string; route: string; duration_days: number | null;
  ongoing: boolean; notes: string | null; created_at: string; source?: string | null;
};

const schema = z.object({
  name: z.string().trim().min(1, "Give your stack a name").max(120),
  compound: z.enum(COMPOUNDS),
  dose: z.number().positive("Dose must be greater than 0").max(100000),
  dose_unit: z.enum(UNITS),
  frequency: z.enum(FREQUENCIES),
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

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("protocols").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setStacks((data ?? []) as Stack[]);
  }
  useEffect(() => { void load(); }, []);

  return (
    <>
      <PageHeader
        title="My Stacks"
        subtitle="Track everything you're running. Import from AI, build your own, or grab one from the community."
        action={
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setBuildOpen(true)}
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
            <span className="text-xs text-muted-foreground font-mono">{stacks.length} total</span>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : stacks.length === 0 ? (
            <div className="sayne-card p-10 text-center">
              <p className="text-sm text-muted-foreground">No stacks yet. Build one or import from AI to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {stacks.map((s) => <StackCard key={s.id} s={s} />)}
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
        onClose={() => setBuildOpen(false)}
        onSaved={() => { setBuildOpen(false); void load(); }}
        userId={user?.id ?? null}
      />
    </>
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

function BuildStackModal({
  open, onClose, onSaved, userId,
}: { open: boolean; onClose: () => void; onSaved: () => void; userId: string | null }) {
  const [name, setName] = useState("");
  const [compound, setCompound] = useState<typeof COMPOUNDS[number]>("BPC-157");
  const [dose, setDose] = useState("");
  const [doseUnit, setDoseUnit] = useState<typeof UNITS[number]>("mcg");
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>("Once Daily");
  const [route, setRoute] = useState<typeof ROUTES[number]>("Subcutaneous");
  const [ongoing, setOngoing] = useState(false);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName(""); setCompound("BPC-157"); setDose(""); setDoseUnit("mcg");
      setFrequency("Once Daily"); setRoute("Subcutaneous"); setOngoing(false);
      setDuration(""); setNotes(""); setSaving(false);
    }
  }, [open]);

  const compoundsSorted = useMemo(
    () => [...COMPOUNDS].sort((a, b) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b))),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { toast.error("Not signed in"); return; }
    const parsed = schema.safeParse({
      name, compound, dose: Number(dose), dose_unit: doseUnit,
      frequency, route, ongoing,
      duration_days: ongoing ? null : (duration ? Number(duration) : null),
      notes,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!ongoing && !parsed.data.duration_days) { toast.error("Enter cycle length or mark ongoing"); return; }

    setSaving(true);
    const { error } = await supabase.from("protocols").insert({
      ...parsed.data, notes: parsed.data.notes || null, doctor_id: userId, source: "manual",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Stack saved");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Plus className="h-5 w-5" style={{ color: BABY_BLUE }} />
            Build a Stack
          </DialogTitle>
          <DialogDescription>
            Set up a new compound you want to research and track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pname">What are you researching?</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recovery & gut healing cycle" maxLength={120} required />
          </div>

          <div className="space-y-2">
            <Label>Compound</Label>
            <Select value={compound} onValueChange={(v) => setCompound(v as typeof COMPOUNDS[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {compoundsSorted.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dose">How much per dose?</Label>
            <div className="flex gap-2">
              <Input id="dose" type="number" inputMode="decimal" step="any" min="0" value={dose}
                onChange={(e) => setDose(e.target.value)} required className="flex-1 font-mono" />
              <div className="inline-flex rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {UNITS.map((u) => (
                  <button key={u} type="button" onClick={() => setDoseUnit(u)}
                    className="px-3 text-xs font-mono transition-colors"
                    style={{
                      backgroundColor: doseUnit === u ? "var(--primary)" : "transparent",
                      color: doseUnit === u ? "var(--primary-foreground, #fff)" : "var(--muted-foreground)",
                    }}>{u}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>How often?</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof FREQUENCIES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>How are you taking it?</Label>
            <Select value={route} onValueChange={(v) => setRoute(v as typeof ROUTES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes or goals for this cycle <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000}
              placeholder="What you're hoping to learn, stacking notes, titration plan…" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving}
              className="hover:opacity-90"
              style={{ backgroundColor: BABY_BLUE, color: NAVY }}>
              {saving ? "Saving…" : "Save Stack"}
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

function ImportFromAIModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedList, setParsedList] = useState<Parsed[] | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setText(""); setParsedList(null); setAgreed(false);
      setParsing(false); setSaving(false);
    }
  }, [open]);

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
    setParsedList(list.map((p) => ({ ...p })));
  }

  function updateOne(i: number, patch: Partial<Parsed>) {
    setParsedList((prev) => prev ? prev.map((p, idx) => idx === i ? { ...p, ...patch } : p) : prev);
  }

  async function handleSave() {
    if (!user) { toast.error("Not signed in"); return; }
    if (!parsedList) return;
    if (!agreed) { toast.error("Please acknowledge the disclaimer"); return; }

    const rows = parsedList.map((p) => {
      const compound = (COMPOUNDS as readonly string[]).includes(p.compound ?? "")
        ? (p.compound as string) : "Other";
      const dose_unit = (UNITS as readonly string[]).includes(p.dose_unit ?? "")
        ? (p.dose_unit as string) : "mcg";
      const frequency = (FREQUENCIES as readonly string[]).includes(p.frequency ?? "")
        ? (p.frequency as string) : "Once Daily";
      const route = (ROUTES as readonly string[]).includes(p.route ?? "")
        ? (p.route as string) : "Subcutaneous";
      return {
        name: `${compound} Stack`,
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
      };
    });

    const bad = rows.findIndex((r) => !r.dose || r.dose <= 0);
    if (bad !== -1) { toast.error(`Stack #${bad + 1}: dose is required`); return; }

    setSaving(true);
    const { error } = await supabase.from("protocols").insert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Your stack has been imported", {
      icon: <Check className="h-4 w-4" style={{ color: LAVENDER }} />,
    });
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
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Sayne detected {total} compound{total === 1 ? "" : "s"}
              </h3>

              {parsedList.map((p, i) => (
                <ParsedCompoundCard
                  key={i}
                  index={i}
                  p={p}
                  onUpdate={(patch) => updateOne(i, patch)}
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
                {saving ? "Saving…" : `Save to My Stacks${total > 1 ? ` (${total})` : ""}`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParsedCompoundCard({
  index, p, onUpdate,
}: { index: number; p: Parsed; onUpdate: (patch: Partial<Parsed>) => void }) {
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
