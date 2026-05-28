
CREATE TABLE public.shared_stacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL,
  user_id uuid NOT NULL,
  compound text NOT NULL,
  dose_mcg numeric NOT NULL,
  dose_unit text NOT NULL,
  frequency text NOT NULL,
  route text NOT NULL,
  duration_days integer,
  avg_energy numeric,
  avg_sleep numeric,
  avg_recovery numeric,
  avg_mood numeric,
  overall_score numeric,
  goal_tags text[] DEFAULT '{}'::text[],
  summary text,
  import_count integer NOT NULL DEFAULT 0,
  anonymous_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_stacks TO authenticated;
GRANT ALL ON public.shared_stacks TO service_role;

ALTER TABLE public.shared_stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view shared stacks"
  ON public.shared_stacks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own shared stacks"
  ON public.shared_stacks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can update import counter"
  ON public.shared_stacks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users delete own shared stacks"
  ON public.shared_stacks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX shared_stacks_created_at_idx ON public.shared_stacks (created_at DESC);
CREATE INDEX shared_stacks_compound_idx ON public.shared_stacks (compound);
