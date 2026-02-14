-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text default 'worker' check (role in ('admin', 'worker')),
  pin_code text, -- Optional: for quick access if we keep PIN flow, otherwise Supabase Auth password remains main
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'worker'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create an initial Admin user (optional helper, but usually manual sign up is better)
-- We will rely on manual sign up via the app or Supabase dashboard, then updating role to 'admin'.
