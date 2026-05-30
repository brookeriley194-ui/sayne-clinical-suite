import { Flame, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getEncouragement, getStreakStatus, type StreakRow } from "@/hooks/use-streak";

const FLAME_YELLOW = "#F5C97A";
const MINT = "#A8D5BA";

type Props = {
  row: StreakRow | null;
  loading: boolean;
  /** Doses scheduled vs. logged today; passed in from Today page. */
  todayProgress: { logged: number; total: number };
  /** Set true briefly after the user completes the final dose of the day. */
  pulseStreak?: boolean;
};

export function StreakCard({ row, loading, todayProgress, pulseStreak }: Props) {
  const status = getStreakStatus(row);
  const streak = row?.current_streak ?? 0;
  const encouragement = getEncouragement(streak);

  // 7-day strip: array of date strings for the last 7 days (oldest -> today).
  const last7 = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i));
  }, []);

  const [loggedDays, setLoggedDays] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const from = format(addDays(new Date(), -7), "yyyy-MM-dd");
      const { data } = await supabase
        .from("stack_doses")
        .select("dose_date")
        .eq("doctor_id", u.user.id)
        .gte("dose_date", from);
      if (cancelled) return;
      const set = new Set<string>();
      for (const r of (data ?? []) as { dose_date: string }[]) set.add(r.dose_date);
      setLoggedDays(set);
    })();
    return () => { cancelled = true; };
  }, [row?.last_logged_date]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const pct = todayProgress.total > 0
    ? Math.min(100, Math.round((todayProgress.logged / todayProgress.total) * 100))
    : 0;
  const complete = todayProgress.total > 0 && todayProgress.logged >= todayProgress.total;

  // Progress ring geometry
  const R = 28;
  const C = 2 * Math.PI * R;
  const offset = C - (C * pct) / 100;

  return (
    <div
      className="sayne-card p-5 mb-6 grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center"
      data-tour="today-streak"
    >
      {/* Streak number block */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "size-14 rounded-2xl flex items-center justify-center shrink-0",
            pulseStreak && "streak-pulse",
          )}
          style={{ background: `color-mix(in oklab, ${FLAME_YELLOW} 22%, transparent)` }}
        >
          <Flame className="size-7" style={{ color: FLAME_YELLOW }} fill={FLAME_YELLOW} fillOpacity={0.35} />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tabular-nums leading-none">
              {loading ? "—" : streak}
            </span>
            {status === "at_risk" && streak > 0 && (
              <span
                className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                style={{ background: `color-mix(in oklab, ${FLAME_YELLOW} 28%, transparent)`, color: "#8a6a1f" }}
              >
                Streak at risk
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">day streak</div>
          <div className="text-sm mt-1 font-medium">{encouragement}</div>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last 7 days</div>
        <div className="flex items-center gap-2">
          {last7.map((d) => {
            const ds = format(d, "yyyy-MM-dd");
            const isToday = ds === todayStr;
            const filled = loggedDays.has(ds);
            return (
              <div key={ds} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "size-3.5 rounded-full border transition-colors",
                    isToday && "today-dot-pulse",
                  )}
                  style={{
                    background: filled ? MINT : "transparent",
                    borderColor: filled ? MINT : "color-mix(in oklab, currentColor 25%, transparent)",
                    boxShadow: isToday ? `0 0 0 2px color-mix(in oklab, ${MINT} 35%, transparent)` : undefined,
                  }}
                  aria-label={`${format(d, "EEE")} ${filled ? "logged" : "not logged"}`}
                />
                <span className="text-[9px] uppercase text-muted-foreground tabular-nums">
                  {format(d, "EEEEE")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's progress ring */}
      <div className="flex items-center gap-3 justify-self-end">
        <div className="relative size-[72px]">
          <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
            <circle cx="36" cy="36" r={R} fill="none" strokeWidth="6"
              stroke="color-mix(in oklab, currentColor 12%, transparent)" />
            <circle
              cx="36" cy="36" r={R} fill="none" strokeWidth="6"
              stroke={complete ? MINT : "var(--primary)"}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 300ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {complete ? (
              <Check className="size-6" style={{ color: MINT }} strokeWidth={3} />
            ) : (
              <>
                <span className="text-sm font-display font-bold leading-none tabular-nums">
                  {todayProgress.logged}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  of {todayProgress.total}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block max-w-[90px]">
          {complete
            ? "All doses logged for today"
            : `${todayProgress.logged} of ${todayProgress.total} doses logged today`}
        </div>
      </div>
    </div>
  );
}
