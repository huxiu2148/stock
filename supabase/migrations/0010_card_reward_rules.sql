-- 刷卡回饋試算：輸入金額與消費通路，自動算出各卡回饋並排序
-- 取代原本的 card_usage_tips (單純文字紀錄)，改成可計算的回饋規則。

drop table if exists card_usage_tips;

create table if not exists card_reward_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  card_name text not null,
  channel text not null,
  currency_scope text,
  rate numeric not null default 0,
  max_reward numeric,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table card_reward_rules enable row level security;

drop policy if exists "select_own" on card_reward_rules;
create policy "select_own" on card_reward_rules for select using (auth.uid() = user_id);
drop policy if exists "insert_own" on card_reward_rules;
create policy "insert_own" on card_reward_rules for insert with check (auth.uid() = user_id);
drop policy if exists "update_own" on card_reward_rules;
create policy "update_own" on card_reward_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delete_own" on card_reward_rules;
create policy "delete_own" on card_reward_rules for delete using (auth.uid() = user_id);

create index if not exists idx_card_reward_rules_user on card_reward_rules(user_id, card_name, channel);
