-- Notes of Matcha - Supabase Schema
-- Place this file in: supabase/schemas/matcha.sql

-- ============================================================
-- PROFILES
-- Extends Supabase Auth users with app-level data
-- ============================================================
create table "profiles" (
  "id"         uuid not null references auth.users (id) on delete cascade,
  "created_at" timestamptz not null default now(),

  primary key ("id")
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- MATCHA ENTRIES
-- Core journal entry, one per matcha tasted
-- ============================================================
create table "matcha_entries" (
  "id"         uuid not null default gen_random_uuid(),
  "user_id"    uuid not null references public.profiles (id) on delete cascade,
  "name"       text not null default '',
  "brand"      text not null default '',
  "prefecture" text not null default '',
  "notes"      text not null default '',
  "color"      text not null default '#3e6f2c',   -- hex color string
  "favorite"   boolean not null default false,
  "image_url"  text,                               -- Supabase Storage public URL
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "sort_order"  integer not null default 0,

  primary key ("id")
);

-- Auto-update updated_at on every save
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger matcha_entries_updated_at
  before update on public.matcha_entries
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- TASTE ANALYSIS
-- Radar chart values (1–10) for each entry
-- ============================================================
create table "taste_analysis" (
  "id"          uuid not null default gen_random_uuid(),
  "entry_id"    uuid not null references public.matcha_entries (id) on delete cascade,
  "sweetness"   smallint not null default 5 check (sweetness between 1 and 10),
  "bitterness"  smallint not null default 5 check (bitterness between 1 and 10),
  "green"       smallint not null default 5 check (green between 1 and 10),
  "umami"       smallint not null default 5 check (umami between 1 and 10),
  "astringency" smallint not null default 5 check (astringency between 1 and 10),

  primary key ("id"),
  unique ("entry_id")   -- one taste_analysis row per entry
);


-- ============================================================
-- FLAVOR PROFILES
-- Grassy / Nutty / Floral toggles for each entry
-- ============================================================
create table "flavor_profiles" (
  "id"       uuid not null default gen_random_uuid(),
  "entry_id" uuid not null references public.matcha_entries (id) on delete cascade,
  "grassy"   boolean not null default false,
  "nutty"    boolean not null default false,
  "floral"   boolean not null default false,

  primary key ("id"),
  unique ("entry_id")   -- one flavor_profile row per entry
);


-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only read/write their own data
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.matcha_entries enable row level security;
alter table public.taste_analysis enable row level security;
alter table public.flavor_profiles enable row level security;

-- profiles: users can only see and update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- matcha_entries: full CRUD for own entries only
create policy "Users can view own entries"
  on public.matcha_entries for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own entries"
  on public.matcha_entries for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own entries"
  on public.matcha_entries for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own entries"
  on public.matcha_entries for delete
  using ((select auth.uid()) = user_id);

-- taste_analysis: access via parent entry ownership
create policy "Users can view own taste analysis"
  on public.taste_analysis for select
  using (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own taste analysis"
  on public.taste_analysis for insert
  with check (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

create policy "Users can update own taste analysis"
  on public.taste_analysis for update
  using (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own taste analysis"
  on public.taste_analysis for delete
  using (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

-- flavor_profiles: access via parent entry ownership
create policy "Users can view own flavor profiles"
  on public.flavor_profiles for select
  using (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own flavor profiles"
  on public.flavor_profiles for insert
  with check (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

create policy "Users can update own flavor profiles"
  on public.flavor_profiles for update
  using (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own flavor profiles"
  on public.flavor_profiles for delete
  using (
    exists (
      select 1 from public.matcha_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );
