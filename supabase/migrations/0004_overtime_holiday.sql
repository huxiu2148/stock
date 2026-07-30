-- Adds is_holiday flag to overtime_entries, so holiday overtime can be
-- calculated per Labor Standards Act Article 39 (double pay for first 8
-- hours, then 1.34x/1.67x tiers) instead of the regular-weekday formula.
-- Run this in the SQL Editor.

alter table overtime_entries
  add column if not exists is_holiday boolean not null default false;
