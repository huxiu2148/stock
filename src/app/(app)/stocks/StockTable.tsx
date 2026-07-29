"use client";

import { useState } from "react";
import { computeStockTrade } from "@/lib/calc/stock";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { StockTrade, StockTradeInput } from "@/types/database";
import { StockForm } from "./StockForm";

interface StockTableProps {
  trades: StockTrade[];
  onUpdate: (id: string, input: StockTradeInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export function StockTable({ trades, onUpdate, onDelete }: StockTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (trades.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">尚無交易紀錄</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
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
                  <td colSpan={7} className="py-3">
                    <StockForm
                      initial={trade}
                      submitLabel="儲存變更"
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

            const calc = computeStockTrade(trade);
            const gain = calc.gainTwd;
            const gainColor =
              gain == null
                ? "text-slate-400"
                : gain >= 0
                ? "text-rose-600"
                : "text-emerald-600";

            return (
              <tr key={trade.id} className="border-b border-slate-100">
                <td className="py-2 pr-3">
                  <div className="font-medium text-slate-800">{trade.symbol}</div>
                  {trade.name && (
                    <div className="text-xs text-slate-400">{trade.name}</div>
                  )}
                  <div className="text-xs text-slate-300">
                    {trade.market === "TW" ? "台股" : "美股"}
                    {trade.currency === "USD" ? " · 美金付款" : ""}
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
                <td className="py-2 pr-3 text-right">
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
  );
}
