-- Allow public read access (so everyone can view the images)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'nozzle-checks' );

-- Allow authenticated upload (so workers can upload)
create policy "Worker Upload Access"
on storage.objects for insert
with check (
  bucket_id = 'nozzle-checks' 
  and auth.role() = 'authenticated'
);
