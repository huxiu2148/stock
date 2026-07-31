"use client";

import { useState } from "react";
import type { Loan, LoanPaymentInput } from "@/types/database";
import { errorMessage } from "@/lib/errors";

interface LoanPaymentFormProps {
  loan: Loan;
  initial?: Partial<LoanPaymentInput>;
  defaultPayDate: string;
  onSubmit: (input: LoanPaymentInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

function field(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

export function LoanPaymentForm({
  loan,
  initial,
  defaultPayDate,
  onSubmit,
  onCancel,
  submitLabel = "新增還款",
}: LoanPaymentFormProps) {
  const [payDate, setPayDate] = useState(initial?.pay_date ?? defaultPayDate);
  const [principalPaid, setPrincipalPaid] = useState(
    field(initial?.principal_paid ?? loan.default_payment_amount ?? undefined)
  );
  const [interestPaid, setInterestPaid] = useState(
    field(initial?.interest_paid ?? 0)
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = payDate !== "" && principalPaid.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        loan_id: loan.id,
        pay_date: payDate,
        principal_paid: Number(principalPaid) || 0,
        interest_paid: loan.has_interest ? Number(interestPaid) || 0 : 0,
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
      className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4"
    >
      <label className={labelCls}>
        <span className={capCls}>還款日</span>
        <input
          type="date"
          value={payDate}
          onChange={(e) => setPayDate(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>還款本金</span>
        <input
          type="number"
          step="0.01"
          value={principalPaid}
          onChange={(e) => setPrincipalPaid(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      {loan.has_interest && (
        <label className={labelCls}>
          <span className={capCls}>還款利息</span>
          <input
            type="number"
            step="0.01"
            value={interestPaid}
            onChange={(e) => setInterestPaid(e.target.value)}
            className={inputCls}
          />
        </label>
      )}
      <label className={labelCls}>
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
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
        >
          取消
        </button>
      </div>
    </form>
  );
}
