CREATE TABLE public.analysis_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analysis_cache_expires_idx ON public.analysis_cache (expires_at);
GRANT ALL ON public.analysis_cache TO service_role;
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages analysis cache" ON public.analysis_cache FOR ALL TO service_role USING (true) WITH CHECK (true);