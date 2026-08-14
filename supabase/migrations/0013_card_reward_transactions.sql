-- 刷卡紀錄：記錄每一筆實際刷卡消費，方便對照回饋規則的月結上限有沒有刷到頂
-- 結帳日 (statement_date) 讓使用者自己填這筆消費算在哪一期帳單，
-- 之後依「卡片+通路+結帳日」分組加總，就知道這期帳單這個通路的回饋刷了多少。

create table if not exists card_reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  card_name text not null,
  channel text,                    -- 對應 card_reward_rules.channel，留空 = 未分類
  transaction_date date not null,  -- 消費日
  statement_date date,             -- 結帳日，用來判斷這筆算哪一期帳單的回饋上限
  amount_twd numeric not null default 0,
  reward_twd numeric,              -- 這筆預估/實際回饋金額
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table card_reward_transactions enable row level security;

drop policy if exists "select_own" on card_reward_transactions;
create policy "select_own" on card_reward_transactions for select using (auth.uid() = user_id);
drop policy if exists "insert_own" on card_reward_transactions;
create policy "insert_own" on card_reward_transactions for insert with check (auth.uid() = user_id);
drop policy if exists "update_own" on card_reward_transactions;
create policy "update_own" on card_reward_transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delete_own" on card_reward_transactions;
create policy "delete_own" on card_reward_transactions for delete using (auth.uid() = user_id);

create index if not exists idx_card_reward_transactions_user
  on card_reward_transactions(user_id, card_name, channel, statement_date);
