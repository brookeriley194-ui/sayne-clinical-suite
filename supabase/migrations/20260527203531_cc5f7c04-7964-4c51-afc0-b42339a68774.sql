ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS time_of_day text NOT NULL DEFAULT 'AM',
  ADD COLUMN IF NOT EXISTS fasted boolean NOT NULL DEFAULT false;

ALTER TABLE public.vials
  ADD COLUMN IF NOT EXISTS default_dose numeric,
  ADD COLUMN IF NOT EXISTS default_dose_unit text;