"use client";

import { useState } from "react";

interface MoneyInputProps {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  placeholder?: string;
  step?: string;
}

/** 數字輸入框：值為 0 時顯示空白，避免畫面被一堆 0 洗版。 */
export function MoneyInput({ label, value, onCommit, placeholder, step }: MoneyInputProps) {
  const [text, setText] = useState(value === 0 ? "" : String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setText(value === 0 ? "" : String(value));
  }

  const commit = () => {
    const parsed = Number(text);
    const next = text.trim() === "" || Number.isNaN(parsed) ? 0 : parsed;
    setText(next === 0 ? "" : String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={text}
        placeholder={placeholder ?? "0"}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}
