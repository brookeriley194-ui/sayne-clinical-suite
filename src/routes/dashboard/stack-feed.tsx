import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Heart, Search, Users2, X, Download, ArrowRight, Sparkles, BookOpen, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  STACK_TEMPLATES, TEMPLATE_CATEGORIES, maxDuration, allTemplateCompounds,
  type StackTemplate,
} from "@/lib/stack-templates";

export const Route = createFileRoute("/dashboard/stack-feed")({
  component: StackFeedPage,
});

/* ============ design tokens ============ */
const C = {
  lavender: "#C9A8F5",
  babyBlue: "#89CFF0",
  mint: "#98E4B2",
  yellow: "#FFD580",
  pink: "#F8C9D4",
  energy: "#89CFF0",
  sleep: "#C9A8F5",
  recovery: "#98E4B2",
  mood: "#FFD580",
};

const COMPOUNDS = ["BPC-157", "TB-500", "MOTS-C", "Ipamorelin", "CJC-1295", "Selank", "Semax", "PT-141", "Tesamorelin", "GHK-Cu", "SS-31 (Elamipretide)", "Epitalon (Epithalon)", "KPV", "DSIP", "Thymosin Alpha-1", "Glutathione", "Semaglutide", "Tirzepatide", "NAD+", "MK-677 (Ibutamoren)", "AOD-9604"];
const GOALS = ["Energy", "Recovery", "Sleep", "Gut Health", "Cognitive", "Immune", "Body Composition", "Anti-aging", "Sexual Health", "Anti-inflammatory", "Stress", "Fat Loss", "Metabolic Health", "Skin & Hair"];
const DURATIONS = [
  { label: "Under 4 weeks", min: 0, max: 27 },
  { label: "4-8 weeks", min: 28, max: 55 },
  { label: "8-12 weeks", min: 56, max: 83 },
  { label: "12+ weeks", min: 84, max: 99999 },
];
const SORTS = ["Most Recent", "Highest Rated", "Most Imported"] as const;
type Sort = typeof SORTS[number];

type SharedStack = {
  id: string;
  protocol_id: string;
  user_id: string;
  compound: string;
  dose_mcg: number;
  dose_unit: string;
  frequency: string;
  route: string;
  duration_days: number | null;
  avg_energy: number | null;
  avg_sleep: number | null;
  avg_recovery: number | null;
  avg_mood: number | null;
  overall_score: number | null;
  goal_tags: string[] | null;
  summary: string | null;
  import_count: number;
  anonymous_id: string;
  created_at: string;
};

