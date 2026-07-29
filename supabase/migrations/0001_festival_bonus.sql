-- Adds 三節獎金 (festival bonus) fields to salary_records.
-- Run this in the SQL Editor if your project was set up before this migration existed.

alter table salary_records
  add column if not exists festival_bonus numeric not null default 0,
  add column if not exists festival_bonus_note text;
