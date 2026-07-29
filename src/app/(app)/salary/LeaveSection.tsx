"use client";

import { useState } from "react";
import { TimeRangeForm } from "@/components/TimeRangeForm";
import { formatMinutes, workMinutesBetween, WORK_HOURS } from "@/lib/calc/time";
import { LEAVE_TYPES, type LeaveEntry, type LeaveType } from "@/types/database";

interface LeaveSectionProps {
  entries: LeaveEntry[];
  onAdd: (entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    leave_type: LeaveType;
    note?: string;
  }) => Promise<void>;
  onDelete: (id: string) => void;
}

export function LeaveSection({ entries, onAdd, onDelete }: LeaveSectionProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>("特休");

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold text-slate-700">請假紀錄</h2>

      <div className="mt-3">
        <TimeRangeForm
          submitLabel="新增請假"
          computeMinutes={workMinutesBetween}
          durationHint="已扣除午休"
          quickFill={{
            label: "全天",
            start: WORK_HOURS.start,
            end: WORK_HOURS.end,
          }}
          extraFields={
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">假別</span>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          }
          onSubmit={(entry) => onAdd({ ...entry, leave_type: leaveType })}
        />
      </div>

      {entries.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {entry.leave_type}
                </span>
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
              <button
                onClick={() => onDelete(entry.id)}
                className="text-xs text-slate-400 hover:text-rose-600"
              >
                刪除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
