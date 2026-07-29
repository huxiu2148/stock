"use client";

import { formatYearMonth } from "@/lib/format";

interface YearMonthPickerProps {
  months: string[];
  selected: string;
  onSelect: (yearMonth: string) => void;
  onAddMonth: (yearMonth: string) => void;
}

export function YearMonthPicker({
  months,
  selected,
  onSelect,
  onAddMonth,
}: YearMonthPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {months.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            m === selected
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
          }`}
        >
          {formatYearMonth(m)}
        </button>
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
