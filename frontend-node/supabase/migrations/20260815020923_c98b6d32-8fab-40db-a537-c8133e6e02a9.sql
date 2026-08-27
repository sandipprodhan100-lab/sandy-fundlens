CREATE TABLE public.fund_aum_snapshots (
  scheme_code integer NOT NULL,
  as_of date NOT NULL,
  aum_crore numeric NOT NULL,
  nav numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scheme_code, as_of)
);
GRANT SELECT ON public.fund_aum_snapshots TO anon;
GRANT SELECT ON public.fund_aum_snapshots TO authenticated;
GRANT ALL ON public.fund_aum_snapshots TO service_role;
ALTER TABLE public.fund_aum_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fund size history is public" ON public.fund_aum_snapshots FOR SELECT USING (true);
CREATE INDEX fund_aum_snapshots_as_of_idx ON public.fund_aum_snapshots (as_of);