-- Eldoria: foundation schema. All player data is isolated by auth.uid().
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  ancestry text not null,
  class_name text not null,
  background text not null,
  personal_history text not null default '',
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','archived')),
  world_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (id, character_id)
);
create table if not exists public.campaign_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  sequence_number bigint not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(campaign_id, sequence_number)
);
create index if not exists idx_characters_owner on public.characters(owner_id);
create index if not exists idx_campaigns_owner on public.campaigns(owner_id);
create index if not exists idx_events_campaign on public.campaign_events(campaign_id, sequence_number);
alter table public.characters enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_events enable row level security;
create policy "characters_owner_all" on public.characters for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "campaigns_owner_all" on public.campaigns for all to authenticated using (owner_id = (select auth.uid()) and exists (select 1 from public.characters c where c.id = character_id and c.owner_id = (select auth.uid()))) with check (owner_id = (select auth.uid()) and exists (select 1 from public.characters c where c.id = character_id and c.owner_id = (select auth.uid())));
create policy "events_owner_select" on public.campaign_events for select to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = (select auth.uid())));
-- Event writes intentionally reserved for the trusted backend using service credentials.
