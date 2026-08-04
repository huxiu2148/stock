"use client";

import { errorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCardUsageTips,
  createCardUsageTip,
  updateCardUsageTip,
  deleteCardUsageTip,
} from "@/lib/repo/cardUsageTips";
import { fetchCreditCards } from "@/lib/repo/creditCards";
import type { CardUsageTip } from "@/types/database";
import { CardUsageTipForm } from "./CardUsageTipForm";

export default function CardTipsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<CardUsageTip[]>([]);
  const [knownCardNames, setKnownCardNames] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setTips(await fetchCardUsageTips());
      } catch (e) {
        setError(errorMessage(e, "資料載入失敗"));
      } finally {
        setLoading(false);
      }

      // 卡片清單抓不到不應該擋住主要資料的顯示，頂多下拉建議是空的。
      try {
        const cards = await fetchCreditCards();
        setKnownCardNames(cards.map((c) => c.name));
      } catch {
        setKnownCardNames([]);
      }
    })();
  }, []);

  const groupedTips = useMemo(() => {
    return [...tips].sort((a, b) => a.scenario.localeCompare(b.scenario, "zh-Hant"));
  }, [tips]);

  if (loading) return <p className="text-sm text-slate-400">載入中…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">刷卡攻略</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {showAddForm ? "取消新增" : "+ 新增紀錄"}
        </button>
      </div>

      {showAddForm && (
        <CardUsageTipForm
          knownCardNames={knownCardNames}
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (input) => {
            const saved = await createCardUsageTip(input);
            setTips((prev) => [...prev, saved]);
            setShowAddForm(false);
          }}
        />
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {groupedTips.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">尚無攻略紀錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                  <th className="py-2 pr-3">情境</th>
                  <th className="py-2 pr-3">用哪張卡</th>
                  <th className="py-2 pr-3">切換什麼權益最划算</th>
                  <th className="py-2 pr-3">備註</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {groupedTips.map((tip) => {
                  if (editingId === tip.id) {
                    return (
                      <tr key={tip.id}>
                        <td colSpan={5} className="py-3">
                          <CardUsageTipForm
                            initial={tip}
                            knownCardNames={knownCardNames}
                            submitLabel="儲存變更"
                            onCancel={() => setEditingId(null)}
                            onSubmit={async (input) => {
                              const saved = await updateCardUsageTip(tip.id, input);
                              setTips((prev) => prev.map((t) => (t.id === tip.id ? saved : t)));
                              setEditingId(null);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={tip.id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-3 font-medium text-slate-800">{tip.scenario}</td>
                      <td className="py-2 pr-3 text-slate-600">{tip.card_name}</td>
                      <td className="py-2 pr-3 text-slate-600">{tip.benefit}</td>
                      <td className="py-2 pr-3 text-slate-400">{tip.note ?? "—"}</td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingId(tip.id)}
                          className="mr-2 text-xs text-slate-400 hover:text-slate-700"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() =>
                            deleteCardUsageTip(tip.id)
                              .then(() => setTips((prev) => prev.filter((t) => t.id !== tip.id)))
                              .catch((e) => setError(errorMessage(e, "刪除失敗")))
                          }
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
        )}
      </section>
    </div>
  );
}
