create table if not exists public.evaluation_daily (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  day date not null,
  context_precision numeric(8,6) not null,
  faithfulness numeric(8,6) not null,
  answer_relevancy numeric(8,6) not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, day)
);

create index if not exists evaluation_daily_workspace_day_idx
  on public.evaluation_daily (workspace_id, day desc);

alter table public.evaluation_daily enable row level security;

do $$
begin
  if exists (
    select 1
    from public.workspaces
    where id = '00000000-0000-0000-0000-000000000001'::uuid
  ) then
    insert into public.evaluation_daily (
      workspace_id,
      day,
      context_precision,
      faithfulness,
      answer_relevancy,
      is_demo
    )
    values
      ('00000000-0000-0000-0000-000000000001','2026-09-28',0.82,0.86,0.78,true),
      ('00000000-0000-0000-0000-000000000001','2026-09-29',0.84,0.87,0.80,true),
      ('00000000-0000-0000-0000-000000000001','2026-09-30',0.86,0.88,0.82,true),
      ('00000000-0000-0000-0000-000000000001','2026-10-01',0.87,0.89,0.83,true),
      ('00000000-0000-0000-0000-000000000001','2026-10-02',0.89,0.90,0.85,true),
      ('00000000-0000-0000-0000-000000000001','2026-10-03',0.90,0.91,0.87,true),
      ('00000000-0000-0000-0000-000000000001','2026-10-04',0.92,0.914,0.88,true)
    on conflict (workspace_id, day) do nothing;
  end if;
end
$$;
