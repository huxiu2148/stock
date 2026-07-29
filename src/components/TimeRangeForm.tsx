"use client";

import { useMemo, useState } from "react";
import { minutesBetween, formatMinutes } from "@/lib/calc/time";

interface QuickFill {
  label: string;
  start: string;
  end: string;
}

interface TimeRangeFormProps {
  onSubmit: (entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    note?: string;
  }) => Promise<void> | void;
  extraFields?: React.ReactNode;
  submitLabel?: string;
  /** 分鐘數計算方式，預設用起訖時間直接相減；請假/遲到可傳入會扣除午休的版本。 */
  computeMinutes?: (start: string, end: string) => number;
  /** 開始時間欄位的預設值，例如遲到紀錄可預設為正常上班時間。 */
  defaultStartTime?: string;
  /** 快捷按鈕，例如請假選「全天」直接帶入上下班時間。 */
  quickFill?: QuickFill;
  /** 時長旁的補充說明，例如提醒已扣除午休時間。 */
  durationHint?: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function TimeRangeForm({
  onSubmit,
  extraFields,
  submitLabel = "新增紀錄",
  computeMinutes = minutesBetween,
  defaultStartTime = "",
  quickFill,
  durationHint,
}: TimeRangeFormProps) {
  const [workDate, setWorkDate] = useState(todayStr());
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const minutes = useMemo(
    () => (startTime && endTime ? computeMinutes(startTime, endTime) : 0),
    [startTime, endTime, computeMinutes]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || minutes <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        minutes,
        note: note.trim() || undefined,
      });
      setStartTime(defaultStartTime);
      setEndTime("");
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">日期</span>
        <input
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          required
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">開始時間</span>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">結束時間</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      {quickFill && (
        <button
          type="button"
          onClick={() => {
            setStartTime(quickFill.start);
            setEndTime(quickFill.end);
          }}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
        >
          {quickFill.label}
        </button>
      )}
      {extraFields}
      <label className="flex flex-1 min-w-32 flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">備註 (選填)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-slate-400">
          {minutes > 0
            ? `${formatMinutes(minutes)}${durationHint ? `（${durationHint}）` : ""}`
            : " "}
        </span>
        <button
          type="submit"
          disabled={saving || minutes <= 0}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          {saving ? "儲存中…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
