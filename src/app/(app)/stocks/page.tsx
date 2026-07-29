"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchStockTrades,
  createStockTrade,
  updateStockTrade,
  deleteStockTrade,
} from "@/lib/repo/stocks";
import { summarizeStockTrades } from "@/lib/calc/stock";
import { formatCurrency } from "@/lib/format";
import type { Market, StockTrade } from "@/types/database";
import { StockForm } from "./StockForm";
import { StockTable } from "./StockTable";

type Tab = "ALL" | Market;

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "TW", label: "台股" },
  { key: "US", label: "美股" },
];

export default function StocksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [tab, setTab] = useState<Tab>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setTrades(await fetchStockTrades());
      } catch (e) {
        setError(e instanceof Error ? e.message : "資料載入失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => (tab === "ALL" ? trades : trades.filter((t) => t.market === tab)),
    [trades, tab]
  );

  const summary = useMemo(() => summarizeStockTrades(filtered), [filtered]);

  if (loading) return <p className="text-sm text-slate-400">載入中…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs text-slate-400">已實現損益 (台幣)</div>
          <div
            className={`mt-1 text-xl font-bold ${
              summary.realizedGainTwd >= 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {summary.realizedGainTwd >= 0 ? "+" : ""}
            {formatCurrency(summary.realizedGainTwd)}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs text-slate-400">持有中部位</div>
          <div className="mt-1 text-xl font-bold text-slate-900">
            {summary.openPositions} 筆
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs text-slate-400">持有中投入成本 (台幣)</div>
          <div className="mt-1 text-xl font-bold text-slate-900">
            {formatCurrency(summary.investedTwdOpen)}
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {showAddForm ? "取消新增" : "+ 新增交易"}
          </button>
        </div>

        {showAddForm && (
          <div className="mt-4">
            <StockForm
              onSubmit={async (input) => {
                const saved = await createStockTrade(input);
                setTrades((prev) => [saved, ...prev]);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        <div className="mt-4">
          <StockTable
            trades={filtered}
            onUpdate={async (id, input) => {
              const saved = await updateStockTrade(id, input);
              setTrades((prev) => prev.map((t) => (t.id === id ? saved : t)));
            }}
            onDelete={(id) =>
              deleteStockTrade(id).then(() =>
                setTrades((prev) => prev.filter((t) => t.id !== id))
              )
            }
          />
        </div>
      </section>
    </div>
  );
}
