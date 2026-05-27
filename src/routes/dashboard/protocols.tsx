import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Send, Copy, Check, Mail, ClipboardPaste, Sparkles } from "lucide-react";
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/protocols")({ component: Page });

const COMPOUNDS = ["BPC-157", "TB-500", "Ipamorelin", "CJC-1295", "Selank", "Semax", "PT-141", "Other"] as const;
const FREQUENCIES = ["Once Daily", "Twice Daily", "Every Other Day", "Weekly", "Custom"] as const;
const ROUTES = ["Subcutaneous", "Intranasal", "Oral", "Topical"] as const;
const UNITS = ["mcg", "mg", "IU"] as const;
const EXPIRY_OPTIONS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "never", label: "Never" },
] as const;

const LAVENDER = "#C9A8F5";
const MINT = "#98E4B2";
const PINK = "#F8C8D0";

type Protocol = {
  id: string; name: string; compound: string; dose: number; dose_unit: string;
  frequency: string; route: string; duration_days: number | null;
  ongoing: boolean; notes: string | null; created_at: string; source?: string | null;
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
  const [sendTarget, setSendTarget] = useState<Protocol | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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
      .from("protocols").select("*").order("created_at", { ascending: false });
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
      ...parsed.data, notes: parsed.data.notes || null, doctor_id: user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Protocol saved");
    resetForm();
    void load();
  }

  return (
    <>
      <PageHeader
        title="Protocols"
        subtitle="Design and assign peptide protocols for your patients."
        action={
          <Button
            onClick={() => setImportOpen(true)}
            className="gap-2 text-[#1a1a2e] hover:opacity-90"
            style={{ backgroundColor: LAVENDER }}
          >
            <ClipboardPaste className="h-4 w-4" />
            Import from AI
          </Button>
        }
      />

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
                    }}>{u}</button>
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
          {protocols.map((p) => (
            <ProtocolCard key={p.id} p={p} onSend={() => setSendTarget(p)} />
          ))}
        </div>
      )}

      <SendToPatientSheet
        protocol={sendTarget}
        onClose={() => setSendTarget(null)}
      />

      <ImportProtocolModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSaved={() => { setImportOpen(false); void load(); }}
      />
    </>
  );
}

function ProtocolCard({ p, onSend }: { p: Protocol; onSend: () => void }) {
  const isAi = p.source === "ai_import";
  return (
    <div className="sayne-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{p.name}</div>
            {isAi && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-[#1a1a2e]"
                style={{ backgroundColor: LAVENDER }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI Import
              </span>
            )}
          </div>
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

      <button type="button" onClick={onSend}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-md h-9 text-sm font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: "var(--primary)", color: "var(--foreground)" }}>
        <Send className="h-4 w-4" />
        Send to Patient
      </button>
    </div>
  );
}

