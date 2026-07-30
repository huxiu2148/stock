"use client";

import { useState } from "react";
import { TimeRangeForm } from "@/components/TimeRangeForm";
import { formatMinutes, workMinutesBetween, WORK_HOURS } from "@/lib/calc/time";
import type { LateEntry } from "@/types/database";

interface LateEntryInput {
  work_date: string;
  start_time: string;
  end_time: string;
  minutes: number;
  note?: string;
}

interface LateSectionProps {
  entries: LateEntry[];
  onAdd: (entry: LateEntryInput) => Promise<void>;
  onUpdate: (id: string, entry: LateEntryInput) => Promise<void>;
  onDelete: (id: string) => void;
  defaultDate?: string;
}

// 遲到超過 30 分鐘公司規定要改請假，08:10 開始所以結束時間最晚只能到 08:40。
const LATE_MAX_MINUTES = 30;
const LATE_END_TIME_MAX = "08:40";

export function LateSection({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  defaultDate,
}: LateSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">遲到紀錄</h2>
        <span className="text-sm text-slate-500">
          本月合計 <b className="text-slate-900">{formatMinutes(totalMinutes)}</b>
        </span>
      </div>

      <div className="mt-3">
        <TimeRangeForm
          onSubmit={onAdd}
          submitLabel="新增遲到"
          defaultStartTime={WORK_HOURS.start}
          computeMinutes={workMinutesBetween}
          defaultDate={defaultDate}
          endTimeMax={LATE_END_TIME_MAX}
          maxMinutes={LATE_MAX_MINUTES}
          maxMinutesMessage="遲到超過30分鐘請改用「請假紀錄」申請"
        />
      </div>

      {entries.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {entries.map((entry) =>
            editingId === entry.id ? (
              <li key={entry.id} className="py-2">
                <TimeRangeForm
                  initial={entry}
                  computeMinutes={workMinutesBetween}
                  endTimeMax={LATE_END_TIME_MAX}
                  maxMinutes={LATE_MAX_MINUTES}
                  maxMinutesMessage="遲到超過30分鐘請改用「請假紀錄」申請"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (updated) => {
                    await onUpdate(entry.id, updated);
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
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
                  <button
                    onClick={() => setEditingId(entry.id)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-xs text-slate-400 hover:text-rose-600"
                  >
                    刪除
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}
