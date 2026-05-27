import { format, differenceInDays, startOfDay } from "date-fns";
import { Sun, Moon, Check } from "lucide-react";
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