function SendToPatientSheet({ protocol, onClose }: { protocol: Protocol | null; onClose: () => void }) {
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [expiry, setExpiry] = useState<"7d" | "30d" | "never">("30d");
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (protocol) {
      setPName(""); setPEmail(""); setExpiry("30d");
      setLink(null); setCopied(false);
    }
  }, [protocol?.id]);

  async function generate() {
    if (!protocol) return;
    if (!pName.trim()) { toast.error("Patient name is required"); return; }
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("create-magic-link", {
      body: {
        protocol_id: protocol.id,
        patient_name: pName.trim(),
        patient_email: pEmail.trim() || null,
        expiry,
      },
    });
    setGenerating(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Failed to generate link");
      return;
    }
    setLink((data as any).url as string);
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Sheet open={!!protocol} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto" style={{ backgroundColor: "var(--background)" }}>
        <div className="p-6">
          <SheetHeader className="text-left mb-1">
            <SheetTitle className="font-display text-xl">Send to Patient</SheetTitle>
            <SheetDescription>
              Create a secure magic link for{" "}
              <span className="font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {protocol?.compound}
              </span>
              .
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {!link ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pn">Patient Name</Label>
                <Input id="pn" value={pName} onChange={(e) => setPName(e.target.value)}
                  placeholder="Jane Doe" maxLength={200} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pe">Patient Email <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="pe" type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)}
                  placeholder="patient@example.com" maxLength={320} />
              </div>

              <div className="space-y-2">
                <Label>Link Expiry</Label>
                <Select value={expiry} onValueChange={(v) => setExpiry(v as typeof expiry)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generate} disabled={generating} className="w-full"
                style={{ backgroundColor: "var(--primary)", color: "var(--foreground)" }}>
                {generating ? "Generating…" : "Generate Link"}
              </Button>
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-2">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500"
                  style={{ backgroundColor: "color-mix(in oklab, var(--success, #98E4B2) 60%, transparent)" }}
                >
                  <Check className="h-7 w-7" style={{ color: "var(--foreground)" }} />
                </div>
                <p className="mt-3 text-sm font-medium">Magic link ready</p>
                <p className="text-xs text-muted-foreground">Share it with {pName}.</p>
              </div>

              <div className="sayne-card p-3 flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {link}
                </code>
                <button type="button" onClick={copy} aria-label="Copy link"
                  className="p-2 rounded-md hover:bg-[var(--panel)] transition-colors shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <Button variant="outline" className="w-full" onClick={() => toast("Email sending coming soon")}>
                <Mail className="h-4 w-4" />
                Send via Email
              </Button>

              <button type="button" onClick={() => setLink(null)}
                className="block mx-auto text-xs text-muted-foreground hover:text-foreground">
                Generate another link
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

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

const EMPTY_PARSED: Parsed = {
  compound: null, dose: null, dose_unit: null, frequency: null,
  route: null, duration_days: null, ongoing: false, notes: null,
};

function ImportProtocolModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setText(""); setParsed(null); setName(""); setAgreed(false);
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
    const p = (data as any).parsed as Parsed;
    setParsed({ ...EMPTY_PARSED, ...p });
    if (!name && p.compound) setName(`${p.compound} Imported Protocol`);
  }

  function updateField<K extends keyof Parsed>(key: K, value: Parsed[K]) {
    setParsed((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const detectedCount = parsed
    ? ([
        parsed.compound,
        parsed.dose,
        parsed.frequency,
        parsed.route,
        parsed.ongoing ? "ongoing" : parsed.duration_days,
        parsed.notes,
      ].filter((v) => v !== null && v !== undefined && v !== "").length)
    : 0;

  async function handleSave() {
    if (!user) { toast.error("Not signed in"); return; }
    if (!parsed) return;
    if (!agreed) { toast.error("Please acknowledge the disclaimer"); return; }

    const compound = (COMPOUNDS as readonly string[]).includes(parsed.compound ?? "")
      ? (parsed.compound as string) : "Other";
    const dose_unit = (UNITS as readonly string[]).includes(parsed.dose_unit ?? "")
      ? (parsed.dose_unit as string) : "mcg";
    const frequency = (FREQUENCIES as readonly string[]).includes(parsed.frequency ?? "")
      ? (parsed.frequency as string) : "Once Daily";
    const route = (ROUTES as readonly string[]).includes(parsed.route ?? "")
      ? (parsed.route as string) : "Subcutaneous";

    if (!parsed.dose || parsed.dose <= 0) { toast.error("Dose is required"); return; }

    const payload = {
      name: name.trim() || `${compound} Protocol`,
      compound,
      dose: parsed.dose,
      dose_unit,
      frequency,
      route,
      ongoing: parsed.ongoing || !parsed.duration_days,
      duration_days: parsed.ongoing ? null : parsed.duration_days,
      notes: parsed.notes,
      doctor_id: user.id,
      source: "ai_import",
    };

    setSaving(true);
    const { error } = await supabase.from("protocols").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Protocol imported successfully");
    onSaved();
  }


  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: LAVENDER }} />
            Import Protocol from AI
          </DialogTitle>
          <DialogDescription>
            Paste a protocol generated by ChatGPT, Claude, Gemini, or any other AI tool and Sayne will parse it into a tracked protocol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label>Paste your AI-generated protocol here</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={8000}
              placeholder="e.g. BPC-157 250mcg subcutaneous once daily for 12 weeks, reconstituted in 2mL bacteriostatic water..."
              className="font-mono text-sm"
              style={{ backgroundColor: `color-mix(in oklab, ${LAVENDER} 14%, transparent)`, borderColor: `color-mix(in oklab, ${LAVENDER} 40%, transparent)` }}
            />
          </div>

          <Button
            onClick={handleParse}
            disabled={parsing}
            className="w-full text-[#1a1a2e] hover:opacity-90"
            style={{ backgroundColor: LAVENDER }}
          >
            <Sparkles className="h-4 w-4" />
            {parsing ? "Parsing…" : "Parse Protocol"}
          </Button>

          {parsed && (
            <div className="sayne-card p-5 space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Sayne detected {detectedCount} of 6 fields
                  </span>
                  <span className="text-xs font-mono tabular-nums" style={{ color: MINT }}>
                    {Math.round((detectedCount / 6) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--panel)" }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${(detectedCount / 6) * 100}%`, backgroundColor: MINT }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Protocol Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this protocol"
                  maxLength={120}
                />
              </div>

              <ParsedRow label="Compound" value={parsed.compound}>
                <Select
                  value={parsed.compound ?? ""}
                  onValueChange={(v) => updateField("compound", v)}
                >
                  <SelectTrigger className="h-8"><SelectValue placeholder="Pick a compound" /></SelectTrigger>
                  <SelectContent>
                    {COMPOUNDS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </ParsedRow>

              <ParsedRow label="Dose" value={parsed.dose != null ? `${parsed.dose} ${parsed.dose_unit ?? ""}` : null}>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={parsed.dose ?? ""}
                    onChange={(e) => updateField("dose", e.target.value ? Number(e.target.value) : null)}
                    className="h-8 font-mono"
                    placeholder="Dose"
                  />
                  <Select
                    value={parsed.dose_unit ?? "mcg"}
                    onValueChange={(v) => updateField("dose_unit", v)}
                  >
                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </ParsedRow>

              <ParsedRow label="Frequency" value={parsed.frequency}>
                <Select
                  value={parsed.frequency ?? ""}
                  onValueChange={(v) => updateField("frequency", v)}
                >
                  <SelectTrigger className="h-8"><SelectValue placeholder="Pick a frequency" /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </ParsedRow>

              <ParsedRow label="Route" value={parsed.route}>
                <Select
                  value={parsed.route ?? ""}
                  onValueChange={(v) => updateField("route", v)}
                >
                  <SelectTrigger className="h-8"><SelectValue placeholder="Pick a route" /></SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </ParsedRow>

              <ParsedRow
                label="Duration"
                value={parsed.ongoing ? "Ongoing" : parsed.duration_days ? `${parsed.duration_days} days` : null}
              >
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="1"
                    max="3650"
                    value={parsed.duration_days ?? ""}
                    onChange={(e) => updateField("duration_days", e.target.value ? Number(e.target.value) : null)}
                    disabled={parsed.ongoing}
                    className="h-8 font-mono flex-1"
                    placeholder="Days"
                  />
                  <button
                    type="button"
                    onClick={() => updateField("ongoing", !parsed.ongoing)}
                    className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: parsed.ongoing ? "var(--primary)" : "var(--panel)",
                      color: parsed.ongoing ? "#fff" : "var(--foreground)",
                    }}
                  >
                    {parsed.ongoing ? "Ongoing ✓" : "Mark ongoing"}
                  </button>
                </div>
              </ParsedRow>

              <ParsedRow label="Notes" value={parsed.notes}>
                <Textarea
                  value={parsed.notes ?? ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Special instructions"
                  className="text-sm"
                />
              </ParsedRow>
            </div>
          )}

          {parsed && (
            <>
              <p
                className="text-xs italic"
                style={{ color: `color-mix(in oklab, ${LAVENDER} 70%, var(--muted-foreground))` }}
              >
                This protocol was generated by an external AI tool and imported by you for tracking purposes. Sayne does not provide medical advice. Always consult your physician before beginning any protocol.
              </p>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <span className="text-xs text-muted-foreground">
                  I understand this protocol was AI-generated and acknowledge the disclaimer above.
                </span>
              </label>

              <Button
                onClick={handleSave}
                disabled={!agreed || saving}
                className="w-full text-[#1a1a2e] hover:opacity-90"
                style={{ backgroundColor: MINT }}
              >
                <Check className="h-4 w-4" />
                {saving ? "Saving…" : "Save to My Protocols"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
            style={{ color: "var(--foreground)", fontFamily: label === "Compound" ? "'Space Grotesk', sans-serif" : undefined }}
          >
            {String(value)}
          </div>
        ) : (
          <div className="space-y-1.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: PINK, color: "#7a2d3d" }}
            >
              Not detected
            </span>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

