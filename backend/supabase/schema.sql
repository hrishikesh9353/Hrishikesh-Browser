create table if not exists public.browser_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hrx_ai_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 5000),
  model text,
  created_at timestamptz not null default now()
);

create index if not exists hrx_ai_messages_user_created_idx
  on public.hrx_ai_messages (user_id, created_at desc);

create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  title text not null check (char_length(title) <= 120),
  message text not null check (char_length(message) <= 5000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_created_idx
  on public.support_tickets (created_at desc);

alter table public.browser_profiles enable row level security;
alter table public.hrx_ai_messages enable row level security;
alter table public.support_tickets enable row level security;

revoke all on public.browser_profiles from anon, authenticated;
revoke all on public.hrx_ai_messages from anon, authenticated;
revoke all on public.support_tickets from anon, authenticated;
