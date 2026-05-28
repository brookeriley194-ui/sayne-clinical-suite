
DROP POLICY IF EXISTS "Authenticated can update import counter" ON public.shared_stacks;

CREATE POLICY "Users update own shared stacks"
  ON public.shared_stacks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_shared_stack_import(_stack_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_stacks
  SET import_count = import_count + 1
  WHERE id = _stack_id
  RETURNING import_count;
$$;

REVOKE ALL ON FUNCTION public.increment_shared_stack_import(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_shared_stack_import(uuid) TO authenticated;
