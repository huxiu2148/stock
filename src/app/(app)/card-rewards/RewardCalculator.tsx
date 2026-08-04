"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  REWARD_CURRENCIES,
  groupRulesByCard,
  rankCardRewards,
} from "@/lib/calc/cardRewards";
import type { CardRewardRule } from "@/types/database";

interface RewardCalculatorProps {
  rules: CardRewardRule[];
}

export function RewardCalculator({ rules }: RewardCalculatorProps) {
  const channels = useMemo(
    () => Array.from(new Set(rules.map((r) => r.channel))).sort(),
    [rules]
  );

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("TWD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [channel, setChannel] = useState(channels[0] ?? "");

  // 通路清單變動時 (新增/刪除規則)，若目前選的通路已經不存在，自動改選第一個。
  if (channels.length > 0 && !channels.includes(channel)) {
    setChannel(channels[0]);
  }

  const rulesByCard = useMemo(() => groupRulesByCard(rules), [rules]);

  const results = useMemo(() => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0 || !channel) return [];
    return rankCardRewards(rulesByCard, {
      amount: amountNum,
      currency,
      exchangeRate: Number(exchangeRate) || 1,
      channel,
    });
  }, [rulesByCard, amount, currency, exchangeRate, channel]);

  const inputCls =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "flex flex-col gap-1";
  const capCls = "text-xs font-medium text-slate-500";

  if (channels.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        請先在下方新增各卡片的回饋規則，才能試算。
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={labelCls}>
          <span className={capCls}>消費金額</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          <span className={capCls}>幣別</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputCls}
          >
            {REWARD_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {currency !== "TWD" && (
          <label className={labelCls}>
            <span className={capCls}>約略匯率 (換算台幣)</span>
            <input
              type="number"
              step="0.001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className={inputCls}
            />
          </label>
        )}
        <label className={labelCls}>
          <span className={capCls}>消費通路</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className={inputCls}
          >
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div
              key={r.cardName}
              className={`flex items-center justify-between rounded-xl p-3 ${
                i === 0 && r.rule ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-slate-50"
              }`}
            >
              <div>
                <div className="font-medium text-slate-800">
                  {i === 0 && r.rule && "🏆 "}
                  {r.cardName}
                </div>
                <div className="text-xs text-slate-400">
                  {r.rule
                    ? `${r.rule.channel} · ${r.rule.rate}%${
                        r.rule.max_reward ? ` (上限 ${formatCurrency(r.rule.max_reward)})` : ""
                      }`
                    : "尚未設定此通路的回饋規則"}
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(r.reward)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
