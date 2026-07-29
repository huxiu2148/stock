import type { LeaveType } from "@/types/database";

/**
 * 請假扣薪比例：依你的規則設定。
 * 特休：全薪（不扣）
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
  無薪假: 1,
  其他: 0,
};

export interface LeaveDeductionResult {
  minutes: number;
  rate: number;
  amount: number;
}

export function computeLeaveDeduction(
  minutes: number,
  leaveType: LeaveType,
  hourlyWage: number
): LeaveDeductionResult {
  const rate = LEAVE_DEDUCTION_RATES[leaveType] ?? 0;
  const amount = Math.round((minutes / 60) * hourlyWage * rate);
  return { minutes, rate, amount };
}

export interface LeaveDeductionSummary {
  totalMinutes: number;
  totalDeduction: number;
}

export function summarizeLeaveDeduction(
  entries: { minutes: number; leave_type: LeaveType }[],
  hourlyWage: number
): LeaveDeductionSummary {
  return entries.reduce<LeaveDeductionSummary>(
    (acc, e) => {
      const { amount } = computeLeaveDeduction(e.minutes, e.leave_type, hourlyWage);
      return {
        totalMinutes: acc.totalMinutes + e.minutes,
        totalDeduction: acc.totalDeduction + amount,
      };
    },
    { totalMinutes: 0, totalDeduction: 0 }
  );
}
