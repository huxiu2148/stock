import { minutesBetween, overlapMinutes } from "./time";

/**
 * 加班費試算，依你確認過的實際規則：
 * - 不會以 30 分鐘捨去，每一分鐘都算
 * - 加班若持續到 19:10，19:10~19:40 算晚餐休息時間不算薪，
 *   19:40 之後才繼續計算（跟中午休息排除的邏輯一樣）
 * - 加班達 2 小時（含）以上，補發誤餐費 100 元
 * - 前 2 小時以時薪 *1.34 計，超過 2 小時的部分以 *1.67 計
 *
 * 僅供參考估算，金額仍可在畫面上手動覆寫。
 */
export const MEAL_ALLOWANCE_THRESHOLD_MINUTES = 120;
export const MEAL_ALLOWANCE_AMOUNT = 100;
export const DINNER_BREAK_START = "19:10";
export const DINNER_BREAK_END = "19:40";
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

export function computeOvertimePayForRange(
  startTime: string,
  endTime: string,
  hourlyWage: number
): OvertimePayResult {
  const rawMinutes = minutesBetween(startTime, endTime);
  const mealAllowance =
    rawMinutes >= MEAL_ALLOWANCE_THRESHOLD_MINUTES ? MEAL_ALLOWANCE_AMOUNT : 0;

  const dinnerBreakOverlap = overlapMinutes(
    startTime,
    endTime,
    DINNER_BREAK_START,
    DINNER_BREAK_END
  );
  const payableMinutes = Math.max(0, rawMinutes - dinnerBreakOverlap);

  const hours = payableMinutes / 60;
  const firstTierHours = Math.min(hours, FIRST_TIER_HOURS);
  const secondTierHours = Math.max(hours - FIRST_TIER_HOURS, 0);

  const pay =
    hourlyWage * firstTierHours * FIRST_TIER_RATE +
    hourlyWage * secondTierHours * SECOND_TIER_RATE;

  return { payableMinutes, pay: Math.round(pay), mealAllowance };
}
