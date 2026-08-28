-- 1) Patient links: remove blanket anonymous read (edge function uses service role)
DROP POLICY IF EXISTS "Public can read patient links by token" ON public.patient_links;
REVOKE SELECT ON public.patient_links FROM anon;

-- 2) Shared stacks: hide owner identity; expose anonymized feed via view
DROP POLICY IF EXISTS "Authenticated can view shared stacks" ON public.shared_stacks;

CREATE POLICY "Users view own shared stacks"
  ON public.shared_stacks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.shared_stacks_feed
WITH (security_invoker = off) AS
SELECT id, protocol_id, compound, dose_mcg, dose_unit, frequency, route,
       duration_days, avg_energy, avg_sleep, avg_recovery, avg_mood,
       overall_score, goal_tags, summary, import_count, anonymous_id, created_at
FROM public.shared_stacks;

REVOKE ALL ON public.shared_stacks_feed FROM PUBLIC, anon;
GRANT SELECT ON public.shared_stacks_feed TO authenticated;
GRANT ALL ON public.shared_stacks_feed TO service_role;