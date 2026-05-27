import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/protocols")({ component: Page });

const COMPOUNDS = ["BPC-157", "TB-500", "Ipamorelin", "CJC-1295", "Selank", "Semax", "PT-141", "Other"] as const;
const FREQUENCIES = ["Once Daily", "Twice Daily", "Every Other Day", "Weekly", "Custom"] as const;
const ROUTES = ["Subcutaneous", "Intranasal", "Oral", "Topical"] as const;
const UNITS = ["mcg", "mg", "IU"] as const;

type Protocol = {
  id: string;
  name: string;
  compound: string;
  dose: number;
  dose_unit: string;
  frequency: string;
  route: string;
  duration_days: number | null;
  ongoing: boolean;
  notes: string | null;
  created_at: string;
};

const schema = z.object({
  name: z.string().trim().min(1, "Protocol name is required").max(120),
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
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [compound, setCompound] = useState<typeof COMPOUNDS[number]>("BPC-157");
  const [dose, setDose] = useState("");
  const [doseUnit, setDoseUnit] = useState<typeof UNITS[number]>("mcg");
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>("Once Daily");
  const [route, setRoute] = useState<typeof ROUTES[number]>("Subcutaneous");
  const [ongoing, setOngoing] = useState(false);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("protocols")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setProtocols((data ?? []) as Protocol[]);
  }

  useEffect(() => { void load(); }, []);

  function resetForm() {
    setName(""); setCompound("BPC-157"); setDose(""); setDoseUnit("mcg");
    setFrequency("Once Daily"); setRoute("Subcutaneous"); setOngoing(false);
    setDuration(""); setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Not signed in"); return; }
    const parsed = schema.safeParse({
      name, compound, dose: Number(dose), dose_unit: doseUnit,
      frequency, route, ongoing,
      duration_days: ongoing ? null : (duration ? Number(duration) : null),
      notes,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!ongoing && !parsed.data.duration_days) { toast.error("Enter duration or mark as ongoing"); return; }

    setSaving(true);
    const { error } = await supabase.from("protocols").insert({
      ...parsed.data,
      notes: parsed.data.notes || null,
      doctor_id: user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Protocol saved");
    resetForm();
    void load();
  }

  return (
    <>
      <PageHeader title="Protocols" subtitle="Design and assign peptide protocols for your patients." />

      <div className="sayne-card p-6 md:p-8 mb-8">
        <h2 className="font-display text-lg font-semibold mb-1">Create Protocol</h2>
        <p className="text-sm text-muted-foreground mb-6">Define the compound, dosing, and route before sending to a patient.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pname">Protocol Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BPC-157 Recovery Cycle" maxLength={120} required />
          </div>

          <div className="space-y-2">
            <Label>Compound</Label>
            <Select value={compound} onValueChange={(v) => setCompound(v as typeof COMPOUNDS[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPOUNDS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dose">Dose</Label>
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
                    }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof FREQUENCIES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Route of Administration</Label>
            <Select value={route} onValueChange={(v) => setRoute(v as typeof ROUTES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration">Duration (days)</Label>
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
            <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000}
              placeholder="Cycle context, contraindications, titration plan…" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving} style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
              {saving ? "Saving…" : "Save Protocol"}
            </Button>
          </div>
        </form>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">Saved Protocols</h2>
        <span className="text-xs text-muted-foreground font-mono">{protocols.length} total</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : protocols.length === 0 ? (
        <div className="sayne-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No protocols yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {protocols.map((p) => <ProtocolCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}

function ProtocolCard({ p }: { p: Protocol }) {
  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 truncate">{p.name}</div>
          <h3 className="font-display text-xl font-semibold leading-tight truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {p.compound}
          </h3>
        </div>
        <button type="button" aria-label="Edit protocol"
          className="p-1.5 rounded-md hover:bg-[var(--panel)] text-muted-foreground transition-colors">
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-baseline gap-1.5 font-mono">
        <span className="text-2xl font-semibold tabular-nums">{p.dose}</span>
        <span className="text-sm text-muted-foreground">{p.dose_unit}</span>
        <span className="text-sm text-muted-foreground mx-1">·</span>
        <span className="text-sm">{p.frequency}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: "var(--panel)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
          {p.route}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono"
          style={{ backgroundColor: "color-mix(in oklab, var(--secondary) 35%, transparent)", color: "var(--foreground)" }}>
          {p.ongoing ? "Ongoing" : `${p.duration_days}d`}
        </span>
      </div>

      {p.notes && <p className="text-xs text-muted-foreground line-clamp-2">{p.notes}</p>}

      <button type="button"
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-md h-9 text-sm font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: "var(--primary)", color: "var(--foreground)" }}>
        <Send className="h-4 w-4" />
        Send to Patient
      </button>
    </div>
  );
}
