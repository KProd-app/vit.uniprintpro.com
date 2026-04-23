-- 1. Create Ink Logs Table
CREATE TABLE public.ink_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    printer_id UUID NOT NULL REFERENCES public.printers(id) ON DELETE CASCADE,
    printer_name TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'STARTED_BOTTLE', 'NEW_BOTTLE', 'ADDED_INVENTORY'
    quantity_change INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for ink_logs
ALTER TABLE public.ink_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert ink logs" ON public.ink_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to read logs
CREATE POLICY "Allow authenticated users to read ink logs" ON public.ink_logs
    FOR SELECT USING (auth.role() = 'authenticated');


-- 2. Create App Settings Table
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings" ON public.app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only authenticated users to update/insert settings (can be restricted further later)
CREATE POLICY "Allow authenticated users to modify settings" ON public.app_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default ink tool QR code setting
INSERT INTO public.app_settings (key, value) VALUES ('inkToolQrCode', '"INK_TOOL_123"'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- 3. Create Ink Photos Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ink-photos', 'ink-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for ink-photos bucket (Allow public read, allow authenticated upload)
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'ink-photos');

CREATE POLICY "Authenticated users can upload ink photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ink-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their ink photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'ink-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ink photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'ink-photos' AND auth.role() = 'authenticated');
