-- Lentelių sukūrimas TV ekranams

CREATE TABLE IF NOT EXISTS public.tv_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_reported TEXT,
    problem TEXT,
    solution TEXT,
    responsible TEXT,
    status TEXT DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS public.tv_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scanned_by TEXT,
    product_info TEXT,
    photo_url TEXT
);

CREATE TABLE IF NOT EXISTS public.tv_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_by TEXT,
    proposal_text TEXT
);

CREATE TABLE IF NOT EXISTS public.tv_metrics (
    id TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikų įgalinimas visiems skaityti (TV ekranui)
ALTER TABLE public.tv_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on problems" ON public.tv_problems FOR SELECT USING (true);

ALTER TABLE public.tv_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on transfers" ON public.tv_transfers FOR SELECT USING (true);

ALTER TABLE public.tv_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on proposals" ON public.tv_proposals FOR SELECT USING (true);

ALTER TABLE public.tv_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on metrics" ON public.tv_metrics FOR SELECT USING (true);

-- Galimybė autentifikuotiems vartotojams atlikti visus veiksmus (Admin GUI)
CREATE POLICY "Enable ALL for authenticated users on problems" ON public.tv_problems FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on transfers" ON public.tv_transfers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on proposals" ON public.tv_proposals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on metrics" ON public.tv_metrics FOR ALL USING (auth.role() = 'authenticated');


-- Pradinių reikšmių įterpimas, kad TV ekranas neturštėtų błankaus lango
INSERT INTO public.tv_metrics (id, value) VALUES ('breakdowns_count', '0') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tv_metrics (id, value) VALUES ('defects_count', '0') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tv_metrics (id, value) VALUES ('quality_info', 'KOKYBĖS SKYRIAUS INFORMACIJA NĖRA.') ON CONFLICT (id) DO NOTHING;
