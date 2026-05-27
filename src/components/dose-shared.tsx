import { format, differenceInDays, startOfDay } from "date-fns";
import { Sun, Moon, Check, AlertTriangle, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type Stack = {
  id: string;
  peptide_name: string;
  vial_id: string | null;
  reconstituted_at: string | null;
  time_of_day: string;
  fasted: boolean;
  cycle_length_days: number;
  start_date: string;
  dose: number | null;
  dose_unit: string;
  frequency: string;
  notes: string | null;
  created_at: string;
};
export type DoseLog = { id: string; stack_id: string; dose_date: string; period: string };

export const FREQUENCIES = [
  { value: "daily", label: "Daily", interval: 1 },
  { value: "every_other_day", label: "Every other day", interval: 2 },
  { value: "twice_weekly", label: "Twice weekly (Mon/Thu)", interval: -1 },
  { value: "weekly", label: "Weekly", interval: 7 },
  { value: "bi_weekly", label: "Bi-weekly", interval: 14 },
  { value: "monthly", label: "Monthly", interval: 30 },
];

export function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 55%)`;
}

export function isScheduled(stack: Stack, date: Date): boolean {
  const start = startOfDay(new Date(stack.start_date));
  const d = startOfDay(date);
  const diff = differenceInDays(d, start);
  if (diff < 0 || diff >= stack.cycle_length_days) return false;
  const freq = FREQUENCIES.find((f) => f.value === stack.frequency);
  if (!freq) return true;
  if (freq.value === "twice_weekly") {
    const day = d.getDay();
    return day === 1 || day === 4;
  }
  return diff % freq.interval === 0;
}

export function DosePill({
  stack, day, period, doses, onToggle, size = "sm",
}: {
  stack: Stack; day: Date; period: "AM" | "PM"; doses: DoseLog[];
  onToggle: (s: Stack, d: Date, p: string) => void;
  size?: "sm" | "lg";
}) {
  const dateStr = format(day, "yyyy-MM-dd");
  const taken = doses.some((dd) => dd.stack_id === stack.id && dd.dose_date === dateStr && dd.period === period);
  return (
    <button
      type="button"
      onClick={() => onToggle(stack, day, period)}
      title={`${stack.peptide_name}${stack.dose ? ` · ${stack.dose}${stack.dose_unit}` : ""} (${period})`}
      className={cn(
        "flex items-center gap-1 rounded w-full transition-opacity hover:opacity-80",
        size === "lg" ? "px-2.5 py-2 text-sm gap-2" : "px-1 py-0.5 text-[10px]",
        taken && "opacity-60",
      )}
      style={{ background: `${colorFor(stack.id)}25`, borderLeft: `3px solid ${colorFor(stack.id)}` }}
    >
      <span
        className={cn(
          "rounded-sm border grid place-items-center shrink-0",
          size === "lg" ? "size-4" : "size-3",
          taken ? "border-transparent" : "border-current opacity-60",
        )}
        style={taken ? { background: colorFor(stack.id) } : undefined}
      >
        {taken && <Check className={size === "lg" ? "size-3 text-white" : "size-2.5 text-white"} strokeWidth={3} />}
      </span>
      <span className={cn("truncate flex-1 text-left", taken && "line-through")}>
        {stack.peptide_name}
        {stack.dose != null && (
          <span className="ml-1 font-mono tabular-nums opacity-80">{stack.dose}{stack.dose_unit}</span>
        )}
      </span>
    </button>
  );
}

export function DayCell({
  day, stacks, doses, onToggle, isToday, size = "md",
}: {
  day: Date; stacks: Stack[]; doses: DoseLog[];
  onToggle: (s: Stack, d: Date, p: string) => void;
  isToday: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const scheduled = stacks.filter((s) => isScheduled(s, day));
  const am = scheduled.filter((s) => s.time_of_day === "AM" || s.time_of_day === "Both");
  const pm = scheduled.filter((s) => s.time_of_day === "PM" || s.time_of_day === "Both");
  const heights = { sm: "min-h-[140px]", md: "min-h-[140px]", lg: "min-h-[220px]", xl: "min-h-[360px]" };
  const pillSize = size === "xl" ? "lg" : "sm";
  return (
    <div
      className={cn(
        "rounded-md border flex flex-col overflow-hidden",
        heights[size],
        isToday ? "border-primary bg-primary/5" : "border-border bg-background/50",
      )}
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/60">
        <span className={cn("text-xs font-mono tabular-nums", isToday && "font-bold text-primary")}>
          {format(day, size === "lg" || size === "xl" ? "EEE d" : "d")}
        </span>
        {isToday && <span className="text-[9px] uppercase text-primary font-semibold">Today</span>}
      </div>
      <div className="grid grid-rows-2 flex-1 divide-y divide-border/60">
        <div className={cn("flex flex-col gap-1 min-h-0", size === "xl" ? "p-3 gap-2" : "p-1.5")}>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <Sun className="size-2.5" /> AM
          </div>
          {am.length === 0 && size === "xl" && (
            <div className="text-xs text-muted-foreground/60 italic">No AM doses</div>
          )}
          {am.map((s) => (
            <DosePill key={`am-${s.id}`} stack={s} day={day} period="AM" doses={doses} onToggle={onToggle} size={pillSize as "sm" | "lg"} />
          ))}
        </div>
        <div className={cn("flex flex-col gap-1 min-h-0 bg-muted/20", size === "xl" ? "p-3 gap-2" : "p-1.5")}>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <Moon className="size-2.5" /> PM
          </div>
          {pm.length === 0 && size === "xl" && (
            <div className="text-xs text-muted-foreground/60 italic">No PM doses</div>
          )}
          {pm.map((s) => (
            <DosePill key={`pm-${s.id}`} stack={s} day={day} period="PM" doses={doses} onToggle={onToggle} size={pillSize as "sm" | "lg"} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Reorder reminders ----

export type ReorderItem = {
  vialId: string;
  compound: string;
  vialSizeMg: number;
  mgUsed: number;
  percent: number;
};

export function doseToMg(dose: number, unit: string): number | null {
  if (unit === "mg") return dose;
  if (unit === "mcg") return dose / 1000;
  return null; // units / mL: can't convert without concentration
}

export async function fetchReorderItems(): Promise<ReorderItem[]> {
  const [v, s, d] = await Promise.all([
    supabase.from("vials").select("id, compound, vial_size_mg, status").neq("status", "used"),
    supabase.from("stacks").select("id, vial_id, dose, dose_unit").not("vial_id", "is", null),
    supabase.from("stack_doses").select("stack_id"),
  ]);
  const vials = v.data ?? [];
  const stacks = (s.data ?? []) as { id: string; vial_id: string; dose: number | null; dose_unit: string }[];
  const doses = (d.data ?? []) as { stack_id: string }[];

  const doseCountByStack = new Map<string, number>();
  for (const dd of doses) doseCountByStack.set(dd.stack_id, (doseCountByStack.get(dd.stack_id) ?? 0) + 1);

  const usedByVial = new Map<string, number>();
  for (const st of stacks) {
    if (!st.dose) continue;
    const mg = doseToMg(st.dose, st.dose_unit);
    if (mg == null) continue;
    const count = doseCountByStack.get(st.id) ?? 0;
    usedByVial.set(st.vial_id, (usedByVial.get(st.vial_id) ?? 0) + mg * count);
  }

  const items: ReorderItem[] = [];
  for (const vial of vials) {
    const mgUsed = usedByVial.get(vial.id) ?? 0;
    const percent = vial.vial_size_mg > 0 ? (mgUsed / vial.vial_size_mg) * 100 : 0;
    if (percent >= 50) {
      items.push({
        vialId: vial.id,
        compound: vial.compound,
        vialSizeMg: vial.vial_size_mg,
        mgUsed,
        percent: Math.min(100, percent),
      });
    }
  }
  return items.sort((a, b) => b.percent - a.percent);
}

export function ReorderReminders({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<ReorderItem[] | null>(null);
  useEffect(() => { fetchReorderItems().then(setItems).catch(() => setItems([])); }, []);
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
          <AlertTriangle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-sm">
              {items.length === 1 ? "1 vial running low" : `${items.length} vials running low`}
            </h3>
            <Link to="/dashboard/my-vials" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <ShoppingCart className="size-3" /> Time to reorder
            </Link>
          </div>
          <div className={cn("mt-2 grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
            {items.map((it) => (
              <div key={it.vialId} className="rounded-md bg-background/60 border border-amber-500/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{it.compound}</span>
                  <span className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {Math.round(it.percent)}% used
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${it.percent}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                  {it.mgUsed.toFixed(2)} / {it.vialSizeMg} mg
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Vial visual mockup ----

export function VialVisual({
  fillPercent,
  color = "hsl(var(--primary))",
  size = "md",
  empty = false,
}: {
  fillPercent: number; // 0–100, percent of liquid REMAINING
  color?: string;
  size?: "sm" | "md" | "lg";
  empty?: boolean;
}) {
  const dims = { sm: { w: 36, h: 72 }, md: { w: 52, h: 100 }, lg: { w: 72, h: 140 } }[size];
  const pct = empty ? 0 : Math.max(0, Math.min(100, fillPercent));
  // body of vial: x 8 → 44 (w 36), y 22 → 90 (h 68) within 52x100 viewBox
  const bodyTop = 22;
  const bodyBottom = 90;
  const bodyHeight = bodyBottom - bodyTop;
  const liquidHeight = (bodyHeight * pct) / 100;
  const liquidY = bodyBottom - liquidHeight;

  return (
    <svg
      width={dims.w}
      height={dims.h}
      viewBox="0 0 52 100"
      className="shrink-0"
      aria-label={`Vial ${Math.round(pct)}% full`}
    >
      <defs>
        <clipPath id={`vial-body-${pct}-${color}`}>
          <rect x="9" y={bodyTop + 1} width="34" height={bodyHeight - 1} rx="2" />
        </clipPath>
        <linearGradient id={`liquid-grad-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* cap */}
      <rect x="14" y="2" width="24" height="8" rx="1.5" className="fill-muted-foreground/70" />
      <rect x="12" y="9" width="28" height="6" rx="1" className="fill-muted-foreground/50" />
      {/* neck */}
      <rect x="18" y="15" width="16" height="8" className="fill-muted-foreground/30" />
      {/* glass body outline */}
      <rect
        x="8"
        y={bodyTop}
        width="36"
        height={bodyHeight}
        rx="3"
        className="fill-background stroke-border"
        strokeWidth="1.2"
      />
      {/* liquid */}
      {pct > 0 && (
        <rect
          x="9"
          y={liquidY}
          width="34"
          height={bodyBottom - liquidY}
          fill={`url(#liquid-grad-${color})`}
          clipPath={`url(#vial-body-${pct}-${color})`}
        />
      )}
      {/* highlight */}
      <rect x="11" y={bodyTop + 3} width="3" height={bodyHeight - 8} rx="1.5" className="fill-white/30" />
      {empty && (
        <text x="26" y="60" textAnchor="middle" className="fill-muted-foreground" fontSize="10" fontWeight="600">
          EMPTY
        </text>
      )}
    </svg>
  );
}

// Compute remaining doses for a stack linked to a vial.
// Returns null when uncomputable (no vial linked, missing data, or dose unit not mg/mcg).
export function computeRemainingDoses(
  stack: { dose: number | null; dose_unit: string; vial_id: string | null },
  vialSizeMg: number | null,
  dosesTaken: number,
): { remaining: number | null; total: number | null; percentLeft: number } {
  if (!stack.vial_id || !vialSizeMg || !stack.dose) {
    return { remaining: null, total: null, percentLeft: 100 };
  }
  const mgPer = doseToMg(stack.dose, stack.dose_unit);
  if (mgPer == null || mgPer <= 0) return { remaining: null, total: null, percentLeft: 100 };
  const total = Math.floor(vialSizeMg / mgPer);
  const remaining = Math.max(0, total - dosesTaken);
  const percentLeft = Math.max(0, Math.min(100, ((total - dosesTaken) / total) * 100));
  return { remaining, total, percentLeft };
}
