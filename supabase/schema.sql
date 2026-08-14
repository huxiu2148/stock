-- Schema for salary / leave / stock tracker
-- Run this once in your Supabase project's SQL editor.

create extension if not exists "pgcrypto";

-- ============================================================
-- 薪資紀錄 (one row per pay period / month)
-- ============================================================
create table if not exists salary_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_month text not null,                -- e.g. '2025-07'
  pay_date date,                           -- 發薪日

  -- 底薪組成 (順序: 基本底薪, 職務加給, 伙食費, 其他, 其他加給, 夜班津貼, 考核獎金)
  base_basic numeric not null default 0,           -- 基本底薪
  base_position numeric not null default 0,        -- 職務加給
  base_meal numeric not null default 0,             -- 伙食費
  base_other numeric not null default 0,            -- 其他
  base_other_allowance numeric not null default 0,  -- 其他加給
  base_night_shift numeric not null default 0,      -- 夜班津貼
  base_evaluation_bonus numeric not null default 0, -- 考核獎金 (併入底薪/薪資合計小計)

  performance_bonus numeric not null default 0,     -- 考績獎金 (單獨列在底薪小計之後)
  bonus numeric not null default 0,                 -- 獎金 (misc / year-end etc.)
  festival_bonus numeric not null default 0,        -- 三節獎金
  festival_bonus_note text,                         -- 三節獎金備註 (中秋/端午/春節...)

  -- 扣除項目 (固定欄位)
  deduct_welfare numeric not null default 0,             -- 福利金
  deduct_labor_insurance numeric not null default 0,     -- 勞保費
  deduct_health_insurance numeric not null default 0,    -- 健保費
  deduct_labor_pension_self numeric not null default 0,  -- 勞退自提
  deduct_guarantee_insurance numeric not null default 0, -- 人事保證保險

  hourly_wage numeric,                     -- 用於加班費試算，留空則自動用底薪/240推算
  overtime_pay_override numeric,           -- 加班費(含誤餐費)手動覆寫金額，留空則用當月加班紀錄自動試算
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, year_month)
);

-- ============================================================
-- 加班紀錄
-- ============================================================
create table if not exists overtime_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  minutes integer not null,       -- 自動換算
  is_holiday boolean not null default false, -- 是否為國定假日出勤
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 遲到紀錄
-- ============================================================
create table if not exists late_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  minutes integer not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 請假紀錄
-- ============================================================
create table if not exists leave_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  minutes integer not null,
  leave_type text not null,   -- 特休 / 生理假 / 事假 / 病假 / 特別病假 / 無薪假 / 其他
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 假別剩餘天數 (手動維護，如試算表紅字提示)
-- ============================================================
create table if not exists leave_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  leave_type text not null,
  remaining_days numeric not null default 0,
  as_of_note text,             -- e.g. '~2025/08/31'
  updated_at timestamptz not null default now(),
  unique (user_id, leave_type)
);

-- ============================================================
-- 使用者設定 (到職日，用於自動計算特休天數)
-- ============================================================
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hire_date date,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 股票交易紀錄
-- ============================================================
create table if not exists stock_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  market text not null check (market in ('TW', 'US')),      -- 台股 / 美股
  currency text not null check (currency in ('TWD', 'USD')), -- 結算幣別
  symbol text not null,        -- 代碼
  name text,                   -- 名稱/備註

  buy_date date not null,
  sell_date date,

  buy_price numeric not null default 0,
  target_sell_price numeric,        -- 理想賣出
  actual_sell_price numeric,        -- 實際賣出
  shares numeric not null default 0,

  fee_buy numeric not null default 0,   -- 買進手續費
  fee_sell numeric not null default 0,  -- 賣出手續費
  tax numeric not null default 0,       -- 交易稅

  exchange_rate_buy numeric,   -- 買進當時匯率 (美股 USD 用)
  exchange_rate_sell numeric,  -- 賣出當時匯率

  broker text,                 -- 券商/證券戶 (例如 國泰、永豐)
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 貸款還款計畫 (學貸、孝親費等)
-- ============================================================
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,           -- 例如 富邦學貸、台銀學貸、媽媽
  category text,                -- 學貸 / 孝親費 / 其他
  principal_total numeric not null default 0,  -- 借款總額
  has_interest boolean not null default true,  -- false 時不計算/顯示利息 (例如孝親費)
  default_payment_amount numeric,  -- 每期預設還款本金金額，方便快速輸入
  start_date date,               -- 開始還款日
  due_day integer,               -- 每月還款日 (1-31)
  total_installments integer,    -- 總期數 (選填，用於顯示進度)
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id uuid not null references loans(id) on delete cascade,

  pay_date date not null,
  principal_paid numeric not null default 0,
  interest_paid numeric not null default 0,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 刷卡紀錄
