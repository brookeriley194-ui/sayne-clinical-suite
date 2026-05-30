REVOKE EXECUTE ON FUNCTION public.recalc_streak(uuid) FROM PUBLIC, anon;

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
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

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
      EXIT WHEN _streak > 3650;
    END LOOP;
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