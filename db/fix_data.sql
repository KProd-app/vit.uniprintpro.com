-- 1. DELETE EXISTING DATA (Clean slate to match constants)
truncate table public.printers cascade;

-- 2. INSERT CORRECT PRINTERS (Matching src/constants.tsx)
insert into public.printers (name, type, status, config, state) values
('Kingt', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Dlican', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Dlican360', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Flora1', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Flora2', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Dacen(Thumbler)', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Dacen(Bottle)', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Amica', 'VIT', 'Laukia paruošimo', '{"isMimaki": false}', '{"maintenanceDone": false, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}'),
('Mimaki', 'MIMAKI', 'Laukia paruošimo', '{"isMimaki": true}', '{"maintenanceDone": false, "selectedMimakiUnits": [], "mimakiNozzleFiles": {}, "vit": {"checklist": {}, "confirmed": false, "notes": "", "shift": "", "signature": ""}}');
