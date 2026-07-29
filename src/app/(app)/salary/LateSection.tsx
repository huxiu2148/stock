"use client";

import { TimeRangeForm } from "@/components/TimeRangeForm";
import { formatMinutes } from "@/lib/calc/time";
import type { LateEntry } from "@/types/database";

interface LateSectionProps {
  entries: LateEntry[];
  onAdd: (entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    note?: string;
  }) => Promise<void>;
  onDelete: (id: string) => void;
}

export function LateSection({ entries, onAdd, onDelete }: LateSectionProps) {
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
        <TimeRangeForm onSubmit={onAdd} submitLabel="新增遲到" />
      </div>

      {entries.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {entries.map((entry) => (
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
