CREATE TABLE public.agent_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New analysis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_threads TO authenticated;
GRANT ALL ON public.agent_threads TO service_role;
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own threads" ON public.agent_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX agent_threads_user_idx ON public.agent_threads (user_id, updated_at DESC);

CREATE TABLE public.agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL,
  sdk_message_id TEXT,
  parts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own agent messages" ON public.agent_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX agent_messages_thread_idx ON public.agent_messages (thread_id, created_at);

CREATE TABLE public.agent_usage (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  turns INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);
GRANT SELECT ON public.agent_usage TO authenticated;
GRANT ALL ON public.agent_usage TO service_role;
ALTER TABLE public.agent_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own agent usage" ON public.agent_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.agent_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  digest_date DATE NOT NULL,
  category TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (digest_date, category)
);
GRANT SELECT ON public.agent_digests TO anon, authenticated;
GRANT ALL ON public.agent_digests TO service_role;
ALTER TABLE public.agent_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Digests are public to read" ON public.agent_digests FOR SELECT TO anon, authenticated USING (true);