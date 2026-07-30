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

