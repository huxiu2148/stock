-- 刷卡紀錄：預約交易 / 完成扣款 紀號

alter table credit_card_statements
  add column if not exists reserved boolean not null default false,
  add column if not exists debited boolean not null default false;
