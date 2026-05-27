CREATE TABLE public.vials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  compound text NOT NULL,
  vial_size_mg numeric NOT NULL,
  bac_water_ml numeric,
  concentration_mg_per_ml numeric,
  reconstituted_at timestamptz,
  status text NOT NULL DEFAULT 'sealed',
  lot_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vials TO authenticated;
GRANT ALL ON public.vials TO service_role;

ALTER TABLE public.vials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own vials" ON public.vials FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors insert own vials" ON public.vials FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors update own vials" ON public.vials FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors delete own vials" ON public.vials FOR DELETE TO authenticated USING (auth.uid() = doctor_id);

CREATE TRIGGER update_vials_updated_at
BEFORE UPDATE ON public.vials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();