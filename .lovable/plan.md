## Streak & Momentum System + Satisfying Check-Off

A big retention feature with two parts: streak/momentum mechanics, and a delightful dose check-off micro-interaction. Here's the plan.

---

### Part 1 — Streak data layer

**New table `user_streaks`** (one row per user) with:
- `current_streak`, `longest_streak`, `last_logged_date`, `streak_freeze_used`, `milestones_celebrated` (int[] of milestones already shown), `sound_enabled` (bool, default false), `notifications_config` (jsonb with the 3 message templates).

RLS: user can read/write only their own row.

**Server-side streak calculation**: a Postgres function `public.recalc_streak(_user_id uuid)` that:
- Reads distinct `dose_date`s from `stack_doses` for the user.
- Walks backwards from today: today or yesterday counts as active.
- One missed day → keep streak, mark `streak_freeze_used = true`, status = "at_risk".
- Two consecutive missed days → reset to 0.
- Updates `current_streak`, `longest_streak`, `last_logged_date`.
- Returns the updated row.

Called from client right after a dose is logged or unlogged.

---

### Part 2 — Today dashboard streak UI

New component `StreakCard` placed at the very top of `/dashboard/today`:

```
┌────────────────────────────────────────────────┐
│  🔥  14         ● ● ● ● ● ○ ◉  ← 7-day ring   │
│      day streak    M T W T F S S               │
│      You're on a roll — keep it going          │
└────────────────────────────────────────────────┘
```

- Flame icon (Lucide `Flame`) in soft yellow (`#F5C97A`).
- Number in Syne Bold, large.
- Encouragement copy switches on streak length (0 / 1–6 / 7–29 / 30+).
- "Streak at risk" pill in soft yellow when `streak_freeze_used && last_logged_date < today`.
- 7-day ring: small dots, last 7 days. Filled mint (`#A8D5BA`) if a dose was logged that day. Today pulses (`animate-pulse`).

**Daily progress ring** (separate small card or inline): "3 of 5 doses logged today" with an SVG ring that animates with `stroke-dashoffset` transitions. On hitting full → soft mint check + "All doses logged for today" toast and streak counter pulses.

---

### Part 3 — Milestone celebrations

`MilestoneCelebration` overlay component:
- Triggers when `current_streak` ∈ {7, 14, 30, 60, 100} AND not in `milestones_celebrated`.
- Full-screen soft backdrop, confetti via tiny in-house particle component (CSS-keyframed divs in lavender / mint / soft yellow — no heavy lib).
- Message: "{N} day streak! You're building a real habit."
- "Keep going" button → appends milestone to `milestones_celebrated`.

---

### Part 4 — Satisfying check-off interaction

Refactor `DosePill` in `src/components/dose-shared.tsx`:

- Replace the current checkbox with a custom button that animates on toggle:
  - Spring fill via `transition: transform 350ms cubic-bezier(.34,1.56,.64,1)` (overshoot).
  - SVG checkmark with `stroke-dasharray` draw-in (200ms).
  - Fill color = compound accent (`colorFor(stack.id)`).
  - Particle burst: 6 small dots animated outward via CSS keyframes, 400ms, then fade.
  - Row strikethrough animates left→right using a pseudo-element with `width: 0 → 100%`.
  - Row scale pulse 1 → 1.03 → 1.
- Haptic: `navigator.vibrate?.(15)` on check, `vibrate(8)` on uncheck.
- Floating "-1 dose · {compound}" indicator: absolutely positioned span that fades up & out (translate-y from 0 → -20px, opacity 1 → 0, 900ms).
- Optional completion sound (Web Audio `AudioContext` short sine blip) when `sound_enabled = true`.
- Undo: tapping a checked pill reverses cleanly — same animations played in reverse, no toast.

After each toggle: call `recalc_streak` server fn, refresh streak state, check for milestone trigger.

---

### Part 5 — Notification templates

Stored in `user_streaks.notifications_config` JSON:

```json
{
  "evening_reminder": "You have doses left to log today — keep your streak alive",
  "streak_at_risk":   "Your {n} day streak is at risk. Log a dose to keep it going.",
  "milestone_near":   "One more day to hit your {n} day streak"
}
```

Seeded by trigger on row insert. No delivery wiring this round — templates only.

---

### Part 6 — Settings

Add to `/dashboard/settings`:
- Toggle: "Completion sound" (writes `sound_enabled`).

---

### Technical notes

**Files touched:**
- New migration: `user_streaks` table + `recalc_streak` SQL function + RLS + grants.
- New `src/components/streak-card.tsx` (streak + 7-day ring + daily progress ring).
- New `src/components/milestone-celebration.tsx` (overlay + particles).
- New `src/hooks/use-streak.ts` (load + recalc + milestone trigger + sound pref).
- Edit `src/components/dose-shared.tsx` → custom `DosePill` with full micro-interaction.
- Edit `src/routes/dashboard/today.tsx` → mount `StreakCard` at top, mount `MilestoneCelebration`, wire streak refresh on dose toggle.
- Edit `src/routes/dashboard/settings.tsx` → completion sound toggle.
- `src/styles.css` → keyframes for particle burst, strike-through draw, pulse.

**Design system:**
- Flame = soft yellow `#F5C97A`. Ring fill = mint `#A8D5BA`. Confetti = lavender / mint / soft yellow trio (existing Sayne accents). All copy in Syne / Inter as currently used.
- Animations strictly transform/opacity for 60fps.

**Tone guardrail honored:** no shame copy, no health framing, "at risk" stays soft.

Confirm and I'll implement.
