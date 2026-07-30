-- Adds an optional broker/account tag to stock_trades (e.g. 國泰, 永豐),
-- so trades can be filtered by which brokerage account they're in.
-- Run this in the SQL Editor.

alter table stock_trades
  add column if not exists broker text;
