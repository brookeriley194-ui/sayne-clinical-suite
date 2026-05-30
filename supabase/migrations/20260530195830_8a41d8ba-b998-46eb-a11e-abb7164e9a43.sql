-- Streak / momentum table
CREATE TABLE public.user_streaks (
  user_id uuid NOT NULL PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_logged_date date,
  streak_freeze_used boolean NOT NULL DEFAULT false,
  milestones_celebrated integer[] NOT NULL DEFAULT '{}',
  sound_enabled boolean NOT NULL DEFAULT false,
  notifications_config jsonb NOT NULL DEFAULT jsonb_build_object(
    'evening_reminder', 'You have doses left to log today — keep your streak alive',
    'streak_at_risk',   'Your {n} day streak is at risk. Log a dose to keep it going.',
    'milestone_near',   'One more day to hit your {n} day streak'
  ),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own streak" ON public.user_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own streak" ON public.user_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own streak" ON public.user_streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own streak" ON public.user_streaks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_streaks_updated
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Server-side streak recalculation.
-- Logic:
--   * Gather distinct dose_date values for the user.
--   * "today" counts; "yesterday" counts (no penalty yet).
--   * Walk backwards day-by-day counting consecutive logged days.
--   * Allow exactly ONE gap day (the streak freeze).
--   * Two consecutive missed days => streak resets to 0.
CREATE OR REPLACE FUNCTION public.recalc_streak(_user_id uuid)
RETURNS public.user_streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() at time zone 'utc')::date;
  _cursor date;
  _streak integer := 0;
  _freeze_used boolean := false;
  _last date;
  _row public.user_streaks;
  _logged boolean;
BEGIN
  SELECT max(dose_date) INTO _last
    FROM public.stack_doses
    WHERE doctor_id = _user_id;

  IF _last IS NULL THEN
    INSERT INTO public.user_streaks(user_id) VALUES (_user_id)
      ON CONFLICT (user_id) DO UPDATE
        SET current_streak = 0, last_logged_date = NULL, streak_freeze_used = false
      RETURNING * INTO _row;
    RETURN _row;
  END IF;

  -- Determine starting cursor: if last log is today or yesterday, start from today
  -- and walk back. Otherwise streak is broken (>= 2 days gap).
  IF _last >= _today - 1 THEN
    _cursor := _today;
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM public.stack_doses
        WHERE doctor_id = _user_id AND dose_date = _cursor
      ) INTO _logged;

      IF _logged THEN
        _streak := _streak + 1;
        _cursor := _cursor - 1;
      ELSE
        -- Allow the gap only if it's not today (today not yet logged is fine — no penalty)
        -- and only one freeze allowed total
        IF _cursor = _today THEN
          _cursor := _cursor - 1;
          CONTINUE;
        END IF;
        IF NOT _freeze_used THEN
          _freeze_used := true;
          _cursor := _cursor - 1;
        ELSE
          EXIT;
        END IF;
      END IF;
      EXIT WHEN _streak > 3650; -- safety
    END LOOP;
  ELSE
    _streak := 0;
    _freeze_used := false;
  END IF;

  INSERT INTO public.user_streaks(user_id, current_streak, longest_streak, last_logged_date, streak_freeze_used)
    VALUES (_user_id, _streak, _streak, _last, _freeze_used)
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak = EXCLUDED.current_streak,
          longest_streak = GREATEST(public.user_streaks.longest_streak, EXCLUDED.current_streak),
          last_logged_date = EXCLUDED.last_logged_date,
          streak_freeze_used = EXCLUDED.streak_freeze_used
    RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_streak(uuid) TO authenticated;
