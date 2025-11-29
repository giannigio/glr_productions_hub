-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles linked to auth users
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  email text,
  full_name text not null,
  system_role text not null check (system_role in ('ADMIN','MANAGER','TECH')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Utility: check if current user has one of the provided roles
create or replace function public.has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.system_role = any(roles)
  );
$$;

-- Generic JSON-backed tables for fast prototyping
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.standard_material_lists (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  read_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.crew_members enable row level security;
alter table public.locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.standard_material_lists enable row level security;
alter table public.rentals enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;

-- Profile policies
create policy "Profiles: self read" on public.profiles
  for select using (auth.uid() = user_id or has_role(array['ADMIN','MANAGER']));
create policy "Profiles: self upsert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "Profiles: self update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Generic policies
create policy "Generic: read authenticated" on public.jobs for select using (auth.role() = 'authenticated');
create policy "Generic: write admins" on public.jobs for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated crew" on public.crew_members for select using (auth.role() = 'authenticated');
create policy "Generic: write admins crew" on public.crew_members for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated locations" on public.locations for select using (auth.role() = 'authenticated');
create policy "Generic: write admins locations" on public.locations for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated inventory" on public.inventory_items for select using (auth.role() = 'authenticated');
create policy "Generic: write admins inventory" on public.inventory_items for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated lists" on public.standard_material_lists for select using (auth.role() = 'authenticated');
create policy "Generic: write admins lists" on public.standard_material_lists for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated rentals" on public.rentals for select using (auth.role() = 'authenticated');
create policy "Generic: write admins rentals" on public.rentals for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated notifications" on public.notifications for select using (auth.role() = 'authenticated');
create policy "Generic: write admins notifications" on public.notifications for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

create policy "Generic: read authenticated settings" on public.app_settings for select using (auth.role() = 'authenticated');
create policy "Generic: write admins settings" on public.app_settings for all using (has_role(array['ADMIN','MANAGER'])) with check (has_role(array['ADMIN','MANAGER']));

-- Storage bucket for private assets
insert into storage.buckets (id, name, public) values ('private-media', 'private-media', false)
on conflict (id) do nothing;

create policy "Storage: read private authenticated" on storage.objects
  for select using (bucket_id = 'private-media' and auth.role() = 'authenticated');
create policy "Storage: insert private authenticated" on storage.objects
  for insert with check (bucket_id = 'private-media' and auth.role() = 'authenticated');
create policy "Storage: update private admins" on storage.objects
  for update using (bucket_id = 'private-media' and has_role(array['ADMIN','MANAGER'])) with check (bucket_id = 'private-media' and has_role(array['ADMIN','MANAGER']));
create policy "Storage: delete private admins" on storage.objects
  for delete using (bucket_id = 'private-media' and has_role(array['ADMIN','MANAGER']));
