ALTER TABLE public.stack_doses ADD COLUMN period text NOT NULL DEFAULT 'AM';

-- Update the unique constraint to include period
ALTER TABLE public.stack_doses DROP CONSTRAINT IF EXISTS stack_doses_stack_id_dose_date_key;
ALTER TABLE public.stack_doses ADD CONSTRAINT stack_doses_stack_id_dose_date_period_key UNIQUE (stack_id, dose_date, period);