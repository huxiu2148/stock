import type { LeaveEntry } from "@/types/database";

/** 生理假：固定一年 12 天，每年 1/1 重新計算。 */
export const MENSTRUAL_LEAVE_ANNUAL_QUOTA = 12;

/**
 * 依勞基法第 38 條，依到職年資計算特休天數。
 * 6個月~1年:3天 / 1~2年:7天 / 2~3年:10天 / 3~5年:14天 / 5~10年:15天
 * 10年以上每滿一年加1天，最多30天。
 */
export function annualLeaveQuota(yearsOfService: number): number {
  if (yearsOfService < 0.5) return 0;
  if (yearsOfService < 1) return 3;
  if (yearsOfService < 2) return 7;
  if (yearsOfService < 3) return 10;
  if (yearsOfService < 5) return 14;
  if (yearsOfService < 10) return 15;
  return Math.min(30, 15 + Math.floor(yearsOfService - 10));
}

function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

export interface LeavePeriod {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  label: string;
}

/** 特休週期：每年 9/1 ~ 隔年 8/31。 */
export function currentAnnualLeavePeriod(today: Date = new Date()): LeavePeriod {
  const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const start = new Date(year, 8, 1); // Sep 1
  const end = new Date(year + 1, 7, 31); // Aug 31 next year
  return {
    start: toDateStr(start),
    end: toDateStr(end),
    label: `~${toDateStr(end)}`,
  };
}

/** 生理假週期：每年 1/1 ~ 12/31。 */
export function currentMenstrualLeavePeriod(today: Date = new Date()): LeavePeriod {
  const year = today.getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: `~${year}-12-31`,
  };
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** 該期間內某假別已使用的天數 (以 8 小時 = 1 天換算)。 */
export function usedLeaveDays(
  entries: Pick<LeaveEntry, "work_date" | "leave_type" | "minutes">[],
  leaveType: LeaveEntry["leave_type"],
  period: LeavePeriod
): number {
  const totalMinutes = entries
    .filter(
      (e) =>
        e.leave_type === leaveType &&
        e.work_date >= period.start &&
        e.work_date <= period.end
    )
    .reduce((sum, e) => sum + e.minutes, 0);
  return totalMinutes / 480;
}

export interface LeaveBalanceComputed {
  period: LeavePeriod;
  quota: number;
  used: number;
  remaining: number;
}

export function computeAnnualLeaveBalance(
  hireDate: string | null,
  entries: Pick<LeaveEntry, "work_date" | "leave_type" | "minutes">[],
  today: Date = new Date()
): LeaveBalanceComputed | null {
  if (!hireDate) return null;
  const period = currentAnnualLeavePeriod(today);
  const years = yearsBetween(new Date(hireDate), new Date(period.start));
  const quota = annualLeaveQuota(years);
  const used = usedLeaveDays(entries, "特休", period);
  return { period, quota, used, remaining: quota - used };
}

export function computeMenstrualLeaveBalance(
  entries: Pick<LeaveEntry, "work_date" | "leave_type" | "minutes">[],
  today: Date = new Date()
): LeaveBalanceComputed {
  const period = currentMenstrualLeavePeriod(today);
  const used = usedLeaveDays(entries, "生理假", period);
  return {
    period,
    quota: MENSTRUAL_LEAVE_ANNUAL_QUOTA,
    used,
    remaining: MENSTRUAL_LEAVE_ANNUAL_QUOTA - used,
  };
}
