"use client";

import { formatYearMonth } from "@/lib/format";

interface YearMonthPickerProps {
  months: string[];
  selected: string;
  onSelect: (yearMonth: string) => void;
  onAddMonth: (yearMonth: string) => void;
  onDeleteMonth: (yearMonth: string) => void;
}

export function YearMonthPicker({
  months,
  selected,
  onSelect,
  onAddMonth,
  onDeleteMonth,
}: YearMonthPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {months.map((m) => (
        <span
          key={m}
          className={`group flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1.5 text-sm font-medium transition ${
            m === selected
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
          }`}
        >
          <button onClick={() => onSelect(m)}>{formatYearMonth(m)}</button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`確定要刪除 ${formatYearMonth(m)} 這個月份的紀錄嗎？`)) {
                onDeleteMonth(m);
              }
            }}
            title="刪除這個月份"
            className={`rounded-full px-1 text-xs opacity-60 hover:opacity-100 ${
              m === selected ? "hover:bg-slate-700" : "hover:bg-slate-200"
            }`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="month"
        onChange={(e) => {
          if (e.target.value) {
            onAddMonth(e.target.value);
            e.target.value = "";
          }
        }}
        className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-400"
        title="新增月份"
      />
    </div>
  );
}
