"use client";

import { useState } from "react";
import type { Currency, Market, StockTradeInput } from "@/types/database";

interface StockFormProps {
  initial?: Partial<StockTradeInput>;
  onSubmit: (input: StockTradeInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  /** 代碼 -> 名稱，來自你之前輸入過的交易紀錄，用來自動帶出名稱。 */
  knownSymbols?: Record<string, string>;
}

function field(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function num(v: string): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function StockForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "新增交易",
  knownSymbols = {},
}: StockFormProps) {
  const [market, setMarket] = useState<Market>(initial?.market ?? "TW");
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? "TWD"
  );
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [nameTouched, setNameTouched] = useState(Boolean(initial?.name));
  const [buyDate, setBuyDate] = useState(
    initial?.buy_date ?? new Date().toISOString().slice(0, 10)
  );
  const [sellDate, setSellDate] = useState(initial?.sell_date ?? "");
  const [buyPrice, setBuyPrice] = useState(field(initial?.buy_price));
  const [targetSellPrice, setTargetSellPrice] = useState(
    field(initial?.target_sell_price)
  );
  const [actualSellPrice, setActualSellPrice] = useState(
    field(initial?.actual_sell_price)
  );
  const [shares, setShares] = useState(field(initial?.shares));
  const [feeBuy, setFeeBuy] = useState(field(initial?.fee_buy ?? 0));
  const [feeSell, setFeeSell] = useState(field(initial?.fee_sell ?? 0));
  const [tax, setTax] = useState(field(initial?.tax ?? 0));
  const [exBuy, setExBuy] = useState(field(initial?.exchange_rate_buy));
  const [exSell, setExSell] = useState(field(initial?.exchange_rate_sell));
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  const isUsd = market === "US" && currency === "USD";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        market,
        currency: market === "TW" ? "TWD" : currency,
        symbol: symbol.trim(),
        name: name.trim() || null,
        buy_date: buyDate,
        sell_date: sellDate || null,
        buy_price: num(buyPrice),
        target_sell_price: numOrNull(targetSellPrice),
        actual_sell_price: numOrNull(actualSellPrice),
        shares: num(shares),
        fee_buy: num(feeBuy),
        fee_sell: num(feeSell),
        tax: num(tax),
        exchange_rate_buy: isUsd ? numOrNull(exBuy) : null,
        exchange_rate_sell: isUsd ? numOrNull(exSell) : null,
        note: note.trim() || null,
      });
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
        <span className={capCls}>市場</span>
        <select
          value={market}
          onChange={(e) => {
            const m = e.target.value as Market;
            setMarket(m);
            if (m === "TW") setCurrency("TWD");
          }}
          className={inputCls}
        >
          <option value="TW">台股</option>
          <option value="US">美股</option>
        </select>
      </label>

      {market === "US" && (
        <label className={labelCls}>
          <span className={capCls}>結算幣別</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={inputCls}
          >
            <option value="USD">美金付款</option>
            <option value="TWD">台幣付款</option>
          </select>
        </label>
      )}

      <label className={labelCls}>
        <span className={capCls}>代碼</span>
        <input
          value={symbol}
          list="known-stock-symbols"
          onChange={(e) => {
            const next = e.target.value;
            setSymbol(next);
            const matched = knownSymbols[next.trim()];
            if (matched && !nameTouched) setName(matched);
          }}
          required
          className={inputCls}
        />
        <datalist id="known-stock-symbols">
          {Object.entries(knownSymbols).map(([code, symbolName]) => (
            <option key={code} value={code}>
              {symbolName}
            </option>
          ))}
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>名稱/備註</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameTouched(true);
          }}
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        <span className={capCls}>買進日</span>
        <input
          type="date"
          value={buyDate}
          onChange={(e) => setBuyDate(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>賣出日</span>
        <input
          type="date"
          value={sellDate}
          onChange={(e) => setSellDate(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>股數</span>
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>買進價</span>
        <input
          type="number"
          step="0.01"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          required
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        <span className={capCls}>理想賣出價</span>
        <input
          type="number"
          step="0.01"
          value={targetSellPrice}
          onChange={(e) => setTargetSellPrice(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>實際賣出價</span>
        <input
          type="number"
          step="0.01"
          value={actualSellPrice}
          onChange={(e) => setActualSellPrice(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>買進手續費</span>
        <input
          type="number"
          step="0.01"
          value={feeBuy}
          onChange={(e) => setFeeBuy(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>賣出手續費</span>
        <input
          type="number"
          step="0.01"
          value={feeSell}
          onChange={(e) => setFeeSell(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>交易稅</span>
        <input
          type="number"
          step="0.01"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
          className={inputCls}
        />
      </label>

      {isUsd && (
        <>
          <label className={labelCls}>
            <span className={capCls}>買進匯率</span>
            <input
              type="number"
              step="0.001"
              value={exBuy}
              onChange={(e) => setExBuy(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            <span className={capCls}>賣出匯率</span>
            <input
              type="number"
              step="0.001"
              value={exSell}
              onChange={(e) => setExSell(e.target.value)}
              className={inputCls}
            />
          </label>
        </>
      )}

      <label className={`${labelCls} col-span-2 sm:col-span-4`}>
        <span className={capCls}>備註</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </label>

      <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
        <button
          type="submit"
          disabled={saving}
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
