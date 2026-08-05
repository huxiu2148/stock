"use client";

import { useMemo, useState } from "react";
import { planStockSplit } from "@/lib/calc/stock";
import { errorMessage } from "@/lib/errors";
import type { StockTrade } from "@/types/database";

interface StockSplitFormProps {
  trades: StockTrade[];
  knownSymbols?: Record<string, string>;
  onApply: (
    adjustments: {
      tradeId: string;
      shares: number;
      target_sell_price: number | null;
      buy_price: number;
    }[]
  ) => Promise<void>;
  onCancel: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StockSplitForm({
  trades,
  knownSymbols = {},
  onApply,
  onCancel,
}: StockSplitFormProps) {
  const [symbol, setSymbol] = useState("");
  const [ratioBefore, setRatioBefore] = useState("1");
  const [ratioAfter, setRatioAfter] = useState("4");
  const [effectiveDate, setEffectiveDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratio = (Number(ratioAfter) || 0) / (Number(ratioBefore) || 1);
  const adjustments = useMemo(() => {
    if (!symbol.trim() || !ratio || ratio <= 0) return [];
    return planStockSplit(trades, symbol.trim(), effectiveDate, ratio);
  }, [trades, symbol, effectiveDate, ratio]);

  const inputCls =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "flex flex-col gap-1";
  const capCls = "text-xs font-medium text-slate-500";

  async function handleApply() {
    if (adjustments.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onApply(
        adjustments.map((a) => ({
          tradeId: a.tradeId,
          shares: a.after.shares,
          buy_price: a.after.buy_price,
          target_sell_price: a.after.target_sell_price,
        }))
      );
    } catch (err) {
      setError(errorMessage(err, "調整失敗"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-amber-50 p-4">
      <p className="text-xs text-slate-600">
        股票分割：把拆分日之前買進、還沒賣出的持股，依比例調整股數與每股價格，成本總額不變。
        已經賣出的舊紀錄不受影響。
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={labelCls}>
          <span className={capCls}>代碼</span>
          <input
            value={symbol}
            list="split-known-symbols"
            onChange={(e) => setSymbol(e.target.value)}
            className={inputCls}
          />
          <datalist id="split-known-symbols">
            {Object.entries(knownSymbols).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </datalist>
        </label>
        <label className={labelCls}>
          <span className={capCls}>分割前股數</span>
          <input
            type="number"
            value={ratioBefore}
            onChange={(e) => setRatioBefore(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          <span className={capCls}>分割後股數</span>
          <input
            type="number"
            value={ratioAfter}
            onChange={(e) => setRatioAfter(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          <span className={capCls}>生效日</span>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      {symbol.trim() && (
        <div className="mt-4">
          {adjustments.length === 0 ? (
            <p className="text-xs text-slate-400">
              找不到 {symbol}生效日之前、還沒賣出的持股，請確認代碼跟日期。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="py-1 pr-3">買進日</th>
                    <th className="py-1 pr-3">股數</th>
                    <th className="py-1 pr-3">買進價</th>
                    <th className="py-1 pr-3">理想賣出價</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((a) => (
                    <tr key={a.tradeId} className="border-t border-white">
                      <td className="py-1 pr-3 text-slate-600">{a.buyDate}</td>
                      <td className="py-1 pr-3">
                        {a.before.shares} → <strong>{a.after.shares}</strong>
                      </td>
                      <td className="py-1 pr-3">
                        {a.before.buy_price} → <strong>{a.after.buy_price.toFixed(2)}</strong>
                      </td>
                      <td className="py-1 pr-3">
                        {a.before.target_sell_price ?? "—"} →{" "}
                        <strong>
                          {a.after.target_sell_price != null
                            ? a.after.target_sell_price.toFixed(2)
                            : "—"}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={saving || adjustments.length === 0}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "套用中…" : `套用調整 (${adjustments.length} 筆)`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
        >
          取消
        </button>
      </div>
    </div>
  );
}
