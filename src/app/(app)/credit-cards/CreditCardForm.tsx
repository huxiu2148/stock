"use client";

import { useState } from "react";
import type { Currency, CreditCardInput } from "@/types/database";
import { errorMessage } from "@/lib/errors";

interface CreditCardFormProps {
  initial?: Partial<CreditCardInput>;
  onSubmit: (input: CreditCardInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

function field(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function CreditCardForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "新增卡片",
}: CreditCardFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "TWD");
  const [openedDate, setOpenedDate] = useState(initial?.opened_date ?? "");
  const [statementDay, setStatementDay] = useState(field(initial?.statement_day));
  const [postDay, setPostDay] = useState(field(initial?.post_day));
  const [debitDay, setDebitDay] = useState(field(initial?.debit_day));
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        currency,
        opened_date: openedDate || null,
        statement_day: numOrNull(statementDay),
        post_day: numOrNull(postDay),
        debit_day: numOrNull(debitDay),
        note: note.trim() || null,
      });
    } catch (err) {
      setError(errorMessage(err, "儲存失敗"));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "flex flex-col gap-1";
  const capCls = "text-xs font-medium text-slate-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4"
    >
      <label className={labelCls}>
        <span className={capCls}>卡片名稱</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>結算幣別</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className={inputCls}
        >
          <option value="TWD">台幣</option>
          <option value="USD">美金</option>
        </select>
      </label>
      <label className={labelCls}>
        <span className={capCls}>辦卡日</span>
        <input
          type="date"
          value={openedDate}
          onChange={(e) => setOpenedDate(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>結帳日</span>
        <input
          type="number"
          min={1}
          max={31}
          value={statementDay}
          placeholder="1-31"
          onChange={(e) => setStatementDay(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>入帳日</span>
        <input
          type="number"
          min={1}
          max={31}
          value={postDay}
          placeholder="1-31"
          onChange={(e) => setPostDay(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>扣款日</span>
        <input
          type="number"
          min={1}
          max={31}
          value={debitDay}
          placeholder="1-31"
          onChange={(e) => setDebitDay(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={`${labelCls} col-span-2 sm:col-span-4`}>
        <span className={capCls}>備註</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </label>

      {error && <p className="col-span-2 text-xs text-rose-600 sm:col-span-4">{error}</p>}
      <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
        <button
          type="submit"
          disabled={saving || !valid}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "儲存中…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
