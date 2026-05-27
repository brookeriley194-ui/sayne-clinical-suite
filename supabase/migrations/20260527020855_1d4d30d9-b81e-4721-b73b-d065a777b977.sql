CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  name TEXT NOT NULL,
  compound TEXT NOT NULL,
  dose NUMERIC NOT NULL,
  dose_unit TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT NOT NULL,
  duration_days INTEGER,
  ongoing BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocols TO authenticated;
GRANT ALL ON public.protocols TO service_role;

ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own protocols" ON public.protocols
  FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors insert own protocols" ON public.protocols
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors update own protocols" ON public.protocols
  FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors delete own protocols" ON public.protocols
  FOR DELETE TO authenticated USING (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_protocols_updated_at
BEFORE UPDATE ON public.protocols
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_protocols_doctor ON public.protocols(doctor_id, created_at DESC);