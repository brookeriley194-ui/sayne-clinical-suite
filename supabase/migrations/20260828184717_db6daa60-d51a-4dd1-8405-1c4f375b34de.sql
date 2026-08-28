-- Replace the definer view with an invoker view + column-level protection
DROP VIEW IF EXISTS public.shared_stacks_feed;

CREATE VIEW public.shared_stacks_feed
WITH (security_invoker = on) AS
SELECT id, protocol_id, compound, dose_mcg, dose_unit, frequency, route,
       duration_days, avg_energy, avg_sleep, avg_recovery, avg_mood,
       overall_score, goal_tags, summary, import_count, anonymous_id, created_at
FROM public.shared_stacks;

REVOKE ALL ON public.shared_stacks_feed FROM PUBLIC, anon;
GRANT SELECT ON public.shared_stacks_feed TO authenticated;
GRANT ALL ON public.shared_stacks_feed TO service_role;

-- Feed rows are intentionally shared with the signed-in community, but the
-- owning account id is never readable: column-level grants exclude user_id.
CREATE POLICY "Authenticated can view anonymized shared stacks"
  ON public.shared_stacks FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.shared_stacks FROM authenticated;
GRANT SELECT (id, protocol_id, compound, dose_mcg, dose_unit, frequency, route,
              duration_days, avg_energy, avg_sleep, avg_recovery, avg_mood,
              overall_score, goal_tags, summary, import_count, anonymous_id, created_at)
  ON public.shared_stacks TO authenticated;