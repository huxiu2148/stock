/**
 * 加班費試算，依你的試算表註記：
 * 「2小有誤餐費(0.5小不算薪) 前2小:*1.34 後兩小:*1.67」
 *
 * - 未滿 30 分鐘不算薪，滿 30 分鐘後以 30 分鐘為單位無條件捨去計薪
 * - 實際加班達 2 小時（含）以上，補發誤餐費 100 元
 * - 前 2 小時以時薪 *1.34 計，超過 2 小時的部分以 *1.67 計
 *
 * 這是台灣常見的加班費估算公式，僅供參考，金額仍可在畫面上手動覆寫。
 */
export const MEAL_ALLOWANCE_THRESHOLD_MINUTES = 120;
export const MEAL_ALLOWANCE_AMOUNT = 100;
const UNPAID_MINUTES = 30;
const ROUND_UNIT_MINUTES = 30;
const FIRST_TIER_HOURS = 2;
const FIRST_TIER_RATE = 1.34;
const SECOND_TIER_RATE = 1.67;

export interface OvertimePayResult {
  payableMinutes: number;
  pay: number;
  mealAllowance: number;
}

/** 由月薪推算平日每小時工資額 (月薪 / 30 / 8)。 */
export function estimateHourlyWage(monthlyBaseSalary: number): number {
  if (!monthlyBaseSalary) return 0;
  return monthlyBaseSalary / 30 / 8;
}

export function computeOvertimePay(
  rawMinutes: number,
  hourlyWage: number
): OvertimePayResult {
  const mealAllowance =
    rawMinutes >= MEAL_ALLOWANCE_THRESHOLD_MINUTES ? MEAL_ALLOWANCE_AMOUNT : 0;

  if (rawMinutes < UNPAID_MINUTES) {
    return { payableMinutes: 0, pay: 0, mealAllowance };
  }

  const payableMinutes =
    Math.floor(rawMinutes / ROUND_UNIT_MINUTES) * ROUND_UNIT_MINUTES;
  const hours = payableMinutes / 60;
  const firstTierHours = Math.min(hours, FIRST_TIER_HOURS);
  const secondTierHours = Math.max(hours - FIRST_TIER_HOURS, 0);

  const pay =
    hourlyWage * firstTierHours * FIRST_TIER_RATE +
    hourlyWage * secondTierHours * SECOND_TIER_RATE;

  return { payableMinutes, pay: Math.round(pay), mealAllowance };
}
