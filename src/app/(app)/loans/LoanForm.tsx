"use client";

import { useState } from "react";
import type { LoanInput } from "@/types/database";
import { errorMessage } from "@/lib/errors";

interface LoanFormProps {
  initial?: Partial<LoanInput>;
  onSubmit: (input: LoanInput) => Promise<void>;
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

export function LoanForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "新增貸款",
}: LoanFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [principalTotal, setPrincipalTotal] = useState(
    field(initial?.principal_total ?? 0)
  );
  const [hasInterest, setHasInterest] = useState(
    initial?.has_interest ?? true
  );
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(
    field(initial?.default_payment_amount)
  );
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [dueDay, setDueDay] = useState(field(initial?.due_day));
  const [totalInstallments, setTotalInstallments] = useState(
    field(initial?.total_installments)
  );
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
        category: category.trim() || null,
        principal_total: Number(principalTotal) || 0,
        has_interest: hasInterest,
        default_payment_amount: numOrNull(defaultPaymentAmount),
        start_date: startDate || null,
        due_day: numOrNull(dueDay),
        total_installments: numOrNull(totalInstallments),
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
        <span className={capCls}>名稱</span>
        <input
          value={name}
          list="known-loan-names"
          onChange={(e) => setName(e.target.value)}
          required
          className={inputCls}
        />
        <datalist id="known-loan-names">
          <option value="富邦學貸" />
          <option value="台銀學貸" />
          <option value="媽媽" />
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>分類</span>
        <input
          value={category}
          list="known-loan-categories"
          placeholder="例如 學貸、孝親費"
          onChange={(e) => setCategory(e.target.value)}
          className={inputCls}
        />
        <datalist id="known-loan-categories">
          <option value="學貸" />
          <option value="孝親費" />
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>借款總額</span>
        <input
          type="number"
          step="0.01"
          value={principalTotal}
          onChange={(e) => setPrincipalTotal(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={`${labelCls} justify-end`}>
        <span className={capCls}>計算利息</span>
        <label className="flex items-center gap-2 py-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={hasInterest}
            onChange={(e) => setHasInterest(e.target.checked)}
          />
          有利息
        </label>
      </label>

      <label className={labelCls}>
        <span className={capCls}>開始還款日</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>每月還款日</span>
        <input
          type="number"
          min={1}
          max={31}
          value={dueDay}
          placeholder="1-31"
          onChange={(e) => setDueDay(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>每期預設還款本金</span>
        <input
          type="number"
          step="0.01"
          value={defaultPaymentAmount}
          placeholder="選填，方便快速輸入"
          onChange={(e) => setDefaultPaymentAmount(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>總期數</span>
        <input
          type="number"
          value={totalInstallments}
          placeholder="選填"
          onChange={(e) => setTotalInstallments(e.target.value)}
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
