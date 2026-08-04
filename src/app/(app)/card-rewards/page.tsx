"use client";

import { errorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCardRewardRules,
  createCardRewardRule,
  updateCardRewardRule,
  deleteCardRewardRule,
} from "@/lib/repo/cardRewards";
import type { CardRewardRule } from "@/types/database";
import { CardRewardRuleForm } from "./CardRewardRuleForm";
import { RewardCalculator } from "./RewardCalculator";

export default function CardRewardsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<CardRewardRule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setRules(await fetchCardRewardRules());
      } catch (e) {
        setError(errorMessage(e, "資料載入失敗"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const knownPlanGroups = useMemo(() => {
    const set = new Set<string>();
    for (const r of rules) {
      if (r.plan_group) set.add(r.plan_group);
    }
    return [...set];
  }, [rules]);

  if (loading) return <p className="text-sm text-slate-400">載入中…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-800">刷卡回饋試算</h2>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <RewardCalculator rules={rules} />
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRules((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <span className={`transition ${showRules ? "rotate-90" : ""}`}>›</span>
            回饋規則設定（{rules.length} 筆）
          </button>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {showAddForm ? "取消新增" : "+ 新增規則"}
          </button>
        </div>

        {showAddForm && (
          <div className="mt-4">
            <CardRewardRuleForm
              knownPlanGroups={knownPlanGroups}
              onCancel={() => setShowAddForm(false)}
              onSubmit={async (input) => {
                const saved = await createCardRewardRule(input);
                setRules((prev) => [...prev, saved]);
                setShowAddForm(false);
                setShowRules(true);
              }}
            />
          </div>
        )}

        {showRules && (
          <div className="mt-4 overflow-x-auto">
            {rules.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">尚無回饋規則</p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                    <th className="py-2 pr-3">卡片</th>
                    <th className="py-2 pr-3">消費通路</th>
                    <th className="py-2 pr-3">限定幣別</th>
                    <th className="py-2 pr-3">回饋比例</th>
                    <th className="py-2 pr-3">上限</th>
                    <th className="py-2 pr-3">方案分組</th>
                    <th className="py-2 pr-3">備註</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    if (editingId === rule.id) {
                      return (
                        <tr key={rule.id}>
                          <td colSpan={8} className="py-3">
                            <CardRewardRuleForm
                              initial={rule}
                              knownPlanGroups={knownPlanGroups}
                              submitLabel="儲存變更"
                              onCancel={() => setEditingId(null)}
                              onSubmit={async (input) => {
                                const saved = await updateCardRewardRule(rule.id, input);
                                setRules((prev) =>
                                  prev.map((r) => (r.id === rule.id ? saved : r))
                                );
                                setEditingId(null);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={rule.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-medium text-slate-800">
                          {rule.card_name}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">{rule.channel}</td>
                        <td className="py-2 pr-3 text-slate-600">
                          {rule.currency_scope ?? "不限"}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">{rule.rate}%</td>
                        <td className="py-2 pr-3 text-slate-600">
                          {rule.max_reward ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">
                          {rule.plan_group ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{rule.note ?? "—"}</td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingId(rule.id)}
                            className="mr-2 text-xs text-slate-400 hover:text-slate-700"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() =>
                              deleteCardRewardRule(rule.id)
                                .then(() =>
                                  setRules((prev) => prev.filter((r) => r.id !== rule.id))
                                )
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
            )}
          </div>
        )}
      </section>
    </div>
  );
}
