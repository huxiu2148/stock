"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  REWARD_CURRENCIES,
  groupRulesByCard,
  matchMerchantCategories,
  rankCardRewards,
} from "@/lib/calc/cardRewards";
import type { CardRewardRule } from "@/types/database";

interface RewardCalculatorProps {
  rules: CardRewardRule[];
}

export function RewardCalculator({ rules }: RewardCalculatorProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("TWD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [rateError, setRateError] = useState<string | null>(null);
  const [fetchedCurrency, setFetchedCurrency] = useState<string | null>("TWD");
  const [merchant, setMerchant] = useState("");

  // 查詢中 = 已切換到非台幣幣別，但這個幣別的匯率還沒查完。
  const rateLoading = currency !== "TWD" && fetchedCurrency !== currency;

  // 幣別改變時自動查詢約略匯率，查不到的話仍可手動輸入/調整。
  useEffect(() => {
    if (currency === "TWD" || fetchedCurrency === currency) return;
    let cancelled = false;
    fetch(`/api/exchange-rate?from=${currency}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "查詢失敗");
        return data.rate as number;
      })
      .then((rate) => {
        if (cancelled) return;
        setExchangeRate(String(rate));
        setRateError(null);
        setFetchedCurrency(currency);
      })
      .catch((e) => {
        if (cancelled) return;
        setRateError(e instanceof Error ? e.message : "匯率查詢失敗，請手動輸入");
        setFetchedCurrency(currency);
      });
    return () => {
      cancelled = true;
    };
  }, [currency, fetchedCurrency]);

  const rulesByCard = useMemo(() => groupRulesByCard(rules), [rules]);
  const categories = useMemo(() => matchMerchantCategories(merchant), [merchant]);

  const results = useMemo(() => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) return [];
    return rankCardRewards(rulesByCard, {
      amount: amountNum,
      currency,
      exchangeRate: currency === "TWD" ? 1 : Number(exchangeRate) || 1,
      merchant,
    });
  }, [rulesByCard, amount, currency, exchangeRate, merchant]);

  const inputCls =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "flex flex-col gap-1";
  const capCls = "text-xs font-medium text-slate-500";

  if (rules.length === 0) {
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
            <span className={capCls}>約略匯率 (換算台幣){rateLoading ? "・查詢中…" : ""}</span>
            <input
              type="number"
              step="0.001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className={inputCls}
            />
            {rateError && <span className="text-xs text-rose-500">{rateError}</span>}
          </label>
        )}
        <label className={`${labelCls} col-span-2`}>
          <span className={capCls}>消費商店/通路</span>
          <input
            value={merchant}
            placeholder="例如 pchome、7-11、日本 SOGO"
            onChange={(e) => setMerchant(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {merchant.trim() === ""
          ? "輸入商店名稱後，會自動判斷消費類別"
          : categories.length > 0
          ? `辨識為：${categories.join("、")}`
          : "無法辨識通路類別，僅計算一般消費回饋"}
      </p>

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
                    : "尚未設定符合的回饋規則"}
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
