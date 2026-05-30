import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
  streak_freeze_used: boolean;
  milestones_celebrated: number[];
  sound_enabled: boolean;
  notifications_config: Record<string, string>;
};

export const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Status interpretation used by the UI.
// "active"   = streak > 0 and last log was today
// "at_risk"  = streak > 0 but last log was yesterday (today not logged) — soft yellow nudge
// "fresh"    = no streak yet
// "idle"     = streak > 0 and last log was today + already used freeze info just informational
export function getStreakStatus(row: StreakRow | null): "active" | "at_risk" | "fresh" {
  if (!row || row.current_streak === 0) return "fresh";
  if (row.last_logged_date === todayStr()) return "active";
  // freeze in use OR last log was yesterday — show at_risk to nudge gently
  if (row.streak_freeze_used) return "at_risk";
  // last_logged_date is today already handled; otherwise treat as at_risk too
  return "at_risk";
}

export function getEncouragement(streak: number): string {
  if (streak <= 0) return "Log a dose today to start your streak";
  if (streak < 7) return "You're building momentum";
  if (streak < 30) return "You're on a roll — keep it going";
  return "Incredible consistency";
}

export function useStreak() {
  const [row, setRow] = useState<StreakRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const userIdRef = useRef<string | null>(null);

  const recalc = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    userIdRef.current = u.user.id;
    const { data, error } = await supabase.rpc("recalc_streak", { _user_id: u.user.id });
    if (error) { setLoading(false); return; }
    const next = data as unknown as StreakRow;
    setRow((prev) => {
      // Milestone trigger: streak just crossed a milestone we haven't celebrated.
      if (next && STREAK_MILESTONES.includes(next.current_streak as 7 | 14 | 30 | 60 | 100)) {
        const already = new Set(next.milestones_celebrated ?? []);
        if (!already.has(next.current_streak)) {
          // Only celebrate on the day it crosses (avoid re-firing on reload of same row).
          const justIncremented = !prev || prev.current_streak < next.current_streak;
          if (justIncremented) setCelebrate(next.current_streak);
        }
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => { recalc(); }, [recalc]);

  const acknowledgeMilestone = useCallback(async (n: number) => {
    setCelebrate(null);
    if (!userIdRef.current) return;
    const merged = Array.from(new Set([...(row?.milestones_celebrated ?? []), n]));
    await supabase
      .from("user_streaks")
      .update({ milestones_celebrated: merged })
      .eq("user_id", userIdRef.current);
    setRow((r) => (r ? { ...r, milestones_celebrated: merged } : r));
  }, [row]);

  return { row, loading, recalc, celebrate, acknowledgeMilestone };
}
