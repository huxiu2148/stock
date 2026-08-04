"use client";

import { useState } from "react";
import type { CardUsageTipInput } from "@/types/database";
import { errorMessage } from "@/lib/errors";

interface CardUsageTipFormProps {
  initial?: Partial<CardUsageTipInput>;
  knownCardNames?: string[];
  onSubmit: (input: CardUsageTipInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const SCENARIO_SUGGESTIONS = ["網路購物", "加油", "超商", "百貨公司", "海外刷卡", "一般消費"];

export function CardUsageTipForm({
  initial,
  knownCardNames = [],
  onSubmit,
  onCancel,
  submitLabel = "新增紀錄",
}: CardUsageTipFormProps) {
  const [scenario, setScenario] = useState(initial?.scenario ?? "");
  const [cardName, setCardName] = useState(initial?.card_name ?? "");
  const [benefit, setBenefit] = useState(initial?.benefit ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = scenario.trim() !== "" && cardName.trim() !== "" && benefit.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        scenario: scenario.trim(),
        card_name: cardName.trim(),
        benefit: benefit.trim(),
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
        <span className={capCls}>情境</span>
        <input
          value={scenario}
          list="known-scenarios"
          placeholder="例如 網路購物"
          onChange={(e) => setScenario(e.target.value)}
          required
          className={inputCls}
        />
        <datalist id="known-scenarios">
          {SCENARIO_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>用哪張卡</span>
        <input
          value={cardName}
          list="known-card-names"
          onChange={(e) => setCardName(e.target.value)}
          required
          className={inputCls}
        />
        <datalist id="known-card-names">
          {knownCardNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </label>
      <label className={`${labelCls} col-span-2`}>
        <span className={capCls}>切換什麼權益最划算</span>
        <input
          value={benefit}
          placeholder="例如 登錄後享 5% 網購回饋"
          onChange={(e) => setBenefit(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={`${labelCls} col-span-2 sm:col-span-4`}>
        <span className={capCls}>備註</span>
        <input
          value={note}
          placeholder="例如活動期限、回饋上限、登錄網址"
          onChange={(e) => setNote(e.target.value)}
          className={inputCls}
        />
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
