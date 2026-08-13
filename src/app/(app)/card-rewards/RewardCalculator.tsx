"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  CHANNEL_CATEGORIES,
  MERCHANT_KEYWORD_LIST,
  REWARD_CURRENCIES,
  getPlanOptions,
  groupRulesByCard,
  matchMerchantCategories,
  matchedMerchantKeywords,
  pickBestPlanChannel,
  rankCardRewards,
  type ChannelCategory,
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
  const [manualCategory, setManualCategory] = useState<ChannelCategory | "">("");
  const [activePlanByCard, setActivePlanByCard] = useState<Record<string, string>>({});

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
  const autoCategories = useMemo(() => matchMerchantCategories(merchant), [merchant]);
  const matchedKeywords = useMemo(() => matchedMerchantKeywords(merchant), [merchant]);
  const categories = useMemo(
    () => (manualCategory ? [manualCategory] : autoCategories),
    [manualCategory, autoCategories]
  );

  // 消費類別換了 (打了新商店) 就清掉手動選過的方案，改回自動判斷最匹配的方案。
  const categoriesKey = categories.join(",");
  const [prevCategoriesKey, setPrevCategoriesKey] = useState(categoriesKey);
  if (categoriesKey !== prevCategoriesKey) {
    setPrevCategoriesKey(categoriesKey);
    setActivePlanByCard({});
  }

  // 有些卡片 (國泰CUBE、台新Richart) 同時間只能啟用一個方案，這裡算出每張卡有哪些方案可選。
  const planOptionsByCard = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPlanOptions>>();
    for (const [cardName, cardRules] of rulesByCard) {
      const options = getPlanOptions(cardRules);
      if (options.length > 0) map.set(cardName, options);
    }
    return map;
  }, [rulesByCard]);

  // 尚未手動選過方案的卡片，自動選出跟這次消費最匹配的方案 (實際上本來就會先切換再刷)。
  const resolvedActivePlanByCard = useMemo(() => {
    const record: Record<string, string> = {};
    for (const [cardName, options] of planOptionsByCard) {
      record[cardName] =
        activePlanByCard[cardName] ?? pickBestPlanChannel(options, merchant, categories);
    }
    return record;
  }, [planOptionsByCard, activePlanByCard, merchant, categories]);

  const hasAmount = Number(amount) > 0;

  const results = useMemo(() => {
    const amountNum = Number(amount) || 0;
    return rankCardRewards(
      rulesByCard,
      {
        amount: amountNum,
        currency,
        exchangeRate: currency === "TWD" ? 1 : Number(exchangeRate) || 1,
        merchantText: merchant,
        categories,
      },
      resolvedActivePlanByCard
    );
  }, [rulesByCard, amount, currency, exchangeRate, merchant, categories, resolvedActivePlanByCard]);

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
        <label className={labelCls}>
          <span className={capCls}>消費商店/通路</span>
          <input
            value={merchant}
            list="known-merchant-keywords"
            placeholder="例如 pchome、7-11、日本 SOGO"
            onChange={(e) => setMerchant(e.target.value)}
            className={inputCls}
          />
          <datalist id="known-merchant-keywords">
            {MERCHANT_KEYWORD_LIST.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>
        <label className={labelCls}>
          <span className={capCls}>手動指定類別 (選填)</span>
          <select
            value={manualCategory}
            onChange={(e) => setManualCategory(e.target.value as ChannelCategory | "")}
            className={inputCls}
          >
            <option value="">自動判斷</option>
            {CHANNEL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {currency !== "TWD" && Number(amount) > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {Number(amount).toLocaleString("zh-TW")} {currency} ≈{" "}
          {formatCurrency(Number(amount) * (Number(exchangeRate) || 0))}
        </p>
      )}

      <p className="mt-2 text-xs text-slate-400">
        {manualCategory
          ? `已手動指定為：${manualCategory}`
          : merchant.trim() === ""
          ? "輸入商店名稱後，會自動判斷消費類別，辨識不到時也可以手動指定"
          : autoCategories.length > 0
          ? `符合關鍵字：${matchedKeywords.join("、")} → 辨識為：${autoCategories.join("、")}`
          : "無法辨識通路類別，僅計算一般消費回饋（也可以手動指定類別）"}
      </p>
      {categories.includes("海外消費") || categories.includes("日韓消費") ? (
        <p className="mt-1 text-xs text-amber-600">
          提醒：多數卡片的海外/日韓加碼只認「當地面對面刷卡」，網路平台即使是海外/日韓公司
          (例如 Weverse) 通常不算，實際是否符合請以該筆消費的實際刷卡地點/方式為準。
        </p>
      ) : null}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {!hasAmount && (
            <p className="text-xs text-slate-400">
              未輸入金額，以下依回饋比例排序（沒有計算上限的實際扣抵金額）
            </p>
          )}
          {results.map((r, i) => {
            const planOptions = planOptionsByCard.get(r.cardName);
            const activePlan = resolvedActivePlanByCard[r.cardName];
            return (
              <div
                key={r.cardName}
                className={`rounded-xl p-3 ${
                  i === 0 && r.rule ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-800">
                    {i === 0 && r.rule && "🏆 "}
                    {r.cardName}
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {hasAmount ? formatCurrency(r.reward) : r.rule ? `${r.rule.rate}%` : "—"}
                  </div>
                </div>

                {planOptions && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {planOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setActivePlanByCard((prev) => ({
                            ...prev,
                            [r.cardName]: opt.channel,
                          }))
                        }
                        className={`rounded-full px-2 py-0.5 text-xs transition ${
                          activePlan === opt.channel
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {opt.channel}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-1 text-xs text-slate-400">
                  {r.rule ? (
                    <>
                      {r.rule.plan_group && (
                        <span className="mr-1 text-emerald-600">
                          請切換至「{r.rule.channel}」方案 ·
                        </span>
                      )}
                      {r.rule.channel} · {r.rule.rate}%
                      {r.rule.max_reward
                        ? ` (上限 ${formatCurrency(r.rule.max_reward)})`
                        : ""}
                    </>
                  ) : (
                    "尚未設定符合的回饋規則"
                  )}
                </div>

                {r.rule?.requires_registration && (
                  <div className="mt-1 text-xs font-medium text-amber-600">
                    ⚠️ 需要登錄{r.rule.registration_note ? `：${r.rule.registration_note}` : ""}
                  </div>
                )}
                {r.rule?.payment_method_note && (
                  <div className="mt-1 text-xs text-amber-600">
                    💳 {r.rule.payment_method_note}
                  </div>
                )}
                {r.rule?.note && (
                  <div className="mt-1 text-xs text-slate-400">{r.rule.note}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
