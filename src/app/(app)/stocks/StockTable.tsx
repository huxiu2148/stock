"use client";

import { useState } from "react";
import { computeStockTrade } from "@/lib/calc/stock";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { StockTrade, StockTradeInput } from "@/types/database";
import { StockForm } from "./StockForm";

interface SellInput {
  shares: number;
  sell_date: string;
  actual_sell_price: number;
  fee_sell: number;
  tax: number;
}

interface StockTableProps {
  trades: StockTrade[];
  onUpdate: (id: string, input: StockTradeInput) => Promise<void>;
  onDelete: (id: string) => void;
  onPartialSell: (trade: StockTrade, sold: SellInput) => Promise<void>;
  onMergeSell: (
    trades: StockTrade[],
    lines: { tradeId: string; soldShares: number }[],
    sold: {
      sell_date: string;
      actual_sell_price: number;
      fee_sell: number;
      tax: number;
    }
  ) => Promise<void>;
  knownSymbols?: Record<string, string>;
  knownBrokers?: string[];
}

function PartialSellForm({
  trade,
  onCancel,
  onSubmit,
}: {
  trade: StockTrade;
  onCancel: () => void;
  onSubmit: (sold: SellInput) => Promise<void>;
}) {
  const [shares, setShares] = useState(String(trade.shares));
  const [sellDate, setSellDate] = useState(new Date().toISOString().slice(0, 10));
  const [actualSellPrice, setActualSellPrice] = useState("");
  const [feeSell, setFeeSell] = useState("0");
  const [tax, setTax] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sharesNum = Number(shares);
  const valid =
    sharesNum > 0 && sharesNum <= trade.shares && actualSellPrice.trim() !== "";

  const inputCls =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "flex flex-col gap-1";
  const capCls = "text-xs font-medium text-slate-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        shares: sharesNum,
        sell_date: sellDate,
        actual_sell_price: Number(actualSellPrice),
        fee_sell: Number(feeSell) || 0,
        tax: Number(tax) || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4"
    >
      <p className="col-span-2 text-xs text-slate-500 sm:col-span-4">
        目前持有 {trade.shares} 股，賣出後剩餘股數會自動留在原本這筆紀錄繼續持有。
      </p>
      <label className={labelCls}>
        <span className={capCls}>賣出股數</span>
        <input
          type="number"
          value={shares}
          max={trade.shares}
          onChange={(e) => setShares(e.target.value)}
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
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>賣出價</span>
        <input
          type="number"
          step="0.01"
          value={actualSellPrice}
          onChange={(e) => setActualSellPrice(e.target.value)}
          required
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
      {error && <p className="col-span-2 text-xs text-rose-600 sm:col-span-4">{error}</p>}
      <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
        <button
          type="submit"
          disabled={saving || !valid}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "儲存中…" : "確認賣出"}
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

