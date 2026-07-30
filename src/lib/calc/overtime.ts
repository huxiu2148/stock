import { minutesBetween, overlapMinutes } from "./time";
import { WORK_HOURS } from "./time";

/**
 * 加班費試算。
 *
 * 平日加班：
 * - 不會以 30 分鐘捨去，每一分鐘都算
 * - 加班若持續到 19:10，19:10~19:40 算晚餐休息時間不算薪，
 *   19:40 之後才繼續計算（跟中午休息排除的邏輯一樣）
 * - 加班達 2 小時（含）以上，補發誤餐費 100 元
 * - 前 2 小時以時薪 *1.34 計，超過 2 小時的部分以 *1.67 計
 *
 * 國定假日出勤（依勞基法第39條）：
 * - 扣除午休 (12:10-13:10) 與晚餐休息 (19:10-19:40，若有加班到那麼晚)
 * - 前 8 小時工資加倍發給 (*2)
 * - 第 9、10 小時 (超過8小時的前2小時) 以平日加班費率 *1.34 計
 * - 第 11、12 小時以 *1.67 計
 *
 * 時數皆先換算成小時、四捨五入到小數點後兩位（比照公司系統的時數記錄方式），
 * 才拿這個時數去算錢；金額本身不提前捨入，累加多筆紀錄後只在畫面上捨入一次。
 *
 * 僅供參考估算，金額仍可在畫面上手動覆寫。
 */
export const MEAL_ALLOWANCE_THRESHOLD_MINUTES = 120;
export const MEAL_ALLOWANCE_AMOUNT = 100;
export const DINNER_BREAK_START = "19:10";
export const DINNER_BREAK_END = "19:40";

const WEEKDAY_FIRST_TIER_HOURS = 2;
const WEEKDAY_FIRST_TIER_RATE = 1.34;
const WEEKDAY_SECOND_TIER_RATE = 1.67;

const HOLIDAY_BASE_HOURS = 8;
const HOLIDAY_BASE_RATE = 2;
const HOLIDAY_SECOND_TIER_HOURS = 2;
const HOLIDAY_SECOND_TIER_RATE = 1.34;
const HOLIDAY_THIRD_TIER_RATE = 1.67;

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

function computePayableHours(
  startTime: string,
  endTime: string,
  excludeLunch: boolean
): { rawMinutes: number; payableMinutes: number; payableHours: number } {
  const rawMinutes = minutesBetween(startTime, endTime);

  const dinnerOverlap = overlapMinutes(startTime, endTime, DINNER_BREAK_START, DINNER_BREAK_END);
  const lunchOverlap = excludeLunch
    ? overlapMinutes(startTime, endTime, WORK_HOURS.lunchStart, WORK_HOURS.lunchEnd)
    : 0;

  const payableMinutes = Math.max(0, rawMinutes - dinnerOverlap - lunchOverlap);
  const payableHours = Math.round((payableMinutes / 60) * 100) / 100;

  return { rawMinutes, payableMinutes, payableHours };
}

export function computeOvertimePayForRange(
  startTime: string,
  endTime: string,
  hourlyWage: number,
  isHoliday = false
): OvertimePayResult {
  if (isHoliday) {
    const { rawMinutes, payableMinutes, payableHours } = computePayableHours(
      startTime,
      endTime,
      true
    );
    const mealAllowance =
      rawMinutes >= MEAL_ALLOWANCE_THRESHOLD_MINUTES ? MEAL_ALLOWANCE_AMOUNT : 0;

    const baseHours = Math.min(payableHours, HOLIDAY_BASE_HOURS);
    const secondTierHours = Math.min(
      Math.max(payableHours - HOLIDAY_BASE_HOURS, 0),
      HOLIDAY_SECOND_TIER_HOURS
    );
    const thirdTierHours = Math.max(
      payableHours - HOLIDAY_BASE_HOURS - HOLIDAY_SECOND_TIER_HOURS,
      0
    );

    const pay =
      hourlyWage * baseHours * HOLIDAY_BASE_RATE +
      hourlyWage * secondTierHours * HOLIDAY_SECOND_TIER_RATE +
      hourlyWage * thirdTierHours * HOLIDAY_THIRD_TIER_RATE;

    return { payableMinutes, payableHours, pay, mealAllowance };
  }

  const { rawMinutes, payableMinutes, payableHours } = computePayableHours(
    startTime,
    endTime,
    false
  );
  const mealAllowance =
    rawMinutes >= MEAL_ALLOWANCE_THRESHOLD_MINUTES ? MEAL_ALLOWANCE_AMOUNT : 0;

  const firstTierHours = Math.min(payableHours, WEEKDAY_FIRST_TIER_HOURS);
  const secondTierHours = Math.max(payableHours - WEEKDAY_FIRST_TIER_HOURS, 0);

  const pay =
    hourlyWage * firstTierHours * WEEKDAY_FIRST_TIER_RATE +
    hourlyWage * secondTierHours * WEEKDAY_SECOND_TIER_RATE;

  return { payableMinutes, payableHours, pay, mealAllowance };
}
