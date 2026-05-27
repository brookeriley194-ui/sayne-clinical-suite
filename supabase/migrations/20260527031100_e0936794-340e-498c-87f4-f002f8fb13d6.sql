CREATE TABLE public.stacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  peptide_name TEXT NOT NULL,
  vial_id UUID REFERENCES public.vials(id) ON DELETE SET NULL,
  reconstituted_at TIMESTAMPTZ,
  time_of_day TEXT NOT NULL DEFAULT 'AM',
  fasted BOOLEAN NOT NULL DEFAULT false,
  cycle_length_days INTEGER NOT NULL DEFAULT 30,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stacks TO authenticated;
GRANT ALL ON public.stacks TO service_role;

ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own stacks" ON public.stacks FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors insert own stacks" ON public.stacks FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors update own stacks" ON public.stacks FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors delete own stacks" ON public.stacks FOR DELETE TO authenticated USING (auth.uid() = doctor_id);

CREATE TRIGGER update_stacks_updated_at BEFORE UPDATE ON public.stacks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();