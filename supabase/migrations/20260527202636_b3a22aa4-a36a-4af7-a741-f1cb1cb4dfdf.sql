GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

DROP POLICY IF EXISTS "Doctors insert own protocols" ON public.protocols;
CREATE POLICY "Users insert own protocols" ON public.protocols
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);