
ALTER TABLE public.stacks
  ADD COLUMN IF NOT EXISTS dose numeric,
  ADD COLUMN IF NOT EXISTS dose_unit text NOT NULL DEFAULT 'mg',
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily';

CREATE TABLE IF NOT EXISTS public.stack_doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  stack_id uuid NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  dose_date date NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stack_id, dose_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stack_doses TO authenticated;
GRANT ALL ON public.stack_doses TO service_role;

ALTER TABLE public.stack_doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own stack doses" ON public.stack_doses
  FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors insert own stack doses" ON public.stack_doses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors update own stack doses" ON public.stack_doses
  FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors delete own stack doses" ON public.stack_doses
  FOR DELETE TO authenticated USING (auth.uid() = doctor_id);

CREATE INDEX IF NOT EXISTS idx_stack_doses_doctor_date ON public.stack_doses(doctor_id, dose_date);
