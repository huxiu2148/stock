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
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CreditCardStatementInput = Omit<
  CreditCardStatement,
  "id" | "user_id" | "created_at" | "updated_at"
>;

