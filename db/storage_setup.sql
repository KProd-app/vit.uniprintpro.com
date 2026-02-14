-- 1. Create the storage bucket
insert into storage.buckets (id, name, public)
values ('nozzle-checks', 'nozzle-checks', true);

-- 2. Enable RLS on objects (if not already enabled)
alter table storage.objects enable row level security;

-- 3. Create Policy: Allow public read access to all objects in this bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'nozzle-checks' );

-- 4. Create Policy: Allow authenticated users (workers/admins) to upload
create policy "Worker Upload Access"
on storage.objects for insert
with check (
  bucket_id = 'nozzle-checks' 
  and auth.role() = 'authenticated'
);

-- 5. Create Policy: Allow users to update/delete their own uploads (Optional, but good for cleanup)
create policy "Owner Update Access"
on storage.objects for update
using ( bucket_id = 'nozzle-checks' and auth.uid() = owner );

create policy "Owner Delete Access"
on storage.objects for delete
using ( bucket_id = 'nozzle-checks' and auth.uid() = owner );
