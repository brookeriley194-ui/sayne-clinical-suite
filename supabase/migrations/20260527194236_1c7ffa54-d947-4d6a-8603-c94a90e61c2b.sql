ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS vial_id uuid REFERENCES public.vials(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_vial_id ON public.protocols(vial_id);