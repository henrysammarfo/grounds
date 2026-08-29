CREATE TABLE public.account_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  detail text,
  device text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.account_activity TO authenticated;
GRANT ALL ON public.account_activity TO service_role;
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activity" ON public.account_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can record their own activity" ON public.account_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX account_activity_user_created_idx ON public.account_activity (user_id, created_at DESC);