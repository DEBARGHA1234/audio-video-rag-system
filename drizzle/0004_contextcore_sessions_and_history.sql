-- Applied through the authorized Supabase connector.
-- Additive session context, history, gradual forgetting, and query linkage.

create table if not exists public.chat_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null default 'Untitled session',
  status text not null default 'active' check (status in ('active', 'archived', 'forgotten')),
  context_mode text not null default 'session' check (context_mode in ('session', 'workspace')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  context_expires_at timestamptz,
  forgotten_at timestamptz,
  message_count integer not null default 0,
  document_count integer not null default 0,
  is_demo boolean not null default false
);

create index if not exists chat_sessions_workspace_activity_idx on public.chat_sessions(workspace_id, last_active_at desc);
create index if not exists chat_sessions_expiry_idx on public.chat_sessions(context_expires_at) where context_expires_at is not null;

create table if not exists public.session_documents (
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  added_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  retain_until timestamptz,
  forgotten_at timestamptz,
  is_video boolean not null default false,
  is_demo boolean not null default false,
  primary key (session_id, document_id)
);

create index if not exists session_documents_document_idx on public.session_documents(document_id);
create index if not exists session_documents_retention_idx on public.session_documents(retain_until) where retain_until is not null;

create table if not exists public.session_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  forgotten_at timestamptz,
  is_forgotten boolean not null default false,
  is_demo boolean not null default false
);

create index if not exists session_messages_session_created_idx on public.session_messages(session_id, created_at desc);
create index if not exists session_messages_expiry_idx on public.session_messages(expires_at) where expires_at is not null;

alter table public.queries add column if not exists session_id uuid references public.chat_sessions(id) on delete set null;
create index if not exists queries_session_idx on public.queries(session_id, created_at desc);

alter table public.chat_sessions enable row level security;
alter table public.session_documents enable row level security;
alter table public.session_messages enable row level security;

drop policy if exists chat_sessions_deny_public on public.chat_sessions;
create policy chat_sessions_deny_public on public.chat_sessions for all to public using (false) with check (false);
drop policy if exists session_documents_deny_public on public.session_documents;
create policy session_documents_deny_public on public.session_documents for all to public using (false) with check (false);
drop policy if exists session_messages_deny_public on public.session_messages;
create policy session_messages_deny_public on public.session_messages for all to public using (false) with check (false);
