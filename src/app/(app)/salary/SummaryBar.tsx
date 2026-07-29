"use client";

import { formatCurrency } from "@/lib/format";
import { summarizeSalaryRecord } from "@/lib/calc/salary";
import type { OvertimeEntry, SalaryRecord } from "@/types/database";

interface SummaryBarProps {
  record: SalaryRecord;
  overtimeEntries: OvertimeEntry[];
  onPayDateChange: (date: string) => void;
}

export function SummaryBar({
  record,
  overtimeEntries,
  onPayDateChange,
}: SummaryBarProps) {
  const totals = summarizeSalaryRecord(record, overtimeEntries);

  return (
    <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          發薪日
          <input
            type="date"
            value={record.pay_date ?? ""}
            onChange={(e) => onPayDateChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white"
          />
        </label>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <div className="text-slate-400">應發合計</div>
            <div className="text-lg font-semibold">
              {formatCurrency(totals.grossPay)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">扣除合計</div>
            <div className="text-lg font-semibold text-rose-300">
              -{formatCurrency(totals.deductions)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">實發金額</div>
            <div className="text-xl font-bold">
              {formatCurrency(totals.netPay)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
