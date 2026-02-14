-- Create the printer_logs table
create table public.printer_logs (
  id uuid default gen_random_uuid() primary key,
  printer_id text not null, -- using text to match local IDs, or uuid if you strictly use supabase uuids. Let's use text for flexibility with current setup.
  printer_name text not null,
  shift text not null,
  operator_name text not null,
  date date default current_date,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  production_amount int default 0,
  defects_amount int default 0,
  vit_data jsonb,
  nozzle_data jsonb,
  next_operator_message text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.printer_logs enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
on public.printer_logs for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on public.printer_logs for insert
to authenticated
with check (true);