/* ============ page ============ */
function StackFeedPage() {
  const [stacks, setStacks] = useState<SharedStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // shared filters
  const [q, setQ] = useState("");
  const [compounds, setCompounds] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [durIdx, setDurIdx] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("Most Recent");

  const [saved, setSaved] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("sayne:saved-stacks") ?? "[]")); } catch { return new Set(); }
  });
  const [importStack, setImportStack] = useState<SharedStack | null>(null);
  const [importTemplate, setImportTemplate] = useState<StackTemplate | null>(null);

  useEffect(() => { localStorage.setItem("sayne:saved-stacks", JSON.stringify([...saved])); }, [saved]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shared_stacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setStacks((data ?? []) as SharedStack[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filteredCommunity = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let arr = stacks.filter((s) => {
      if (compounds.size && !compounds.has(s.compound)) return false;
      if (goals.size) {
        const tags = new Set(s.goal_tags ?? []);
        let hit = false;
        for (const g of goals) if (tags.has(g)) { hit = true; break; }
        if (!hit) return false;
      }
      if (durIdx != null) {
        const d = s.duration_days ?? 0;
        const r = DURATIONS[durIdx];
        if (d < r.min || d > r.max) return false;
      }
      if (ql) {
        const hay = [s.compound, s.summary ?? "", (s.goal_tags ?? []).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    if (sort === "Highest Rated") arr = [...arr].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
    if (sort === "Most Imported") arr = [...arr].sort((a, b) => b.import_count - a.import_count);
    return arr;
  }, [stacks, q, compounds, goals, durIdx, sort]);

  const filteredTemplates = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return STACK_TEMPLATES.filter((tmpl) => {
      if (compounds.size) {
        const tc = new Set(allTemplateCompounds(tmpl));
        let hit = false;
        for (const c of compounds) if (tc.has(c)) { hit = true; break; }
        if (!hit) return false;
      }
      if (goals.size) {
        const tg = new Set(tmpl.goal_tags);
        let hit = false;
        for (const g of goals) if (tg.has(g)) { hit = true; break; }
        if (!hit) return false;
      }
      if (durIdx != null) {
        const d = maxDuration(tmpl);
        const r = DURATIONS[durIdx];
        if (d < r.min || d > r.max) return false;
      }
      if (ql) {
        const hay = [
          tmpl.name, tmpl.description, tmpl.goal_tags.join(" "),
          tmpl.compounds.map((c) => c.compound).join(" "),
        ].join(" ").toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [q, compounds, goals, durIdx]);

  // Group templates by category preserving order
  const groupedTemplates = useMemo(() => {
    const m = new Map<string, StackTemplate[]>();
    for (const cat of TEMPLATE_CATEGORIES) m.set(cat, []);
    for (const t of filteredTemplates) m.get(t.category)!.push(t);
    return Array.from(m.entries()).filter(([, arr]) => arr.length > 0);
  }, [filteredTemplates]);

  function toggle<T>(set: Set<T>, v: T, setter: (s: Set<T>) => void) {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    setter(n);
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      {!dismissed && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 border" style={{ backgroundColor: `${C.pink}55`, borderColor: `${C.pink}` }}>
          <div className="text-sm leading-relaxed flex-1" style={{ color: "#7a3e4f" }}>
            <strong>Stack Feed</strong> contains educational templates and user-shared protocols. This is not medical advice. Always consult a qualified professional before beginning any protocol.
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-black/5" aria-label="Dismiss">
            <X className="h-4 w-4" style={{ color: "#7a3e4f" }} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3" data-tour="stack-feed-header">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.lavender}33` }}>
          <Users2 className="h-5 w-5" style={{ color: C.lavender }} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Stack Feed</h1>
          <p className="text-sm text-muted-foreground">Browse starter templates and real protocols shared by the community.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Main column with tabs */}
        <div className="min-w-0">
          <Tabs defaultValue="templates">
            <TabsList className="mb-4">
              <TabsTrigger value="templates" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Templates
              </TabsTrigger>
              <TabsTrigger value="community" className="gap-1.5">
                <Users2 className="h-3.5 w-3.5" /> Community
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-5">
              <div
                className="rounded-xl px-4 py-3 border text-sm leading-relaxed"
                style={{ backgroundColor: `${C.lavender}1f`, borderColor: `${C.lavender}55`, color: "var(--foreground)" }}
              >
                <div className="flex items-center gap-2 mb-1 font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <Sparkles className="h-4 w-4" style={{ color: C.lavender }} /> Starter templates
                </div>
                Starter templates to help you get going. These are common protocol structures for reference, not personal results or medical advice.
              </div>

              {groupedTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                  No templates match your filters.
                </div>
              ) : (
                groupedTemplates.map(([category, list]) => (
                  <section key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.lavender }} />
                      <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">
                        {category}
                      </h2>
                      <span className="text-[10px] text-muted-foreground font-mono">{list.length}</span>
                    </div>
                    <div className="space-y-3">
                      {list.map((tmpl) => (
                        <TemplateCard key={tmpl.id} template={tmpl} onImport={() => setImportTemplate(tmpl)} />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </TabsContent>

            <TabsContent value="community" className="space-y-4">
              {loading ? (
                <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>
              ) : filteredCommunity.length === 0 ? (
                <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                  No community-shared stacks yet. Check back soon, or browse the Templates tab.
                </div>
              ) : (
                filteredCommunity.map((s) => (
                  <StackCard
                    key={s.id}
                    stack={s}
                    saved={saved.has(s.id)}
                    onSaveToggle={() => toggle(saved, s.id, setSaved)}
                    onImport={() => setImportStack(s)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Filters */}
        <aside className="space-y-5 lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border p-4 bg-card space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search compounds, goals, or keywords" className="pl-9" />
              </div>
            </div>

            <FilterGroup label="Compound" color={C.babyBlue}>
              {COMPOUNDS.map((c) => (
                <Chip key={c} active={compounds.has(c)} color={C.babyBlue} onClick={() => toggle(compounds, c, setCompounds)}>{c}</Chip>
              ))}
            </FilterGroup>

            <FilterGroup label="Goal" color={C.mint}>
              {GOALS.map((g) => (
                <Chip key={g} active={goals.has(g)} color={C.mint} onClick={() => toggle(goals, g, setGoals)}>{g}</Chip>
              ))}
            </FilterGroup>

            <FilterGroup label="Duration" color={C.yellow}>
              {DURATIONS.map((d, i) => (
                <Chip key={d.label} active={durIdx === i} color={C.yellow} onClick={() => setDurIdx(durIdx === i ? null : i)}>{d.label}</Chip>
              ))}
            </FilterGroup>

            <FilterGroup label="Sort by" color={C.lavender}>
              {SORTS.map((s) => (
                <Chip key={s} active={sort === s} color={C.lavender} onClick={() => setSort(s)}>{s}</Chip>
              ))}
            </FilterGroup>
          </div>
        </aside>
      </div>

      <ImportModal stack={importStack} onClose={() => setImportStack(null)} onImported={load} />
      <ImportTemplateModal template={importTemplate} onClose={() => setImportTemplate(null)} />
    </div>
  );
}

/* ============ filter chip ============ */
function FilterGroup({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1 rounded-full border transition-colors"
      style={{
        backgroundColor: active ? `${color}55` : "transparent",
        borderColor: active ? color : "var(--border)",
        color: active ? "var(--foreground)" : "var(--muted-foreground)",
      }}
    >
      {children}
    </button>
  );
}

/* ============ template card ============ */
function TemplateCard({ template, onImport }: { template: StackTemplate; onImport: () => void }) {
  const dur = maxDuration(template);
  return (
    <div
      className="rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow relative"
      style={{ borderColor: `${C.lavender}55` }}
    >
      {/* Template badge */}
      <div className="absolute top-4 right-4">
        <span
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold"
          style={{ backgroundColor: `${C.lavender}`, color: "#3b2766" }}
        >
          <BookOpen className="h-3 w-3" /> Template
        </span>
      </div>

      {/* Title */}
      <div className="pr-24 mb-2">
        <h3
          className="text-xl font-bold leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {template.name}
        </h3>
        <div className="text-[11px] text-muted-foreground font-mono mt-1">
          {template.compounds.length} compound{template.compounds.length === 1 ? "" : "s"} · {Math.round(dur / 7)} wk
        </div>
      </div>

      {/* Goal tags */}
      {template.goal_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {template.goal_tags.map((g) => (
            <span key={g} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.mint}40`, color: "#1f4a31" }}>{g}</span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {template.description}
      </p>

      {/* Compound rows */}
      <div className="rounded-xl border divide-y mb-4" style={{ borderColor: "var(--border)" }}>
        {template.compounds.map((c, i) => (
          <div key={i} className="px-3 py-2 flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{c.compound}</div>
              <div className="text-[11px] text-muted-foreground font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {c.dose}{c.dose_unit} · {c.frequency} · {c.route}
              </div>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {c.duration_days}d
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[10px] italic text-muted-foreground">
          Educational template. Not medical advice.
        </div>
        <Button onClick={onImport} size="sm" className="gap-1.5 text-[#3b2766] hover:opacity-90" style={{ backgroundColor: C.lavender }}>
          <Download className="h-3.5 w-3.5" /> Import This Stack
        </Button>
      </div>
    </div>
  );
}

/* ============ community stack card ============ */
function StackCard({
  stack, saved, onSaveToggle, onImport,
}: { stack: SharedStack; saved: boolean; onSaveToggle: () => void; onImport: () => void }) {
  const score = stack.overall_score ?? 0;
  const barColor = score >= 7 ? C.mint : score >= 4 ? C.yellow : C.pink;
  const dots: { key: string; v: number | null; color: string; label: string }[] = [
    { key: "energy", v: stack.avg_energy, color: C.energy, label: "E" },
    { key: "sleep", v: stack.avg_sleep, color: C.sleep, label: "S" },
    { key: "recovery", v: stack.avg_recovery, color: C.recovery, label: "R" },
    { key: "mood", v: stack.avg_mood, color: C.mood, label: "M" },
  ];

  const note = stack.summary ?? "";
  const truncated = note.length > 100 ? note.slice(0, 100) + "…" : note;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center flex-wrap gap-2 min-w-0">
          <h3 className="font-display text-xl font-bold truncate">{stack.compound}</h3>
          {stack.duration_days != null && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.yellow}55`, color: "#6b4f10" }}>
              {Math.round(stack.duration_days / 7)} wk
            </span>
          )}
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.babyBlue}55`, color: "#1f4a66" }}>
            {stack.route}
          </span>
        </div>
        <button onClick={onSaveToggle} aria-label="Save" className="p-1.5 rounded-full hover:bg-black/5">
          <Heart className="h-4 w-4" style={{ color: saved ? C.pink : "var(--muted-foreground)", fill: saved ? C.pink : "transparent" }} />
        </button>
      </div>

      <div className="text-sm font-mono text-muted-foreground mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {stack.dose_mcg} {stack.dose_unit} · {stack.frequency}
      </div>

      <div className="flex items-center gap-4 mb-3">
        {dots.map((d) => (
          <div key={d.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {d.v != null ? d.v.toFixed(1) : "—"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          <span>Overall outcome</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{score.toFixed(1)} / 10</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--panel)" }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${(score / 10) * 100}%`, backgroundColor: barColor }} />
        </div>
      </div>

      {(stack.goal_tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {stack.goal_tags!.map((g) => (
            <span key={g} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.mint}40`, color: "#1f4a31" }}>{g}</span>
          ))}
        </div>
      )}

      {note && (
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {expanded ? note : truncated}
          {note.length > 100 && (
            <button onClick={() => setExpanded((e) => !e)} className="ml-1 text-xs underline" style={{ color: C.lavender }}>
              {expanded ? "show less" : "read more"}
            </button>
          )}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stack.import_count}</span> people imported this
        </div>
        <Button onClick={onImport} size="sm" className="gap-1.5 text-[#3b2766] hover:opacity-90" style={{ backgroundColor: C.lavender }}>
          <Download className="h-3.5 w-3.5" /> Import This Stack
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground mt-3 italic">
        Shared by {stack.anonymous_id} · {formatDistanceToNow(new Date(stack.created_at), { addSuffix: true })}
      </div>
    </div>
  );
}

/* ============ community import modal ============ */
function ImportModal({ stack, onClose, onImported }: { stack: SharedStack | null; onClose: () => void; onImported: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function doImport(customize: boolean) {
    if (!stack || !user) return;
    setBusy(true);
    const { error } = await supabase.from("protocols").insert({
      name: `${stack.compound} (from Stack Feed)`,
      compound: stack.compound,
      dose: stack.dose_mcg,
      dose_unit: stack.dose_unit,
      frequency: stack.frequency,
      route: stack.route,
      duration_days: stack.duration_days,
      ongoing: stack.duration_days == null,
      doctor_id: user.id,
      source: "stack_feed_import",
      time_of_day: "AM",
      fasted: false,
    });
    if (error) { setBusy(false); toast.error(error.message); return; }
    await supabase.rpc("increment_shared_stack_import", { _stack_id: stack.id });
    setBusy(false);
    onClose();
    onImported();
    toast.success("Stack imported to your protocols");
    if (customize) navigate({ to: "/dashboard/protocols" });
  }

  return (
    <Dialog open={!!stack} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Import Stack</DialogTitle>
          <DialogDescription>
            {stack && (
              <>Import <strong>{stack.compound} {stack.dose_mcg}{stack.dose_unit} {stack.frequency}</strong> protocol to your protocols?</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button onClick={() => doImport(true)} disabled={busy} className="text-[#1f4a66] hover:opacity-90" style={{ backgroundColor: C.babyBlue }}>
            Customize First <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <Button onClick={() => doImport(false)} disabled={busy} className="text-[#3b2766] hover:opacity-90" style={{ backgroundColor: C.lavender }}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ template import modal ============ */
function ImportTemplateModal({ template, onClose }: { template: StackTemplate | null; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [missingVials, setMissingVials] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  // When a template is opened, check the user's vials for compound matches
  useEffect(() => {
    let cancelled = false;
    async function checkVials() {
      setChecked(false);
      setMissingVials([]);
      if (!template || !user) return;
      const { data, error } = await supabase
        .from("vials")
        .select("compound")
        .eq("doctor_id", user.id);
      if (cancelled) return;
      if (error) { setChecked(true); return; }
      const owned = new Set((data ?? []).map((v: { compound: string }) => v.compound.toLowerCase()));
      const missing = Array.from(
        new Set(template.compounds.map((c) => c.compound))
      ).filter((c) => !owned.has(c.toLowerCase()));
      setMissingVials(missing);
      setChecked(true);
    }
    void checkVials();
    return () => { cancelled = true; };
  }, [template, user]);

  async function doImport(customize: boolean) {
    if (!template || !user) return;
    setBusy(true);

    // Pull vials for auto-matching
    const { data: vialRows } = await supabase
      .from("vials")
      .select("id, compound, status")
      .eq("doctor_id", user.id);
    const vialByCompound = new Map<string, string>();
    for (const v of vialRows ?? []) {
      const key = (v as { compound: string }).compound.toLowerCase();
      if (!vialByCompound.has(key)) vialByCompound.set(key, (v as { id: string }).id);
    }

    // Pick the dominant route for the stack-level route field (most-common across compounds)
    const routeCount = new Map<string, number>();
    for (const c of template.compounds) routeCount.set(c.route, (routeCount.get(c.route) ?? 0) + 1);
    const dominantRoute = Array.from(routeCount.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const maxDur = Math.max(...template.compounds.map((c) => c.duration_days));

    const rows = template.compounds.map((c) => ({
      name: template.name,
      compound: c.compound,
      dose: c.dose,
      dose_unit: c.dose_unit,
      frequency: c.frequency,
      route: c.route,
      duration_days: c.duration_days,
      ongoing: false,
      doctor_id: user.id,
      source: "template_import",
      time_of_day: c.time_of_day,
      fasted: false,
      vial_id: vialByCompound.get(c.compound.toLowerCase()) ?? null,
      notes: `Imported from template: ${template.name}. ${template.description}`,
    }));

    const { error } = await supabase.from("protocols").insert(rows);
    setBusy(false);
    if (error) { toast.error(error.message); return; }

    onClose();
    toast.success(
      missingVials.length
        ? `Template imported · ${missingVials.length} vial${missingVials.length === 1 ? "" : "s"} not on hand`
        : "Template imported to your stacks",
    );
    if (customize) {
      navigate({ to: "/dashboard/protocols" });
    } else if (missingVials.length) {
      navigate({ to: "/dashboard/my-vials" });
    } else {
      navigate({ to: "/dashboard/protocols" });
    }
  }

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: C.lavender }} />
            Import Template
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1">
              {template && (
                <>
                  <div className="text-sm">
                    Import <strong>{template.name}</strong> as a new stack with{" "}
                    <strong>{template.compounds.length}</strong> compound{template.compounds.length === 1 ? "" : "s"} into{" "}
                    <strong>My Stacks</strong>?
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: `${C.lavender}1f` }}>
                    <div className="text-xs text-muted-foreground mb-1">Compounds</div>
                    <ul className="text-sm space-y-0.5">
                      {template.compounds.map((c, i) => (
                        <li key={i} className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          • {c.compound} {c.dose}{c.dose_unit} · {c.frequency}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {checked && missingVials.length > 0 && (
                    <div className="rounded-lg p-3 border text-xs" style={{ backgroundColor: `${C.yellow}33`, borderColor: `${C.yellow}` }}>
                      <strong>Heads up:</strong> You don't have vials on hand for:{" "}
                      <span className="font-mono">{missingVials.join(", ")}</span>.
                      You can still import — we'll prompt you to add them in My Vials.
                    </div>
                  )}
                  <div className="text-[10px] italic text-muted-foreground">
                    Educational template. Not medical advice.
                  </div>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button onClick={() => doImport(true)} disabled={busy} className="text-[#1f4a66] hover:opacity-90" style={{ backgroundColor: C.babyBlue }}>
            Customize First <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <Button onClick={() => doImport(false)} disabled={busy} className="text-[#3b2766] hover:opacity-90" style={{ backgroundColor: C.lavender }}>
            Import Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
