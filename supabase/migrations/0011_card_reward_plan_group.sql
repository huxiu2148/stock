-- 部分卡片 (例如國泰CUBE、台新Richart) 同時間只能啟用一個權益方案，
-- 用 plan_group 把互斥的方案規則歸成一組，同一組同時間只會採用其中一個。

alter table card_reward_rules
  add column if not exists plan_group text;
