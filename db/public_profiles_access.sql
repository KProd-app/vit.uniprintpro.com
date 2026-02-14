-- Allow public read access strictly for login purposes (to find user by name)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

create policy "Public profiles are viewable by everyone."
on public.profiles for select
using (true);

-- Ensure admins can delete/update any profile
drop policy if exists "Users can update own profile." on public.profiles;

create policy "Admins can update all profiles."
on public.profiles for all
using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Users can still update their own profile (e.g. change PIN)
create policy "Users can update own profile."
on public.profiles for update
using (auth.uid() = id);
