"use client";

import { useState } from "react";
import type { LeaveBalance, LeaveType } from "@/types/database";

// 只有特休、生理假需要追蹤剩餘天數；其他假別只記錄請假時間，不需要天數上限。
const BALANCE_LEAVE_TYPES: LeaveType[] = ["特休", "生理假"];

interface LeaveBalanceSectionProps {
  balances: LeaveBalance[];
  onSave: (leaveType: LeaveType, days: number, note: string) => void;
}

function BalanceEditor({
  leaveType,
  balance,
  onSave,
}: {
  leaveType: LeaveType;
  balance?: LeaveBalance;
  onSave: (leaveType: LeaveType, days: number, note: string) => void;
}) {
  const [days, setDays] = useState(String(balance?.remaining_days ?? ""));
  const [note, setNote] = useState(balance?.as_of_note ?? "");
  const [prevBalance, setPrevBalance] = useState(balance);

  if (balance !== prevBalance) {
    setPrevBalance(balance);
    setDays(String(balance?.remaining_days ?? ""));
    setNote(balance?.as_of_note ?? "");
  }

  const commit = () => {
    const parsed = Number(days);
    onSave(leaveType, Number.isNaN(parsed) ? 0 : parsed, note.trim());
  };

  return (
    <div className="rounded-xl bg-rose-50 p-3">
      <div className="text-xs font-medium text-rose-700">{leaveType}剩餘</div>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          onBlur={commit}
          className="w-16 rounded-md border border-rose-200 bg-white px-2 py-1 text-sm"
        />
        <span className="text-sm text-rose-700">天</span>
      </div>
      <input
        type="text"
        value={note}
        placeholder="備註，如 ~2025/12/31"
        onChange={(e) => setNote(e.target.value)}
        onBlur={commit}
        className="mt-1 w-full rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 placeholder:text-rose-300"
      />
    </div>
  );
}

export function LeaveBalanceSection({
  balances,
  onSave,
}: LeaveBalanceSectionProps) {
  const byType = new Map(balances.map((b) => [b.leave_type, b]));

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold text-slate-700">假別剩餘天數</h2>
      <p className="mt-1 text-xs text-slate-400">
        手動維護，就像試算表上的紅字提醒；請假後自行更新剩餘天數。
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BALANCE_LEAVE_TYPES.map((t) => (
          <BalanceEditor
            key={t}
            leaveType={t}
            balance={byType.get(t)}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  );
}