function MergeSellForm({
  trades,
  onCancel,
  onSubmit,
}: {
  trades: StockTrade[];
  onCancel: () => void;
  onSubmit: (
    lines: { tradeId: string; soldShares: number }[],
    sold: {
      sell_date: string;
      actual_sell_price: number;
      fee_sell: number;
      tax: number;
    }
  ) => Promise<void>;
}) {
  const [sellDate, setSellDate] = useState(new Date().toISOString().slice(0, 10));
  const [actualSellPrice, setActualSellPrice] = useState("");
  const [feeSell, setFeeSell] = useState("0");
  const [tax, setTax] = useState("0");
  const [soldSharesById, setSoldSharesById] = useState<Record<string, string>>(
    () => Object.fromEntries(trades.map((t) => [t.id, String(t.shares)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbols = Array.from(new Set(trades.map((t) => t.symbol)));
  const sameSymbol = symbols.length === 1;

  const lines = trades.map((t) => ({
    tradeId: t.id,
    soldShares: Number(soldSharesById[t.id] ?? 0) || 0,
  }));
  const totalSoldShares = lines.reduce((sum, l) => sum + l.soldShares, 0);
  const linesValid = trades.every((t) => {
    const v = Number(soldSharesById[t.id] ?? 0) || 0;
    return v >= 0 && v <= t.shares;
  });
  const valid =
    sameSymbol && actualSellPrice.trim() !== "" && totalSoldShares > 0 && linesValid;

  const inputCls =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "flex flex-col gap-1";
  const capCls = "text-xs font-medium text-slate-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        lines.filter((l) => l.soldShares > 0),
        {
          sell_date: sellDate,
          actual_sell_price: Number(actualSellPrice),
          fee_sell: Number(feeSell) || 0,
          tax: Number(tax) || 0,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-xl bg-amber-50 p-4 sm:grid-cols-4"
    >
      <p className="col-span-2 text-xs text-slate-600 sm:col-span-4">
        合併賣出 {trades.length} 筆（{symbols.join("、")}），可分別調整每筆要賣出的股數
        （不用整筆賣完），手續費、交易稅會依實際賣出股數比例分攤。
      </p>
      {!sameSymbol && (
        <p className="col-span-2 text-xs text-rose-600 sm:col-span-4">
          勾選的紀錄代碼不一致，請只勾同一支股票的紀錄。
        </p>
      )}

      <div className="col-span-2 space-y-2 sm:col-span-4">
        {trades.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2"
          >
            <span className="text-xs text-slate-500">
              {t.buy_date} 買進，持有 {t.shares} 股
            </span>
            <label className="ml-auto flex items-center gap-1.5">
              <span className="text-xs text-slate-500">賣出股數</span>
              <input
                type="number"
                min={0}
                max={t.shares}
                value={soldSharesById[t.id] ?? ""}
                onChange={(e) =>
                  setSoldSharesById((prev) => ({ ...prev, [t.id]: e.target.value }))
                }
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
        ))}
        <p className="text-xs text-slate-400">合計賣出 {totalSoldShares} 股</p>
      </div>

      <label className={labelCls}>
        <span className={capCls}>賣出日</span>
        <input
          type="date"
          value={sellDate}
          onChange={(e) => setSellDate(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>賣出價</span>
        <input
          type="number"
          step="0.01"
          value={actualSellPrice}
          onChange={(e) => setActualSellPrice(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>總手續費</span>
        <input
          type="number"
          step="0.01"
          value={feeSell}
          onChange={(e) => setFeeSell(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>總交易稅</span>
        <input
          type="number"
          step="0.01"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
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
          {saving ? "儲存中…" : "確認合併賣出"}
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

export function StockTable({
  trades,
  onUpdate,
  onDelete,
  onPartialSell,
  onMergeSell,
  knownSymbols,
  knownBrokers,
}: StockTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMergeForm, setShowMergeForm] = useState(false);

  if (trades.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">尚無交易紀錄</p>;
  }

  const selectedTrades = trades.filter((t) => selectedIds.has(t.id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowMergeForm(false);
  }

  return (
    <div>
      {selectedIds.size >= 2 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3">
          <span className="text-sm text-amber-700">
            已勾選 {selectedIds.size} 筆・共{" "}
            {selectedTrades.reduce((s, t) => s + t.shares, 0)} 股
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMergeForm((v) => !v)}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              {showMergeForm ? "取消合併賣出" : "合併賣出"}
            </button>
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setShowMergeForm(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              清除勾選
            </button>
          </div>
        </div>
      )}

      {showMergeForm && selectedTrades.length >= 2 && (
        <div className="mb-3">
          <MergeSellForm
            trades={selectedTrades}
            onCancel={() => setShowMergeForm(false)}
            onSubmit={async (lines, sold) => {
              await onMergeSell(selectedTrades, lines, sold);
              setSelectedIds(new Set());
              setShowMergeForm(false);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
              <th className="py-2 pr-2"></th>
              <th className="py-2 pr-3">代碼</th>
              <th className="py-2 pr-3">買進日 / 賣出日</th>
              <th className="py-2 pr-3">股數</th>
              <th className="py-2 pr-3">買進 / 賣出價</th>
              <th className="py-2 pr-3">成本 / 收入</th>
              <th className="py-2 pr-3">損益</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              if (editingId === trade.id) {
                return (
                  <tr key={trade.id}>
                    <td colSpan={8} className="py-3">
                      <StockForm
                        initial={trade}
                        submitLabel="儲存變更"
                        knownSymbols={knownSymbols}
                        knownBrokers={knownBrokers}
                        onCancel={() => setEditingId(null)}
                        onSubmit={async (input) => {
                          await onUpdate(trade.id, input);
                          setEditingId(null);
                        }}
                      />
                    </td>
                  </tr>
                );
              }

              if (sellingId === trade.id) {
                return (
                  <tr key={trade.id}>
                    <td colSpan={8} className="py-3">
                      <PartialSellForm
                        trade={trade}
                        onCancel={() => setSellingId(null)}
                        onSubmit={async (sold) => {
                          await onPartialSell(trade, sold);
                          setSellingId(null);
                        }}
                      />
                    </td>
                  </tr>
                );
              }

              const calc = computeStockTrade(trade);
              const gain = calc.gainTwd;
              const gainColor =
                gain == null
                  ? "text-slate-400"
                  : gain >= 0
                  ? "text-rose-600"
                  : "text-emerald-600";
              const isOpen = !calc.isClosed && trade.shares > 0;

              return (
                <tr key={trade.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2">
                    {isOpen && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(trade.id)}
                        onChange={() => toggleSelected(trade.id)}
                      />
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-800">{trade.symbol}</div>
                    {trade.name && (
                      <div className="text-xs text-slate-400">{trade.name}</div>
                    )}
                    <div className="text-xs text-slate-300">
                      {trade.market === "TW" ? "台股" : "美股"}
                      {trade.currency === "USD" ? " · 美金付款" : ""}
                      {trade.broker ? ` · ${trade.broker}` : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    <div>{trade.buy_date}</div>
                    <div className="text-slate-400">{trade.sell_date ?? "尚未賣出"}</div>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{trade.shares}</td>
                  <td className="py-2 pr-3 text-slate-600">
                    <div>{trade.buy_price}</div>
                    <div className="text-slate-400">
                      {trade.actual_sell_price ?? "—"}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    <div>{formatCurrency(calc.costTwd)}</div>
                    <div className="text-slate-400">
                      {calc.proceedsTwd != null
                        ? formatCurrency(calc.proceedsTwd)
                        : "—"}
                    </div>
                  </td>
                  <td className={`py-2 pr-3 font-medium ${gainColor}`}>
                    {gain != null ? (
                      <>
                        {gain >= 0 ? "+" : ""}
                        {formatCurrency(gain)}
                        <div className="text-xs">
                          {calc.returnPct != null && formatPercent(calc.returnPct)}
                        </div>
                      </>
                    ) : (
                      "持有中"
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {isOpen && (
                      <button
                        onClick={() => setSellingId(trade.id)}
                        className="mr-2 text-xs text-slate-400 hover:text-slate-700"
                      >
                        分批賣出
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(trade.id)}
                      className="mr-2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => onDelete(trade.id)}
                      className="text-xs text-slate-400 hover:text-rose-600"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
