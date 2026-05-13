
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL,
  group_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE UNIQUE,
  time_seconds NUMERIC NOT NULL DEFAULT 0,
  red_line_hits INTEGER NOT NULL DEFAULT 0,
  technical_score NUMERIC NOT NULL DEFAULT 0,
  design_score NUMERIC NOT NULL DEFAULT 0,
  control_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "public insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "public update participants" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "public delete participants" ON public.participants FOR DELETE USING (true);

CREATE POLICY "public read evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "public insert evaluations" ON public.evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "public update evaluations" ON public.evaluations FOR UPDATE USING (true);
CREATE POLICY "public delete evaluations" ON public.evaluations FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
