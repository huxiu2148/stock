import { minutesBetween, overlapMinutes } from "./time";

/**
 * 加班費試算，依你確認過的實際規則：
 * - 不會以 30 分鐘捨去，每一分鐘都算
 * - 加班若持續到 19:10，19:10~19:40 算晚餐休息時間不算薪，
 *   19:40 之後才繼續計算（跟中午休息排除的邏輯一樣）
 * - 時數會先換算成小時、四捨五入到小數點後兩位（比照公司系統的時數記錄方式），
 *   才拿這個時數去算錢
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
  /** 已四捨五入到小數點後兩位的時數，實際用來計算加班費的時數。 */
  payableHours: number;
  /** 精確金額（未四捨五入），供加總多筆紀錄後統一在畫面上捨入一次，避免誤差累積。 */
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
  const payableHours = Math.round((payableMinutes / 60) * 100) / 100;

  const firstTierHours = Math.min(payableHours, FIRST_TIER_HOURS);
  const secondTierHours = Math.max(payableHours - FIRST_TIER_HOURS, 0);

  const pay =
    hourlyWage * firstTierHours * FIRST_TIER_RATE +
    hourlyWage * secondTierHours * SECOND_TIER_RATE;

  return { payableMinutes, payableHours, pay, mealAllowance };
}
