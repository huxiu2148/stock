-- 刷卡紀錄補上「商家/情境」欄位，用來核對「當下實際啟用的通路」跟「真的買了什麼」對不對得上
-- (例如：Richart停在玩旅刷，但其實去超商買東西，玩旅刷的商家清單比對不到超商，代表沒套用到這個加碼)

alter table card_reward_transactions
  add column if not exists merchant_text text;
