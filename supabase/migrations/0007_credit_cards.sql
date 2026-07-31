-- 刷卡紀錄

create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text not null default 'TWD' check (currency in ('TWD', 'USD')),
  opened_date date,
  statement_day integer,
  post_day integer,
  debit_day integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists credit_card_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references credit_cards(id) on delete cascade,
  year_month text not null,
  amount numeric not null default 0,
  exchange_rate numeric,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, year_month)
);

alter table credit_cards enable row level security;
alter table credit_card_statements enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['credit_cards','credit_card_statements']
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

create index if not exists idx_credit_card_statements_card on credit_card_statements(card_id, year_month);
