-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRINTERS TABLE
create table public.printers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null, -- 'MIMAKI' | 'VIT'
  status text not null default 'IDLE',
  config jsonb default '{}'::jsonb, -- Stores static config like nextOperatorMessage, warnings
  state jsonb default '{}'::jsonb, -- Stores dynamic state like maintenanceDone, nozzleFile
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CHECKLIST TEMPLATES TABLE (Dynamic Checklists)
create table public.checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  items jsonb not null default '[]'::jsonb, -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TRANSMISSIONS TABLE (Shift Handovers)
create table public.transmissions (
  id uuid primary key default uuid_generate_v4(),
  printer_id uuid references public.printers(id),
  shift text not null, -- 'Ryto' | 'Vakaro'
  signature text,
  checklist_data jsonb default '{}'::jsonb, -- Completed checklist items
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. INSERT DEFAULT PRINTERS (Based on current constants)
insert into public.printers (name, type, status, config, state) values
('MIMAKI 1', 'MIMAKI', 'IDLE', '{"isMimaki": true}', '{"maintenanceDone": false}'),
('MIMAKI 2', 'MIMAKI', 'IDLE', '{"isMimaki": true}', '{"maintenanceDone": false}'),
('MIMAKI 3', 'MIMAKI', 'IDLE', '{"isMimaki": true}', '{"maintenanceDone": false}'),
('MIMAKI 4', 'MIMAKI', 'IDLE', '{"isMimaki": true}', '{"maintenanceDone": false}'),
('STATION 1', 'VIT', 'IDLE', '{"isMimaki": false}', '{"maintenanceDone": false}'),
('STATION 2', 'VIT', 'IDLE', '{"isMimaki": false}', '{"maintenanceDone": false}');

-- 5. INSERT DEFAULT CHECKLIST TEMPLATE
insert into public.checklist_templates (name, items) values
('VIT Standard Checklist', '["Patikrinti rašalo lygius", "Nuvalyti galvutes", "Patikrinti atliekų talpą", "Nuvalyti stalą"]'::jsonb);

-- Enable Row Level Security (RLS) - Basic policies for now
alter table public.printers enable row level security;
create policy "Allow public read users" on public.printers for select using (true);
create policy "Allow public update users" on public.printers for update using (true); -- Ideally restrict this later

alter table public.checklist_templates enable row level security;
create policy "Allow public read templates" on public.checklist_templates for select using (true);

alter table public.transmissions enable row level security;
create policy "Allow public insert transmissions" on public.transmissions for insert with check (true);
