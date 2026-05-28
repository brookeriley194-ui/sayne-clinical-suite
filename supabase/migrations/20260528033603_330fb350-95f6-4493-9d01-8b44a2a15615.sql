CREATE TABLE public.protocol_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 1 AND 10),
  recovery_score INTEGER CHECK (recovery_score BETWEEN 1 AND 10),
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  notes TEXT,
  anonymous_pool BOOLEAN NOT NULL DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_user_protocol ON public.protocol_journal_entries(user_id, protocol_id);
CREATE UNIQUE INDEX idx_journal_unique_week ON public.protocol_journal_entries(user_id, protocol_id, week_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocol_journal_entries TO authenticated;
GRANT ALL ON public.protocol_journal_entries TO service_role;

ALTER TABLE public.protocol_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own journal entries"
ON public.protocol_journal_entries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own journal entries"
ON public.protocol_journal_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own journal entries"
ON public.protocol_journal_entries FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own journal entries"
ON public.protocol_journal_entries FOR DELETE TO authenticated
USING (auth.uid() = user_id);