"use client";

import { useState } from "react";
import type { CardRewardRuleInput } from "@/types/database";
import { errorMessage } from "@/lib/errors";
import { REWARD_CURRENCIES } from "@/lib/calc/cardRewards";

interface CardRewardRuleFormProps {
  initial?: Partial<CardRewardRuleInput>;
  knownPlanGroups?: string[];
  onSubmit: (input: CardRewardRuleInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const KNOWN_CARDS = [
  "星展ECO",
  "國泰CUBE",
  "台新RICHART",
  "永豐DAWHO",
  "永豐幣倍",
  "聯邦linebank",
  "富邦J卡",
  "兆豐e秒刷",
];

const CHANNEL_SUGGESTIONS = ["一般消費", "網路購物", "海外消費", "行動支付", "超商", "加油"];

function field(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function CardRewardRuleForm({
  initial,
  knownPlanGroups = [],
  onSubmit,
  onCancel,
  submitLabel = "新增規則",
}: CardRewardRuleFormProps) {
  const [cardName, setCardName] = useState(initial?.card_name ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "");
  const [currencyScope, setCurrencyScope] = useState(initial?.currency_scope ?? "");
  const [rate, setRate] = useState(field(initial?.rate ?? 0));
  const [maxReward, setMaxReward] = useState(field(initial?.max_reward));
  const [planGroup, setPlanGroup] = useState(initial?.plan_group ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = cardName.trim() !== "" && channel.trim() !== "" && rate.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        card_name: cardName.trim(),
        channel: channel.trim(),
        currency_scope: currencyScope || null,
        rate: Number(rate) || 0,
        max_reward: numOrNull(maxReward),
        plan_group: planGroup.trim() || null,
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
          value={cardName}
          list="known-reward-cards"
          onChange={(e) => setCardName(e.target.value)}
          required
          className={inputCls}
        />
        <datalist id="known-reward-cards">
          {KNOWN_CARDS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>消費通路</span>
        <input
          value={channel}
          list="known-channels"
          onChange={(e) => setChannel(e.target.value)}
          required
          className={inputCls}
        />
        <datalist id="known-channels">
          {CHANNEL_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>限定幣別</span>
        <select
          value={currencyScope}
          onChange={(e) => setCurrencyScope(e.target.value)}
          className={inputCls}
        >
          <option value="">不限</option>
          {REWARD_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className={labelCls}>
        <span className={capCls}>回饋比例 (%)</span>
        <input
          type="number"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>回饋上限 (台幣，選填)</span>
        <input
          type="number"
          step="1"
          value={maxReward}
          onChange={(e) => setMaxReward(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        <span className={capCls}>互斥方案分組 (選填)</span>
        <input
          value={planGroup}
          list="known-plan-groups"
          placeholder="例如 CUBE方案"
          onChange={(e) => setPlanGroup(e.target.value)}
          className={inputCls}
        />
        <datalist id="known-plan-groups">
          {knownPlanGroups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <span className="text-xs text-slate-400">
          同一分組同時間只能啟用一個方案（例如國泰CUBE、台新Richart），一般消費/固定加碼留空
        </span>
      </label>

      <label className={`${labelCls} col-span-2 sm:col-span-4`}>
        <span className={capCls}>備註</span>
        <input
          value={note}
          placeholder="例如活動期限、需事先登錄"
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
