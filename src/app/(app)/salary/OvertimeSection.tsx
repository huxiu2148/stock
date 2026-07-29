"use client";

import { TimeRangeForm } from "@/components/TimeRangeForm";
import { MoneyInput } from "@/components/MoneyInput";
import { formatCurrency } from "@/lib/format";
import { formatMinutes } from "@/lib/calc/time";
import { computeOvertimePay, estimateHourlyWage } from "@/lib/calc/overtime";
import type { OvertimeEntry, SalaryRecord } from "@/types/database";
import { hourlyWageBase } from "@/lib/calc/salary";

interface OvertimeSectionProps {
  record: SalaryRecord;
  entries: OvertimeEntry[];
  onAdd: (entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    note?: string;
  }) => Promise<void>;
  onDelete: (id: string) => void;
  onOverrideChange: (value: number) => void;
  onClearOverride: () => void;
}

export function OvertimeSection({
  record,
  entries,
  onAdd,
  onDelete,
  onOverrideChange,
  onClearOverride,
}: OvertimeSectionProps) {
  const hourlyWage =
    record.hourly_wage ?? estimateHourlyWage(hourlyWageBase(record));

  const rows = entries.map((e) => ({
    entry: e,
    calc: computeOvertimePay(e.minutes, hourlyWage),
  }));
  const suggestedTotal = rows.reduce(
    (sum, r) => sum + r.calc.pay + r.calc.mealAllowance,
    0
  );
  const usingOverride = record.overtime_pay_override != null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">加班紀錄</h2>
        <span className="text-xs text-slate-400">
          時薪試算 {formatCurrency(hourlyWage)}／小時
        </span>
      </div>

      <div className="mt-3">
        <TimeRangeForm
          onSubmit={onAdd}
          submitLabel="新增加班"
        />
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map(({ entry, calc }) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-700">{entry.work_date}</span>
                <span className="text-slate-500">
                  {entry.start_time}–{entry.end_time}
                </span>
                <span className="text-slate-400">
                  {formatMinutes(entry.minutes)}
                </span>
                {entry.note && (
                  <span className="text-slate-400">· {entry.note}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600">
                  {formatCurrency(calc.pay)}
                  {calc.mealAllowance > 0 && (
                    <span className="text-slate-400">
                      {" "}
                      +誤餐 {formatCurrency(calc.mealAllowance)}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-xs text-slate-400 hover:text-rose-600"
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-xl bg-slate-50 p-3">
        <div className="text-sm text-slate-600">
          自動試算加班費(含誤餐費)合計：
          <b className="ml-1 text-slate-900">{formatCurrency(suggestedTotal)}</b>
        </div>
        <div className="flex items-end gap-2">
          <MoneyInput
            label="手動覆寫金額 (與實際薪資單不同時使用)"
            value={record.overtime_pay_override ?? 0}
            onCommit={(v) => (v === 0 ? onClearOverride() : onOverrideChange(v))}
          />
          {usingOverride && (
            <button
              onClick={onClearOverride}
              className="mb-1.5 text-xs text-slate-400 hover:text-slate-700"
            >
              改用自動試算
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
