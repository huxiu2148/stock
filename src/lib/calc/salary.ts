import type { SalaryRecord } from "@/types/database";
import { computeOvertimePay, estimateHourlyWage } from "./overtime";
import type { OvertimeEntry } from "@/types/database";

export function baseSalaryTotal(record: {
  base_basic: number;
  base_position: number;
  base_meal: number;
  base_other: number;
  base_other_allowance: number;
  base_night_shift: number;
}): number {
  return (
    record.base_basic +
    record.base_position +
    record.base_meal +
    record.base_other +
    record.base_other_allowance +
    record.base_night_shift
  );
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
  entries: Pick<OvertimeEntry, "minutes">[],
  hourlyWage: number
): OvertimeSummary {
  return entries.reduce<OvertimeSummary>(
    (acc, e) => {
      const { pay, mealAllowance } = computeOvertimePay(e.minutes, hourlyWage);
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
  grossPay: number;
  netPay: number;
}

export function summarizeSalaryRecord(
  record: SalaryRecord,
  overtimeEntries: Pick<OvertimeEntry, "minutes">[]
): SalaryTotals {
  const baseSalary = baseSalaryTotal(record);
  const deductions = deductionsTotal(record);
  const hourlyWage = record.hourly_wage ?? estimateHourlyWage(baseSalary);
  const overtime = summarizeOvertime(overtimeEntries, hourlyWage);

  const overtimeTotal =
    record.overtime_pay_override ??
    overtime.totalPay + overtime.totalMealAllowance;

  const grossPay =
    baseSalary + record.performance_bonus + record.bonus + overtimeTotal;
  const netPay = grossPay - deductions;

  return {
    baseSalary,
    deductions,
    overtimePay: overtime.totalPay,
    mealAllowance: overtime.totalMealAllowance,
    grossPay,
    netPay,
  };
}
