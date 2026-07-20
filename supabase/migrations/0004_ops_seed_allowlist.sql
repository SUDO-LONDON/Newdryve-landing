-- Newdryve Ops Portal — founder allowlist seed
-- IMPORTANT: these emails MUST match the OPS_FOUNDER_ALLOWLIST env var used by
-- the middleware. Replace the placeholder addresses below with the founders'
-- real email addresses before going live, then keep both in sync.
insert into public.ops_allowlist (email, name, role) values
  ('sinan@newdryve.com',   'Sinan Guckiran',    'CEO'),
  ('deniz@newdryve.com',   'Deniz Cem Dogan',   'CTO'),
  ('jed@newdryve.com',     'Jed Sam',           'CPO'),
  ('kurtish@newdryve.com', 'Kurtish Mistry',    'CCO')
on conflict (email) do update set
  name = excluded.name, role = excluded.role;
