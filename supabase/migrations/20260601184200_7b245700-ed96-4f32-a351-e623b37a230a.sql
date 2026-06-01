CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _terms_accepted boolean;
  _terms_version text;
BEGIN
  _terms_accepted := COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false);
  _terms_version := NEW.raw_user_meta_data->>'terms_version';

  INSERT INTO public.profiles (id, email, terms_accepted, terms_accepted_at, terms_version)
  VALUES (
    NEW.id,
    NEW.email,
    _terms_accepted,
    CASE WHEN _terms_accepted THEN now() ELSE NULL END,
    _terms_version
  );

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'doctor'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;