-- Markup fields for document comments / pins / strokes
alter table public.document_annotations add column if not exists page_number int;
alter table public.document_annotations add column if not exists x_pct numeric;
alter table public.document_annotations add column if not exists y_pct numeric;
alter table public.document_annotations add column if not exists kind text not null default 'comment';
alter table public.document_annotations add column if not exists payload jsonb;
