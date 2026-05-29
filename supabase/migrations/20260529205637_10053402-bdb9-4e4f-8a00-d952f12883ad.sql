ALTER PUBLICATION supabase_realtime ADD TABLE public.vials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.protocols;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stack_doses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stacks;
ALTER TABLE public.vials REPLICA IDENTITY FULL;
ALTER TABLE public.protocols REPLICA IDENTITY FULL;
ALTER TABLE public.stack_doses REPLICA IDENTITY FULL;
ALTER TABLE public.stacks REPLICA IDENTITY FULL;