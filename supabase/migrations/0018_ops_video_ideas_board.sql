-- Video ideas replaces the Creator & UGC board.
--
-- The founders want somewhere to drop video ideas the moment they have them
-- and move them along as they get made. The creator-outreach board was never
-- used; it goes, with its fields and any items (cascade). Re-runnable.

insert into public.ops_boards (id, module, name, description, stages, position) values
('ideas','marketing_outreach','Video ideas',
  'Ideas for videos, dropped in as they come. Move each one along as it gets made.',
  array['Idea','Worth doing','Scripted','Filmed','Edited','Posted','Binned'],4)
on conflict (id) do update set
  module = excluded.module,
  name = excluded.name,
  description = excluded.description,
  stages = excluded.stages,
  position = excluded.position;

insert into public.ops_fields (board_id, key, label, type, options, required, is_sensitive, note, position) values
('ideas','title','Title','text',null,true,false,'A few words is enough.',1),
('ideas','hook','The idea','longtext',null,false,false,'What happens, and the hook in the first second.',2),
('ideas','format','Format','select','["Short","Long","Story","Carousel","Live"]',false,false,null,3),
('ideas','platform','Platform','select','["TikTok","Instagram","YouTube","LinkedIn","All"]',false,false,null,4),
('ideas','stage','Stage','stage',null,true,false,null,5),
('ideas','post_by','Post by','date',null,false,false,null,6),
('ideas','posted_url','Posted link','url',null,false,false,'Where it went up.',7),
('ideas','owner','Owner','founder_ref',null,false,false,null,8),
('ideas','notes','Notes','longtext',null,false,false,null,9)
on conflict (board_id, key) do update set
  label = excluded.label,
  type = excluded.type,
  options = excluded.options,
  required = excluded.required,
  is_sensitive = excluded.is_sensitive,
  note = excluded.note,
  position = excluded.position;

delete from public.ops_boards where id = 'creators';
