import { useEffect, useMemo, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { X, BookOpen, Download, Lock, Share2 } from "lucide-react";

export const J_COLORS = {
  energy: "#89CFF0",   // baby blue
  sleep: "#C9A8F5",    // lavender
  recovery: "#98E4B2", // mint green
  mood: "#FFD580",     // soft yellow
} as const;

export type JournalProtocol = {
  id: string;
  name: string;
  compound: string;
  created_at: string;
  ongoing: boolean;
  duration_days: number | null;
};

export type JournalEntry = {
  id: string;
  protocol_id: string;
  week_number: number;
  energy_score: number | null;
  sleep_score: number | null;
  recovery_score: number | null;
  mood_score: number | null;
  notes: string | null;
  anonymous_pool: boolean;
  logged_at: string;
};

export function weekOf(protocol: { created_at: string }): number {
  const days = Math.max(0, differenceInDays(new Date(), new Date(protocol.created_at)));
  return Math.floor(days / 7) + 1;
}

export function totalWeeks(p: JournalProtocol): number | null {
  if (p.ongoing || !p.duration_days) return null;
  return Math.max(1, Math.ceil(p.duration_days / 7));
}

export function isProtocolActive(p: JournalProtocol): boolean {
  if (p.ongoing) return true;
  if (!p.duration_days) return false;
  const days = differenceInDays(new Date(), new Date(p.created_at));
  return days >= 0 && days <= p.duration_days;
}

function dismissKey(pid: string, week: number) { return `journal:dismiss:${pid}:w${week}`; }

/* ===========================  BANNER  =========================== */

export function JournalBanner({
  protocols, onOpenCheckin,
}: { protocols: JournalProtocol[]; onOpenCheckin: (p: JournalProtocol, week: number) => void }) {
  const [entries, setEntries] = useState<Record<string, Set<number>>>({});
  const [, force] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (protocols.length === 0) return;
      const ids = protocols.map((p) => p.id);
      const { data } = await supabase
        .from("protocol_journal_entries")
        .select("protocol_id, week_number")
        .in("protocol_id", ids);
      if (cancelled) return;
      const m: Record<string, Set<number>> = {};
      for (const r of (data ?? []) as { protocol_id: string; week_number: number }[]) {
        (m[r.protocol_id] ??= new Set()).add(r.week_number);
      }
      setEntries(m);
    })();
    return () => { cancelled = true; };
  }, [protocols]);

  const candidates = useMemo(() => {
    const out: { p: JournalProtocol; week: number }[] = [];
    for (const p of protocols) {
      if (!isProtocolActive(p)) continue;
      const start = new Date(p.created_at);
      const daysSinceStart = differenceInDays(new Date(), start);
      if (daysSinceStart < 7) continue; // first check-in is end of week 1
      const week = weekOf(p) - 1; // we're checking in for the just-completed week
      if (week < 1) continue;
      if (entries[p.id]?.has(week)) continue;

      // dismissal logic: dismissed once -> suppress 24h, dismissed twice -> skip week
      const raw = localStorage.getItem(dismissKey(p.id, week));
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { count: number; at: number };
          if (parsed.count >= 2) continue;
          if (Date.now() - parsed.at < 24 * 60 * 60 * 1000) continue;
        } catch { /* ignore */ }
      }
      out.push({ p, week });
    }
    return out;
  }, [protocols, entries]);

  if (candidates.length === 0) return null;

  const dismiss = (pid: string, week: number) => {
    const k = dismissKey(pid, week);
    let count = 0;
    try {
      const raw = localStorage.getItem(k);
      if (raw) count = (JSON.parse(raw) as { count: number }).count ?? 0;
    } catch { /* ignore */ }
    localStorage.setItem(k, JSON.stringify({ count: count + 1, at: Date.now() }));
    force((n) => n + 1);
  };

  return (
    <div className="space-y-2 mb-4">
      {candidates.map(({ p, week }) => (
        <div
          key={`${p.id}-${week}`}
          className="rounded-xl flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: J_COLORS.recovery, color: "#1f3a2a" }}
        >
          <BookOpen className="size-5 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-medium">Week {week} check-in for {p.name}</span>
            <span className="opacity-70"> — takes 60 seconds</span>
          </div>
          <Button
            size="sm"
            onClick={() => onOpenCheckin(p, week)}
            className="bg-[#1f3a2a] text-white hover:bg-[#2c5340]"
          >
            Log How I Feel
          </Button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(p.id, week)}
            className="p-1 rounded hover:bg-black/10"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ===========================  CHECK-IN MODAL  =========================== */

type SliderRowProps = { label: string; value: number; onChange: (v: number) => void; color: string };
function SliderRow({ label, value, onChange, color }: SliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-mono text-lg font-semibold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        style={{ ["--slider-accent" as string]: color }}
        className="[&_[data-slot=slider-range]]:bg-[var(--slider-accent)] [&_[data-slot=slider-thumb]]:border-[var(--slider-accent)] [&_[data-slot=slider-thumb]]:bg-[var(--slider-accent)]"
      />
    </div>
  );
}

export function JournalCheckinModal({
  open, onOpenChange, protocol, week, onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: JournalProtocol | null;
  week: number;
  onSaved?: () => void;
}) {
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [recovery, setRecovery] = useState(7);
  const [mood, setMood] = useState(7);
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEnergy(7); setSleep(7); setRecovery(7); setMood(7);
      setNotes(""); setAnonymous(false);
    }
  }, [open, protocol?.id, week]);

  const save = async () => {
    if (!protocol) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }
    const { error } = await supabase.from("protocol_journal_entries").upsert({
      user_id: u.user.id,
      protocol_id: protocol.id,
      week_number: week,
      energy_score: energy,
      sleep_score: sleep,
      recovery_score: recovery,
      mood_score: mood,
      notes: notes.trim() || null,
      anonymous_pool: anonymous,
    }, { onConflict: "user_id,protocol_id,week_number" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Check-in saved");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold">
            Week {week} — {protocol?.compound}
          </DialogTitle>
          <DialogDescription style={{ color: "#9B7FCB" }}>
            All entries are private by default. You choose what to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <SliderRow label="Energy Level" value={energy} onChange={setEnergy} color={J_COLORS.energy} />
          <SliderRow label="Sleep Quality" value={sleep} onChange={setSleep} color={J_COLORS.sleep} />
          <SliderRow label="Recovery" value={recovery} onChange={setRecovery} color={J_COLORS.recovery} />
          <SliderRow label="Mood" value={mood} onChange={setMood} color={J_COLORS.mood} />

          <div className="space-y-2">
            <label className="text-sm font-medium">Notable Changes</label>
            <Textarea
              placeholder="Anything worth noting this week? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg border p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="anon-pool" className="text-sm font-medium">Add to anonymous research pool</label>
              <Switch id="anon-pool" checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
            <p className="text-[11px] italic text-muted-foreground">
              If enabled, your anonymized entry contributes to Sayne's compound research database. No personal information is ever shared.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={saving}
            className="text-[#1f3a2a] hover:opacity-90"
            style={{ backgroundColor: J_COLORS.recovery }}
          >
            {saving ? "Saving…" : "Save Check-in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===========================  CURVE MODAL  =========================== */

function buildSeries(entries: JournalEntry[], weeks: number) {
  const byWeek = new Map<number, JournalEntry>();
  for (const e of entries) byWeek.set(e.week_number, e);
  const out: { week: string; energy: number | null; sleep: number | null; recovery: number | null; mood: number | null }[] = [];
  for (let w = 1; w <= weeks; w++) {
    const e = byWeek.get(w);
    out.push({
      week: `W${w}`,
      energy: e?.energy_score ?? null,
      sleep: e?.sleep_score ?? null,
      recovery: e?.recovery_score ?? null,
      mood: e?.mood_score ?? null,
    });
  }
  return out;
}

export function JournalCurveModal({
  open, onOpenChange, protocol,
}: { open: boolean; onOpenChange: (o: boolean) => void; protocol: JournalProtocol | null }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!open || !protocol) return;
    (async () => {
      const { data } = await supabase
        .from("protocol_journal_entries")
        .select("*")
        .eq("protocol_id", protocol.id)
        .order("week_number", { ascending: true });
      setEntries((data ?? []) as JournalEntry[]);
    })();
  }, [open, protocol, reloadTick]);

  if (!protocol) return null;
  const currentWeek = weekOf(protocol);
  const tw = totalWeeks(protocol) ?? Math.max(currentWeek, 4);
  const series = buildSeries(entries, Math.max(tw, currentWeek));
  const notesEntries = entries.filter((e) => e.notes && e.notes.trim().length > 0);
  const checkinWeek = Math.max(1, currentWeek);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="font-display text-2xl font-bold">{protocol.name} — Journal</DialogTitle>
              <DialogDescription>
                Week {currentWeek}{totalWeeks(protocol) ? ` of ${totalWeeks(protocol)}` : ""} · {entries.length} entr{entries.length === 1 ? "y" : "ies"} logged
              </DialogDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setCheckinOpen(true)}
              className="text-[#1f3a2a] hover:opacity-90 shrink-0"
              style={{ backgroundColor: J_COLORS.recovery }}
            >
              <BookOpen className="size-4 mr-1.5" /> Log Week {checkinWeek} Check-in
            </Button>
          </div>
        </DialogHeader>

        <JournalCheckinModal
          open={checkinOpen}
          onOpenChange={setCheckinOpen}
          protocol={protocol}
          week={checkinWeek}
          onSaved={() => setReloadTick((n) => n + 1)}
        />

        <div className="h-[360px] w-full">
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DDF5" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="energy" name="Energy" stroke={J_COLORS.energy} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sleep" name="Sleep" stroke={J_COLORS.sleep} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="recovery" name="Recovery" stroke={J_COLORS.recovery} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke={J_COLORS.mood} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Notes</h3>
          {notesEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notesEntries.map((e) => (
                <div key={e.id} className="rounded-md border p-3 text-sm">
                  <div className="text-xs text-muted-foreground mb-1 font-mono">
                    Week {e.week_number} · {format(new Date(e.logged_at), "MMM d, yyyy")}
                  </div>
                  <div>{e.notes}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===========================  COMPLETION MODAL  =========================== */

export function ProtocolCompletionModal({
  open, onOpenChange, protocol,
}: { open: boolean; onOpenChange: (o: boolean) => void; protocol: JournalProtocol | null }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!open || !protocol) return;
    (async () => {
      const { data } = await supabase
        .from("protocol_journal_entries")
        .select("*")
        .eq("protocol_id", protocol.id)
        .order("week_number", { ascending: true });
      setEntries((data ?? []) as JournalEntry[]);
    })();
  }, [open, protocol]);

  if (!protocol) return null;
  const tw = totalWeeks(protocol) ?? weekOf(protocol);
  const series = buildSeries(entries, tw);
  const avg = (key: "energy_score" | "sleep_score" | "recovery_score" | "mood_score") => {
    const vals = entries.map((e) => e[key]).filter((v): v is number => v != null);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };
  const aE = avg("energy_score"), aS = avg("sleep_score"), aR = avg("recovery_score"), aM = avg("mood_score");

  const exportPdf = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return toast.error("Allow popups to export PDF");
    w.document.write(`<!doctype html><html><head><title>${protocol.name} — Protocol Summary</title>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#2D1F4A;padding:40px;max-width:720px;margin:auto;}
        h1{font-family:'Space Grotesk',sans-serif;font-size:28px;margin:0 0 4px;}
        .muted{color:#9B8EC4;font-size:13px;margin-bottom:24px;}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0;}
        .stat{padding:16px;border-radius:12px;text-align:center;}
        .stat .v{font-size:32px;font-weight:700;font-family:'Space Grotesk',sans-serif;}
        .stat .l{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b6480;margin-top:4px;}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;}
        th,td{border-bottom:1px solid #eee;padding:8px;text-align:left;}
        h2{font-family:'Space Grotesk',sans-serif;font-size:18px;margin-top:32px;}
        .note{padding:10px;border:1px solid #eee;border-radius:8px;margin:8px 0;}
        @media print{ button{display:none;} }
      </style></head><body>
      <h1>${protocol.name} — Protocol Complete</h1>
      <div class="muted">${protocol.compound} · ${protocol.duration_days ?? weekOf(protocol) * 7} days · ${entries.length} weekly check-ins</div>
      <div class="grid">
        <div class="stat" style="background:${J_COLORS.energy}33"><div class="v" style="color:${J_COLORS.energy}">${aE ?? "—"}</div><div class="l">Energy</div></div>
        <div class="stat" style="background:${J_COLORS.sleep}33"><div class="v" style="color:${J_COLORS.sleep}">${aS ?? "—"}</div><div class="l">Sleep</div></div>
        <div class="stat" style="background:${J_COLORS.recovery}33"><div class="v" style="color:#3a7a55">${aR ?? "—"}</div><div class="l">Recovery</div></div>
        <div class="stat" style="background:${J_COLORS.mood}33"><div class="v" style="color:#b58a2b">${aM ?? "—"}</div><div class="l">Mood</div></div>
      </div>
      <h2>Weekly scores</h2>
      <table><thead><tr><th>Week</th><th>Energy</th><th>Sleep</th><th>Recovery</th><th>Mood</th></tr></thead>
      <tbody>${series.map((r) => `<tr><td>${r.week}</td><td>${r.energy ?? "—"}</td><td>${r.sleep ?? "—"}</td><td>${r.recovery ?? "—"}</td><td>${r.mood ?? "—"}</td></tr>`).join("")}</tbody>
      </table>
      ${entries.filter((e) => e.notes).length ? `<h2>Notes</h2>${entries.filter((e) => e.notes).map((e) => `<div class="note"><strong>Week ${e.week_number}</strong> — ${e.notes}</div>`).join("")}` : ""}
      <p style="margin-top:32px;"><button onclick="window.print()">Print / Save as PDF</button></p>
      </body></html>`);
    w.document.close();
  };

  const [shareOpen, setShareOpen] = useState(false);
  const keepPrivate = async () => {
    await supabase.from("protocols").update({ ongoing: false }).eq("id", protocol.id);
    toast.success("Protocol archived privately");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-4xl font-bold">Protocol Complete</DialogTitle>
          <DialogDescription className="text-base">
            {protocol.compound} · {protocol.duration_days ?? weekOf(protocol) * 7} days · {entries.length} check-ins
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
          {[
            { label: "Energy", v: aE, color: J_COLORS.energy },
            { label: "Sleep", v: aS, color: J_COLORS.sleep },
            { label: "Recovery", v: aR, color: J_COLORS.recovery },
            { label: "Mood", v: aM, color: J_COLORS.mood },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5 text-center" style={{ backgroundColor: `${s.color}33` }}>
              <div className="font-display text-4xl font-bold" style={{ color: s.color }}>{s.v ?? "—"}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DDF5" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[1, 10]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="energy" name="Energy" stroke={J_COLORS.energy} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sleep" name="Sleep" stroke={J_COLORS.sleep} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="recovery" name="Recovery" stroke={J_COLORS.recovery} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke={J_COLORS.mood} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <Button onClick={() => setShareOpen(true)} className="gap-2 text-[#1f3a2a] hover:opacity-90" style={{ backgroundColor: J_COLORS.recovery }}>
            <Share2 className="size-4" /> Share Anonymously to Stack Feed
          </Button>
          <Button onClick={keepPrivate} className="gap-2 text-[#3b2766] hover:opacity-90" style={{ backgroundColor: J_COLORS.sleep }}>
            <Lock className="size-4" /> Keep Private
          </Button>
          <Button onClick={exportPdf} className="gap-2 text-[#6b4f10] hover:opacity-90" style={{ backgroundColor: J_COLORS.mood }}>
            <Download className="size-4" /> Export as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
