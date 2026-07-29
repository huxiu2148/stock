-- Stores per-user settings, starting with hire_date (used to auto-calculate
-- statutory annual leave entitlement). Run this in the SQL Editor.

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hire_date date,
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

drop policy if exists "select_own" on user_settings;
create policy "select_own" on user_settings for select using (auth.uid() = user_id);
drop policy if exists "insert_own" on user_settings;
create policy "insert_own" on user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "update_own" on user_settings;
create policy "update_own" on user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
