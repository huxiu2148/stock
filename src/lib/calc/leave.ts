import type { LeaveType } from "@/types/database";

/**
 * 請假扣薪比例：依你的規則設定。
 * 特休／公假：全薪（不扣）
 * 生理假／病假：算病假，扣半薪
 * 事假／特別病假／無薪假：全額不給薪
 * 其他：預設不扣（視為公司給薪的特殊假別，如婚喪假）
 */
export const LEAVE_DEDUCTION_RATES: Record<LeaveType, number> = {
  特休: 0,
  生理假: 0.5,
  事假: 1,
  病假: 0.5,
  特別病假: 1,
  公假: 0,
  無薪假: 1,
  其他: 0,
};

export interface LeaveDeductionSummary {
  totalMinutes: number;
  totalDeduction: number;
}

/**
 * 先依假別把分鐘數加總，最後才四捨五入一次算出扣款金額，
 * 避免每一筆個別捨入造成誤差累積（例如 3+6+2 分鐘應視為 11 分鐘一次計算，
 * 而不是 3 筆各自捨入後再加總）。
 */
export function summarizeLeaveDeduction(
  entries: { minutes: number; leave_type: LeaveType }[],
  hourlyWage: number
): LeaveDeductionSummary {
  const minutesByType = new Map<LeaveType, number>();
  let totalMinutes = 0;

  for (const e of entries) {
    totalMinutes += e.minutes;
    minutesByType.set(e.leave_type, (minutesByType.get(e.leave_type) ?? 0) + e.minutes);
  }

  let totalDeduction = 0;
  for (const [leaveType, minutes] of minutesByType) {
    const rate = LEAVE_DEDUCTION_RATES[leaveType] ?? 0;
    totalDeduction += Math.round((minutes / 60) * hourlyWage * rate);
  }

  return { totalMinutes, totalDeduction };
}
