import type { LateEntry, LeaveEntry, LeaveType, SalaryRecord } from "@/types/database";
import { computeOvertimePayForRange, estimateHourlyWage } from "./overtime";
import { summarizeLeaveDeduction } from "./leave";
import type { OvertimeEntry } from "@/types/database";

/**
 * 遲到扣款：全額依時薪比例扣，時薪=底薪/30/8。
 * 先加總整個月的遲到分鐘數，最後才四捨五入一次，避免每筆個別捨入
 * 造成誤差累積（例如 3+6+2 分鐘應視為 11 分鐘一次計算）。
 */
export function summarizeLateDeduction(
  entries: Pick<LateEntry, "minutes">[],
  hourlyWage: number
): { totalMinutes: number; totalDeduction: number } {
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const totalDeduction = Math.round((totalMinutes / 60) * hourlyWage);
  return { totalMinutes, totalDeduction };
}

export function baseSalaryTotal(record: {
  base_basic: number;
  base_position: number;
  base_meal: number;
  base_other: number;
  base_other_allowance: number;
  base_night_shift: number;
  base_evaluation_bonus: number;
}): number {
  return (
    record.base_basic +
    record.base_position +
    record.base_meal +
    record.base_other +
    record.base_other_allowance +
    record.base_night_shift +
    record.base_evaluation_bonus
  );
}

/** 時薪試算基礎：底薪組成 + 考績獎金（不含獎金、三節獎金）。 */
export function hourlyWageBase(record: {
  base_basic: number;
  base_position: number;
  base_meal: number;
  base_other: number;
  base_other_allowance: number;
  base_night_shift: number;
  base_evaluation_bonus: number;
  performance_bonus: number;
}): number {
  return baseSalaryTotal(record) + record.performance_bonus;
}

export function deductionsTotal(record: {
  deduct_welfare: number;
  deduct_labor_insurance: number;
  deduct_health_insurance: number;
  deduct_labor_pension_self: number;
  deduct_guarantee_insurance: number;
}): number {
  return (
    record.deduct_welfare +
    record.deduct_labor_insurance +
    record.deduct_health_insurance +
    record.deduct_labor_pension_self +
    record.deduct_guarantee_insurance
  );
}

export interface OvertimeSummary {
  totalMinutes: number;
  totalPay: number;
  totalMealAllowance: number;
}

export function summarizeOvertime(
  entries: Pick<OvertimeEntry, "minutes" | "start_time" | "end_time" | "is_holiday">[],
  hourlyWage: number
): OvertimeSummary {
  return entries.reduce<OvertimeSummary>(
    (acc, e) => {
      const { pay, mealAllowance } = computeOvertimePayForRange(
        e.start_time,
        e.end_time,
        hourlyWage,
        e.is_holiday
      );
      return {
        totalMinutes: acc.totalMinutes + e.minutes,
        totalPay: acc.totalPay + pay,
        totalMealAllowance: acc.totalMealAllowance + mealAllowance,
      };
    },
    { totalMinutes: 0, totalPay: 0, totalMealAllowance: 0 }
  );
}

export interface SalaryTotals {
  baseSalary: number;
  deductions: number;
  overtimePay: number;
  mealAllowance: number;
  leaveDeduction: number;
  lateDeduction: number;
  grossPay: number;
  netPay: number;
}

export function summarizeSalaryRecord(
  record: SalaryRecord,
  overtimeEntries: Pick<OvertimeEntry, "minutes" | "start_time" | "end_time" | "is_holiday">[],
  leaveEntries: Pick<LeaveEntry, "minutes" | "leave_type">[] = [],
  lateEntries: Pick<LateEntry, "minutes">[] = []
): SalaryTotals {
  const baseSalary = baseSalaryTotal(record);
  const deductions = deductionsTotal(record);
  const hourlyWage = record.hourly_wage ?? estimateHourlyWage(hourlyWageBase(record));
  const overtime = summarizeOvertime(overtimeEntries, hourlyWage);
  const leave = summarizeLeaveDeduction(
    leaveEntries as { minutes: number; leave_type: LeaveType }[],
    hourlyWage
  );
  const late = summarizeLateDeduction(lateEntries, hourlyWage);

  const overtimeTotal =
    record.overtime_pay_override ??
    overtime.totalPay + overtime.totalMealAllowance;

  const grossPay =
    baseSalary +
    record.performance_bonus +
    record.bonus +
    record.festival_bonus +
    overtimeTotal;
  const netPay = grossPay - deductions - leave.totalDeduction - late.totalDeduction;

  return {
    baseSalary,
    deductions,
    overtimePay: overtime.totalPay,
    mealAllowance: overtime.totalMealAllowance,
    leaveDeduction: leave.totalDeduction,
    lateDeduction: late.totalDeduction,
    grossPay,
    netPay,
  };
}

export interface YearlySalarySummary {
  year: string;
  monthCount: number;
  totalGross: number;
  totalNet: number;
  avgGross: number;
  avgNet: number;
}

export function summarizeYearlySalary(
  records: SalaryRecord[],
  overtimeEntries: OvertimeEntry[],
  leaveEntries: LeaveEntry[] = [],
  lateEntries: LateEntry[] = []
): YearlySalarySummary[] {
  const byYear = new Map<string, YearlySalarySummary>();

  for (const record of records) {
    const year = record.year_month.slice(0, 4);
    const entries = overtimeEntries.filter((e) =>
      e.work_date.startsWith(record.year_month)
    );
    const monthLeaveEntries = leaveEntries.filter((e) =>
      e.work_date.startsWith(record.year_month)
    );
    const monthLateEntries = lateEntries.filter((e) =>
      e.work_date.startsWith(record.year_month)
    );
    const totals = summarizeSalaryRecord(
      record,
      entries,
      monthLeaveEntries,
      monthLateEntries
    );

    const existing = byYear.get(year) ?? {
      year,
      monthCount: 0,
      totalGross: 0,
      totalNet: 0,
      avgGross: 0,
      avgNet: 0,
    };
    existing.monthCount += 1;
    existing.totalGross += totals.grossPay;
    existing.totalNet += totals.netPay;
    byYear.set(year, existing);
  }

  return Array.from(byYear.values())
    .map((y) => ({
      ...y,
      avgGross: y.monthCount ? y.totalGross / y.monthCount : 0,
      avgNet: y.monthCount ? y.totalNet / y.monthCount : 0,
    }))
    .sort((a, b) => (a.year < b.year ? 1 : -1));
}
