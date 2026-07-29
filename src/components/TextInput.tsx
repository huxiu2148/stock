"use client";

import { useState } from "react";

interface TextInputProps {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ label, value, onCommit, placeholder }: TextInputProps) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }

  const commit = () => {
    const trimmed = text.trim();
    setText(trimmed);
    if (trimmed !== value) onCommit(trimmed);
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type="text"
        value={text}
        placeholder={placeholder}
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
