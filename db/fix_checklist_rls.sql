-- Enable full access to checklist_templates for now to unblock Admin
-- (Ideally we would restrict to authenticated users or admins later)

create policy "Allow public insert templates" 
on public.checklist_templates 
for insert 
with check (true);

create policy "Allow public update templates" 
on public.checklist_templates 
for update 
using (true);

create policy "Allow public delete templates" 
on public.checklist_templates 
for delete 
using (true);
