-- 刷卡攻略：紀錄什麼情況下用哪張卡、切換什麼權益最划算

create table if not exists card_usage_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  scenario text not null,     -- 情境/消費類型，例如：網路購物、加油、海外刷卡
  card_name text not null,    -- 卡片名稱，例如：國泰
  benefit text not null,      -- 要切換/登錄的權益，例如：5% 網購回饋
  note text,                  -- 備註，例如活動期限、回饋上限、登錄網址

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table card_usage_tips enable row level security;

drop policy if exists "select_own" on card_usage_tips;
create policy "select_own" on card_usage_tips for select using (auth.uid() = user_id);
drop policy if exists "insert_own" on card_usage_tips;
create policy "insert_own" on card_usage_tips for insert with check (auth.uid() = user_id);
drop policy if exists "update_own" on card_usage_tips;
create policy "update_own" on card_usage_tips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delete_own" on card_usage_tips;
create policy "delete_own" on card_usage_tips for delete using (auth.uid() = user_id);

create index if not exists idx_card_usage_tips_user on card_usage_tips(user_id, scenario);
