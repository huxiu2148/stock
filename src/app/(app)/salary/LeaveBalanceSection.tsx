"use client";

import { useState } from "react";
import type { LeaveEntry } from "@/types/database";
import {
  computeAnnualLeaveBalance,
  computeMenstrualLeaveBalance,
} from "@/lib/calc/leaveBalance";

interface LeaveBalanceSectionProps {
  leaveEntries: LeaveEntry[];
  hireDate: string | null;
  onSaveHireDate: (date: string) => void;
}

function BalanceCard({
  title,
  quota,
  used,
  remaining,
  periodLabel,
}: {
  title: string;
  quota: number;
  used: number;
  remaining: number;
  periodLabel: string;
}) {
  return (
    <div className="rounded-xl bg-rose-50 p-3">
      <div className="text-xs font-medium text-rose-700">{title}剩餘</div>
      <div className="text-lg font-bold text-rose-700">
        {Math.max(0, Math.round(remaining * 10) / 10)} 天
      </div>
      <div className="text-xs text-rose-400">
        總額 {quota} 天 · 已用 {Math.round(used * 10) / 10} 天
      </div>
      <div className="text-xs text-rose-300">{periodLabel}</div>
    </div>
  );
}

export function LeaveBalanceSection({
  leaveEntries,
  hireDate,
  onSaveHireDate,
}: LeaveBalanceSectionProps) {
  const [hireDateInput, setHireDateInput] = useState(hireDate ?? "");

  const annual = computeAnnualLeaveBalance(hireDate, leaveEntries);
  const menstrual = computeMenstrualLeaveBalance(leaveEntries);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold text-slate-700">假別剩餘天數</h2>
      <p className="mt-1 text-xs text-slate-400">
        依你的請假紀錄自動計算：特休依勞基法年資試算，每年 9/1 重新計算；生理假每年 12
        天，每年 1/1 重新計算。
      </p>

      {!hireDate && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-amber-50 p-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-amber-700">
              到職日 (計算特休天數用)
            </span>
            <input
              type="date"
              value={hireDateInput}
              onChange={(e) => setHireDateInput(e.target.value)}
              className="rounded-lg border border-amber-200 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            onClick={() => hireDateInput && onSaveHireDate(hireDateInput)}
            disabled={!hireDateInput}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            儲存到職日
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {annual && (
          <BalanceCard
            title="特休"
            quota={annual.quota}
            used={annual.used}
            remaining={annual.remaining}
            periodLabel={annual.period.label}
          />
        )}
        <BalanceCard
          title="生理假"
          quota={menstrual.quota}
          used={menstrual.used}
          remaining={menstrual.remaining}
          periodLabel={menstrual.period.label}
        />
      </div>
    </section>
  );
}