-- ============================================================
create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,           -- 例如 兆豐、國泰、聯邦、富邦、永豐、永豐美金、星展、台新
  currency text not null default 'TWD' check (currency in ('TWD', 'USD')),
  opened_date date,              -- 辦卡日
  statement_day integer,         -- 結帳日
  post_day integer,              -- 入帳日
  debit_day integer,             -- 扣款日
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists credit_card_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references credit_cards(id) on delete cascade,

  year_month text not null,      -- e.g. '2025-07'
  amount numeric not null default 0,   -- 帳單總金額 (卡片原幣別)
  exchange_rate numeric,         -- 美金卡當月約略匯率，用於換算台幣加總
  reserved boolean not null default false, -- 已預約交易 (結帳日附近約定轉帳)
  debited boolean not null default false,  -- 已完成扣款
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, year_month)
);

-- ============================================================
-- 刷卡回饋試算：輸入金額與消費通路，自動算出各卡回饋並排序
-- ============================================================
create table if not exists card_reward_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  card_name text not null,      -- 卡片名稱，例如：國泰CUBE
  channel text not null,        -- 方案/通路標籤，例如：一般消費、大筆刷、玩旅刷
  currency_scope text,          -- 限定幣別 (例如僅海外消費適用)，留空 = 不限
  rate numeric not null default 0,   -- 回饋比例 (%)，例如 3 表示 3%
  max_reward numeric,           -- 回饋上限金額 (台幣)，選填
  plan_group text,              -- 互斥方案分組 (例如國泰CUBE、台新Richart 同時間只能啟用一個方案)，留空 = 一律適用
  merchants text,               -- 適用商家清單，用 / 分隔，留空則退回用 channel 粗略比對類別
  requires_registration boolean not null default false,
  registration_note text,       -- 登錄方式/限量/期限等說明
  payment_method_note text,     -- 限定支付方式的說明 (例如「限台新Pay绑定支付」)
  valid_from date,              -- 活動生效日，留空 = 沒有限制
  valid_until date,             -- 活動到期日，過了這天自動不再比對到
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 刷卡紀錄：記錄每一筆實際刷卡消費，方便對照回饋規則的月結上限有沒有刷到頂
-- ============================================================
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

-- ============================================================
-- Row Level Security: 每個使用者只能存取自己的資料
-- ============================================================
alter table salary_records enable row level security;
alter table overtime_entries enable row level security;
alter table late_entries enable row level security;
alter table leave_entries enable row level security;
alter table leave_balances enable row level security;
alter table stock_trades enable row level security;
alter table user_settings enable row level security;
alter table loans enable row level security;
alter table loan_payments enable row level security;
alter table credit_cards enable row level security;
alter table credit_card_statements enable row level security;
alter table card_reward_rules enable row level security;
alter table card_reward_transactions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['salary_records','overtime_entries','late_entries','leave_entries','leave_balances','stock_trades','user_settings','loans','loan_payments','credit_cards','credit_card_statements','card_reward_rules','card_reward_transactions']
  loop
    execute format('drop policy if exists "select_own" on %I', t);
    execute format('create policy "select_own" on %I for select using (auth.uid() = user_id)', t);
    execute format('drop policy if exists "insert_own" on %I', t);
    execute format('create policy "insert_own" on %I for insert with check (auth.uid() = user_id)', t);
    execute format('drop policy if exists "update_own" on %I', t);
    execute format('create policy "update_own" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('drop policy if exists "delete_own" on %I', t);
    execute format('create policy "delete_own" on %I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

create index if not exists idx_overtime_user_date on overtime_entries(user_id, work_date);
create index if not exists idx_late_user_date on late_entries(user_id, work_date);
create index if not exists idx_leave_user_date on leave_entries(user_id, work_date);
create index if not exists idx_stock_user_market on stock_trades(user_id, market);
create index if not exists idx_salary_user_month on salary_records(user_id, year_month);
create index if not exists idx_loan_payments_loan on loan_payments(loan_id, pay_date);
create index if not exists idx_credit_card_statements_card on credit_card_statements(card_id, year_month);
create index if not exists idx_card_reward_rules_user on card_reward_rules(user_id, card_name, channel);
create index if not exists idx_card_reward_transactions_user on card_reward_transactions(user_id, card_name, channel, statement_date);
