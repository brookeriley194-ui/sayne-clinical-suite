
CREATE TABLE public.patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  patient_name text NOT NULL,
  patient_email text,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_links_token ON public.patient_links(token);
CREATE INDEX idx_patient_links_doctor ON public.patient_links(doctor_id);

GRANT SELECT ON public.patient_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_links TO authenticated;
GRANT ALL ON public.patient_links TO service_role;

ALTER TABLE public.patient_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own patient links"
  ON public.patient_links FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors insert own patient links"
  ON public.patient_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id AND has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors update own patient links"
  ON public.patient_links FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors delete own patient links"
  ON public.patient_links FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);

-- Public can look up a link by token (token itself is the secret)
CREATE POLICY "Public can read patient links by token"
  ON public.patient_links FOR SELECT TO anon
  USING (true);
