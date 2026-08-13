-- 刷卡回饋規則改用具體商家名單比對，取代原本用大類別猜的方式

alter table card_reward_rules
  add column if not exists merchants text,              -- 適用商家清單，用 / 分隔，例如「momo/PChome/蝦皮」
  add column if not exists requires_registration boolean not null default false,
  add column if not exists registration_note text,       -- 登錄方式/限量/期限等說明
  add column if not exists payment_method_note text,      -- 限定支付方式的說明 (例如「限台新Pay绑定支付」)
  add column if not exists valid_from date,               -- 活動生效日，留空 = 沒有限制
  add column if not exists valid_until date;              -- 活動到期日，過了這天自動不再比對到
