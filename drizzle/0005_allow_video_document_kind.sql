-- Applied through the authorized Supabase connector.
-- The application already supports VIDEO media sources; align the database check constraint.

alter table public.documents drop constraint if exists documents_kind_check;
alter table public.documents add constraint documents_kind_check check (kind = any (array['PDF','DOCX','MD','CSV','JSON','URL','TXT','AUDIO','VIDEO']));
