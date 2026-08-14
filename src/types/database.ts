export type LeaveType =
  | "特休"
  | "生理假"
  | "事假"
  | "病假"
  | "特別病假"
  | "公假"
  | "無薪假"
  | "其他";

export const LEAVE_TYPES: LeaveType[] = [
  "特休",
  "生理假",
  "事假",
  "病假",
  "特別病假",
  "公假",
  "無薪假",
  "其他",
];

export interface SalaryRecord {
  id: string;
  user_id: string;
  year_month: string;
  pay_date: string | null;

  base_basic: number;
  base_position: number;
  base_meal: number;
  base_other: number;
  base_other_allowance: number;
  base_night_shift: number;
  base_evaluation_bonus: number;

  performance_bonus: number;
  bonus: number;
  festival_bonus: number;
  festival_bonus_note: string | null;

  deduct_welfare: number;
  deduct_labor_insurance: number;
  deduct_health_insurance: number;
  deduct_labor_pension_self: number;
  deduct_guarantee_insurance: number;

  hourly_wage: number | null;
  overtime_pay_override: number | null;
  note: string | null;

  created_at: string;
  updated_at: string;
}

export type SalaryRecordInput = Omit<
  SalaryRecord,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface TimeEntryBase {
  id: string;
  user_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  minutes: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OvertimeEntry extends TimeEntryBase {
  is_holiday: boolean;
}
export type LateEntry = TimeEntryBase;

export interface LeaveEntry extends TimeEntryBase {
  leave_type: LeaveType;
}

export type Market = "TW" | "US";
export type Currency = "TWD" | "USD";

export interface StockTrade {
  id: string;
  user_id: string;
  market: Market;
  currency: Currency;
  symbol: string;
  name: string | null;
  buy_date: string;
  sell_date: string | null;
  buy_price: number;
  target_sell_price: number | null;
  actual_sell_price: number | null;
  shares: number;
  fee_buy: number;
  fee_sell: number;
  tax: number;
  exchange_rate_buy: number | null;
  exchange_rate_sell: number | null;
  broker: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type StockTradeInput = Omit<
  StockTrade,
  "id" | "user_id" | "created_at" | "updated_at"
>;

// ============================================================
// 貸款還款計畫 (學貸、孝親費等)
// ============================================================
export interface Loan {
  id: string;
  user_id: string;
  name: string;
  category: string | null; // 學貸 / 孝親費 / 其他，用於分類顯示
  principal_total: number; // 借款總額
  has_interest: boolean; // false 時不顯示/計算利息 (例如孝親費)
  default_payment_amount: number | null; // 每期預設還款本金金額，方便快速輸入
  start_date: string | null; // 開始還款日
  due_day: number | null; // 每月還款日 (1-31)
  total_installments: number | null; // 總期數 (選填，用於顯示進度)
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type LoanInput = Omit<
  Loan,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface LoanPayment {
  id: string;
  user_id: string;
  loan_id: string;
  pay_date: string;
  principal_paid: number;
  interest_paid: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type LoanPaymentInput = Omit<
  LoanPayment,
  "id" | "user_id" | "created_at" | "updated_at"
>;

// ============================================================
// 刷卡紀錄
// ============================================================
export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  currency: Currency;
  opened_date: string | null; // 辦卡日
  statement_day: number | null; // 結帳日
  post_day: number | null; // 入帳日
  debit_day: number | null; // 扣款日
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CreditCardInput = Omit<
  CreditCard,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface CreditCardStatement {
  id: string;
  user_id: string;
  card_id: string;
  year_month: string; // e.g. '2025-07'
  amount: number; // 帳單總金額 (卡片原幣別)
  exchange_rate: number | null; // 美金卡當月約略匯率，用於換算台幣
  reserved: boolean; // 已預約交易
  debited: boolean; // 已完成扣款
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CreditCardStatementInput = Omit<
  CreditCardStatement,
  "id" | "user_id" | "created_at" | "updated_at"
>;

// ============================================================
// 刷卡回饋試算 (輸入金額與消費通路，自動算出各卡回饋並排序)
// ============================================================
export interface CardRewardRule {
  id: string;
  user_id: string;
  card_name: string; // 卡片名稱，例如：國泰CUBE
  channel: string; // 方案/通路標籤，例如：一般消費、大筆刷、玩旅刷
  currency_scope: string | null; // 限定幣別 (例如僅海外消費適用)，null = 不限
  rate: number; // 回饋比例 (%)，例如 3 表示 3%
  max_reward: number | null; // 回饋上限金額 (台幣)，選填
  plan_group: string | null; // 互斥方案分組 (同時間只能啟用其中一個)，null = 一律適用
  merchants: string | null; // 適用商家清單，用 / 分隔，留空則退回用 channel 粗略比對類別
  requires_registration: boolean; // 是否需要登錄/額外操作才能拿到這個回饋
  registration_note: string | null; // 登錄方式/限量/期限等說明
  payment_method_note: string | null; // 限定支付方式的說明 (例如「限台新Pay绑定支付」)
  valid_from: string | null; // 活動生效日，null = 沒有限制
  valid_until: string | null; // 活動到期日，過了這天自動不再比對到
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CardRewardRuleInput = Omit<
  CardRewardRule,
  "id" | "user_id" | "created_at" | "updated_at"
>;

// ============================================================
// 刷卡紀錄 (每一筆實際消費，用來對照回饋規則的月結上限刷了多少)
// ============================================================
export interface CardRewardTransaction {
  id: string;
  user_id: string;
  card_name: string;
  channel: string | null; // 對應 CardRewardRule.channel，null = 未分類
  transaction_date: string; // 消費日
  statement_date: string | null; // 結帳日，用來判斷這筆算哪一期帳單
  amount_twd: number;
  reward_twd: number | null; // 這筆預估/實際回饋金額
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CardRewardTransactionInput = Omit<
  CardRewardTransaction,
  "id" | "user_id" | "created_at" | "updated_at"
>;

