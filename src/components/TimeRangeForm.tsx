"use client";

import { useMemo, useState } from "react";
import { minutesBetween, formatMinutes } from "@/lib/calc/time";

interface QuickFill {
  label: string;
  start: string;
  end: string;
}

interface TimeRangeFormInitial {
  work_date: string;
  start_time: string;
  end_time: string;
  note?: string | null;
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
  /** 結束時間欄位的預設值，讓小時/上下午先帶好，只需要改分鐘。 */
  defaultEndTime?: string;
  /** 快捷按鈕，例如請假選「全天」直接帶入上下班時間。 */
  quickFill?: QuickFill;
  /** 時長旁的補充說明，例如提醒已扣除午休時間。 */
  durationHint?: string;
  /** 日期欄位的預設值，例如查看某個月份時預設帶當月第一天。 */
  defaultDate?: string;
  /** 提供既有值以編輯現有紀錄，而非新增。 */
  initial?: TimeRangeFormInitial;
  /** 編輯模式下的取消按鈕。 */
  onCancel?: () => void;
  /** 結束時間欄位的上限，例如遲到最多只能記到 08:40（超過要改請假）。 */
  endTimeMax?: string;
  /** 結束時間欄位的下限，避免時間選擇器選到不合理的時段（如遲到選成下午）。 */
  endTimeMin?: string;
  /** 超過這個分鐘數就擋下並顯示 maxMinutesMessage，不能送出。 */
  maxMinutes?: number;
  /** 超過 maxMinutes 時顯示的提示文字。 */
  maxMinutesMessage?: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function TimeRangeForm({
  onSubmit,
  extraFields,
  submitLabel,
  computeMinutes = minutesBetween,
  defaultStartTime = "",
  defaultEndTime = "",
  quickFill,
  durationHint,
  defaultDate,
  initial,
  onCancel,
  endTimeMax,
  endTimeMin,
  maxMinutes,
  maxMinutesMessage,
}: TimeRangeFormProps) {
  const isEditing = Boolean(initial);
  const [workDate, setWorkDate] = useState(
    initial?.work_date ?? defaultDate ?? todayStr()
  );
  const [startTime, setStartTime] = useState(
    initial?.start_time ?? defaultStartTime
  );
  const [endTime, setEndTime] = useState(initial?.end_time ?? defaultEndTime);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevDefaultDate, setPrevDefaultDate] = useState(defaultDate);

  // 換月份時 defaultDate 會變，這裡直接在 render 期間同步，不用 remount 整個表單。
  if (!isEditing && defaultDate !== prevDefaultDate) {
    setPrevDefaultDate(defaultDate);
    setWorkDate(defaultDate ?? todayStr());
  }

  const minutes = useMemo(
    () => (startTime && endTime ? computeMinutes(startTime, endTime) : 0),
    [startTime, endTime, computeMinutes]
  );
  const exceedsMax = maxMinutes != null && minutes > maxMinutes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || minutes <= 0 || exceedsMax) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        minutes,
        note: note.trim() || undefined,
      });
      if (!isEditing) {
        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setNote("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
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
          max={endTimeMax}
          min={endTimeMin}
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
      {error && <p className="w-full text-xs text-rose-600">{error}</p>}
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
        <span className={`text-xs ${exceedsMax ? "text-rose-600" : "text-slate-400"}`}>
          {exceedsMax
            ? maxMinutesMessage ?? "超過上限，請改用其他紀錄方式"
            : minutes > 0
            ? `${formatMinutes(minutes)}${durationHint ? `（${durationHint}）` : ""}`
            : " "}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || minutes <= 0 || exceedsMax}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            {saving ? "儲存中…" : submitLabel ?? (isEditing ? "儲存變更" : "新增紀錄")}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              取消
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
