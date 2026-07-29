# 薪資 · 假別 · 股票紀錄

個人用的薪資、加班/遲到/請假時數、假別剩餘天數、獎金與股票（台股／美股）紀錄工具。取代原本的試算表，資料存在雲端（Supabase），換裝置或清瀏覽紀錄都不會遺失。

## 功能

- **薪資**：每月一筆紀錄，發薪日、底薪組成（基本底薪／職務加給／伙食費／其他／其他加給／夜班津貼）、考績獎金、獎金、固定扣除項目（福利金／勞保費／健保費／勞退自提／人事保證保險）。金額欄位輸入 `0` 會自動清空顯示。
- **加班／遲到／請假**：輸入日期＋起訖時間，自動換算分鐘數，隨輸入即時存檔，不用等到發薪日才一次補登。
- **加班費試算**：依「滿 2 小時有誤餐費 100 元、未滿 30 分鐘不算薪、前 2 小時 ×1.34、超過 2 小時 ×1.67」試算，若跟實際薪資單金額有落差，可手動覆寫該月加班費金額。
- **假別剩餘天數**：手動維護剩餘天數與備註（例如「~2025/12/31」），如同試算表上的紅字提醒。
- **股票**：台股／美股分開檢視，美股可選擇美金付款或台幣付款結算（美金付款需輸入買進／賣出匯率換算台幣損益），自動計算手續費、交易稅後的成本、收入與損益。

## 技術與資料儲存

- [Next.js](https://nextjs.org)（App Router）＋ TypeScript＋ Tailwind CSS
- [Supabase](https://supabase.com)：Postgres 資料庫＋帳號登入（Email/密碼），並以 Row Level Security 確保每個帳號只能看到自己的資料

## 建置步驟

### 1. 建立 Supabase 專案

1. 到 [supabase.com](https://supabase.com) 免費註冊並建立一個新專案。
2. 進入專案的 **SQL Editor**，貼上並執行 [`supabase/schema.sql`](./supabase/schema.sql) 建立資料表與權限規則。
3. 到 **Project Settings → API**，複製 `Project URL` 與 `anon public` key。

### 2. 設定環境變數

複製 `.env.local.example` 為 `.env.local`，填入剛剛複製的值：

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

### 3. 本機開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)，第一次使用先「註冊」帳號（Supabase 預設會寄驗證信，也可以到 Supabase 後台的 Authentication 設定關閉驗證信直接啟用帳號）。

### 4. 部署到雲端（讓手機、其他電腦都能用）

推薦部署到 [Vercel](https://vercel.com)（免費）：

1. 將此專案推到 GitHub。
2. 到 Vercel 匯入這個 repo。
3. 在 Vercel 專案的 Environment Variables 加入與 `.env.local` 相同的兩個變數。
4. Deploy 完成後，用同一組帳號密碼在任何裝置登入，資料都會同步。

## 資料表結構

詳見 [`supabase/schema.sql`](./supabase/schema.sql)：`salary_records`（月薪資紀錄）、`overtime_entries`（加班）、`late_entries`（遲到）、`leave_entries`（請假）、`leave_balances`（假別剩餘天數）、`stock_trades`（股票交易）。
