"use client";

import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "@/lib/errors";
import {
  fetchCardRewardTransactions,
  createCardRewardTransaction,
  updateCardRewardTransaction,
  deleteCardRewardTransaction,
} from "@/lib/repo/cardRewardTransactions";
import {
  analyzeSpendingText,
  calcRuleReward,
  MERCHANT_KEYWORD_LIST,
  parseMerchantList,
  ruleMatchesSpending,
} from "@/lib/calc/cardRewards";
import type {
  CardRewardRule,
  CardRewardTransaction,
  CardRewardTransactionInput,
} from "@/types/database";

interface Props {
  rules: CardRewardRule[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function field(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function formatMoney(n: number): string {
  return `NT$${Math.round(n).toLocaleString()}`;
}

/** 選的通路跟實際商家/情境比對不到，代表當下可能沒有真的套用到這個通路的回饋(例如忘記切換權益)。 */
function isMismatched(rule: CardRewardRule | null, merchantText: string): boolean {
  const text = merchantText.trim();
  if (!rule || text === "") return false;
  const { categories, scenarioCategories } = analyzeSpendingText(text);
  return !ruleMatchesSpending(rule, text, categories, scenarioCategories);
}

export function CardRewardTransactions({ rules }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CardRewardTransaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setTransactions(await fetchCardRewardTransactions());
      } catch (e) {
        setError(errorMessage(e, "刷卡紀錄載入失敗"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const knownCards = useMemo(() => {
    const set = new Set<string>();
    for (const r of rules) set.add(r.card_name);
    return [...set];
  }, [rules]);

  // 依「卡片＋通路＋結帳日」分組加總，用來對照回饋規則的月結上限刷了多少。
  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        cardName: string;
        channel: string;
        statementLabel: string;
        totalAmount: number;
        totalReward: number;
        count: number;
        rule: CardRewardRule | null;
      }
    >();
    for (const t of transactions) {
      const channel = t.channel ?? "（未分類）";
      const statementLabel = t.statement_date ?? `${t.transaction_date.slice(0, 7)}（無結帳日，用消費月概略歸類）`;
      const key = `${t.card_name}__${channel}__${statementLabel}`;
      const rule =
        rules.find((r) => r.card_name === t.card_name && r.channel === t.channel) ?? null;
      const existing = map.get(key);
      if (existing) {
        existing.totalAmount += t.amount_twd;
        existing.totalReward += t.reward_twd ?? 0;
        existing.count += 1;
      } else {
        map.set(key, {
          cardName: t.card_name,
          channel,
          statementLabel,
          totalAmount: t.amount_twd,
          totalReward: t.reward_twd ?? 0,
          count: 1,
          rule,
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      b.statementLabel.localeCompare(a.statementLabel)
    );
  }, [transactions, rules]);

  if (loading) return <p className="text-sm text-slate-400">刷卡紀錄載入中…</p>;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {error && (
        <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowList((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <span className={`transition ${showList ? "rotate-90" : ""}`}>›</span>
          刷卡紀錄（{transactions.length} 筆）
        </button>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {showAddForm ? "取消新增" : "+ 記一筆消費"}
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4">
          <TransactionForm
            rules={rules}
            knownCards={knownCards}
            onCancel={() => setShowAddForm(false)}
            onSubmit={async (input) => {
              const saved = await createCardRewardTransaction(input);
              setTransactions((prev) => [saved, ...prev]);
              setShowAddForm(false);
              setShowList(true);
            }}
          />
        </div>
      )}

      {showList && (
        <div className="mt-5 space-y-6">
          {groups.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium text-slate-500">
                依卡片／通路／結帳日彙總（對照下方回饋規則的上限說明，看有沒有刷到頂）
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {groups.map((g) => {
                  const capHit =
                    g.rule?.max_reward != null && g.totalReward >= g.rule.max_reward;
                  return (
                    <div
                      key={`${g.cardName}__${g.channel}__${g.statementLabel}`}
                      className={`rounded-xl border p-3 text-sm ${
                        capHit
                          ? "border-rose-200 bg-rose-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">
                          {g.cardName} · {g.channel}
                        </span>
                        <span className="text-xs text-slate-400">{g.statementLabel}</span>
                      </div>
                      <div className="mt-1 text-slate-600">
                        消費 {formatMoney(g.totalAmount)}（{g.count}筆）／回饋合計{" "}
                        <span className="font-medium">{formatMoney(g.totalReward)}</span>
                        {g.rule?.max_reward != null && (
                          <span className={capHit ? "text-rose-600" : "text-slate-500"}>
                            {" "}
                            ／單筆上限 {formatMoney(g.rule.max_reward)}
                            {capHit ? "（已到上限）" : ""}
                          </span>
                        )}
                      </div>
                      {g.rule?.note && (
                        <p className="mt-1 text-xs text-slate-400">{g.rule.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">尚無刷卡紀錄</p>
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                    <th className="py-2 pr-3">消費日</th>
                    <th className="py-2 pr-3">結帳日</th>
                    <th className="py-2 pr-3">卡片</th>
                    <th className="py-2 pr-3">通路</th>
                    <th className="py-2 pr-3">商家/情境</th>
                    <th className="py-2 pr-3">金額</th>
                    <th className="py-2 pr-3">回饋</th>
                    <th className="py-2 pr-3">備註</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    if (editingId === t.id) {
                      return (
                        <tr key={t.id}>
                          <td colSpan={9} className="py-3">
                            <TransactionForm
                              rules={rules}
                              knownCards={knownCards}
                              initial={t}
                              submitLabel="儲存變更"
                              onCancel={() => setEditingId(null)}
                              onSubmit={async (input) => {
                                const saved = await updateCardRewardTransaction(
                                  t.id,
                                  input
                                );
                                setTransactions((prev) =>
                                  prev.map((x) => (x.id === t.id ? saved : x))
                                );
                                setEditingId(null);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    }
                    const rowRule =
                      rules.find(
                        (r) => r.card_name === t.card_name && r.channel === t.channel
                      ) ?? null;
                    const mismatched = isMismatched(rowRule, t.merchant_text ?? "");
                    return (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 text-slate-600">{t.transaction_date}</td>
                        <td className="py-2 pr-3 text-slate-400">
                          {t.statement_date ?? "—"}
                        </td>
                        <td className="py-2 pr-3 font-medium text-slate-800">
                          {t.card_name}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {t.channel ?? "—"}
                          {mismatched && (
                            <span
                              className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700"
                              title="這個通路的商家清單/類別比對不到你填的商家/情境，可能沒有真的套用到這個回饋"
                            >
                              ⚠️可能沒套用
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">
                          {t.merchant_text ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {formatMoney(t.amount_twd)}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {t.reward_twd != null ? formatMoney(t.reward_twd) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{t.note ?? "—"}</td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingId(t.id)}
                            className="mr-2 text-xs text-slate-400 hover:text-slate-700"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() =>
                              deleteCardRewardTransaction(t.id)
                                .then(() =>
                                  setTransactions((prev) =>
                                    prev.filter((x) => x.id !== t.id)
                                  )
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
        </div>
      )}
    </section>
  );
}

function TransactionForm({
  rules,
  knownCards,
  initial,
  submitLabel = "新增紀錄",
  onSubmit,
  onCancel,
}: {
  rules: CardRewardRule[];
  knownCards: string[];
  initial?: Partial<CardRewardTransaction>;
  submitLabel?: string;
  onSubmit: (input: CardRewardTransactionInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [cardName, setCardName] = useState(initial?.card_name ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "");
  const [transactionDate, setTransactionDate] = useState(
    initial?.transaction_date ?? todayIso()
  );
  const [statementDate, setStatementDate] = useState(initial?.statement_date ?? "");
  const [amount, setAmount] = useState(field(initial?.amount_twd));
  const [reward, setReward] = useState(field(initial?.reward_twd));
  const [rewardTouched, setRewardTouched] = useState(false);
  const [merchantText, setMerchantText] = useState(initial?.merchant_text ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelOptions = useMemo(
    () => [...new Set(rules.filter((r) => r.card_name === cardName).map((r) => r.channel))],
    [rules, cardName]
  );

  const matchedRule = useMemo(
    () => rules.find((r) => r.card_name === cardName && r.channel === channel) ?? null,
    [rules, cardName, channel]
  );

  // 商家/情境的建議清單：優先用目前選的通路自己的商家清單 (最準)，
  // 沒有的話退回這張卡所有通路的商家清單，再退回通用商家關鍵字清單。
  const merchantOptions = useMemo(() => {
    const ruleMerchants = parseMerchantList(matchedRule?.merchants ?? null);
    if (ruleMerchants.length > 0) return ruleMerchants;
    const cardMerchants = [
      ...new Set(
        rules
          .filter((r) => r.card_name === cardName)
          .flatMap((r) => parseMerchantList(r.merchants))
      ),
    ];
    return cardMerchants.length > 0 ? cardMerchants : MERCHANT_KEYWORD_LIST;
  }, [matchedRule, rules, cardName]);

  // 選的通路(例如玩旅刷)跟實際填的商家/情境(例如7-11)比對不到，代表當下可能沒有真的套用到，
  // 常見於忘記切換權益的情況，提醒使用者自己核對/更正回饋金額。
  const mismatched = isMismatched(matchedRule, merchantText);

  // 選好卡片/通路/金額後，自動帶入試算的建議回饋金額；比對不到商家/情境時不帶入(避免照著不適用的比例算)。
  // 使用者自己改過回饋金額的話，就不再自動覆蓋。
  const suggestedReward = useMemo(() => {
    const amt = numOrNull(amount);
    if (!matchedRule || amt == null || mismatched) return null;
    return calcRuleReward(matchedRule, amt);
  }, [matchedRule, amount, mismatched]);

  const suggestionKey = matchedRule ? `${matchedRule.id}:${amount}:${mismatched}` : "";
  const [prevSuggestionKey, setPrevSuggestionKey] = useState(suggestionKey);
  if (suggestionKey !== prevSuggestionKey) {
    setPrevSuggestionKey(suggestionKey);
    if (!rewardTouched) {
      setReward(suggestedReward != null ? String(Math.round(suggestedReward)) : "");
    }
  }

  const valid = cardName.trim() !== "" && transactionDate !== "" && amount.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        card_name: cardName.trim(),
        channel: channel.trim() || null,
        transaction_date: transactionDate,
        statement_date: statementDate || null,
        amount_twd: Number(amount) || 0,
        reward_twd: numOrNull(reward),
        merchant_text: merchantText.trim() || null,
        note: note.trim() || null,
      });
    } catch (err) {
      setError(errorMessage(err, "儲存失敗"));
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
        <span className={capCls}>卡片</span>
        <input
          value={cardName}
          list="txn-known-cards"
          onChange={(e) => {
            setCardName(e.target.value);
            setChannel("");
          }}
          required
          className={inputCls}
        />
        <datalist id="txn-known-cards">
          {knownCards.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>通路</span>
        <input
          value={channel}
          list="txn-known-channels"
          onChange={(e) => setChannel(e.target.value)}
          className={inputCls}
        />
        <datalist id="txn-known-channels">
          {channelOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className={labelCls}>
        <span className={capCls}>消費日</span>
        <input
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>結帳日 (選填)</span>
        <input
          type="date"
          value={statementDate}
          onChange={(e) => setStatementDate(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>消費金額 (台幣)</span>
        <input
          type="number"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        <span className={capCls}>
          回饋金額{" "}
          {mismatched ? (
            <span className="text-amber-600">(比對不到商家，未自動試算，請填實際金額)</span>
          ) : (
            matchedRule && <span className="text-slate-400">(已依規則試算，可覆寫)</span>
          )}
        </span>
        <input
          type="number"
          step="1"
          value={reward}
          onChange={(e) => {
            setReward(e.target.value);
            setRewardTouched(true);
          }}
          className={inputCls}
        />
      </label>
      <label className={`${labelCls} col-span-2 sm:col-span-4`}>
        <span className={capCls}>商家/情境 (選填，可直接打字或從清單選，用來核對通路實際有沒有套用到)</span>
        <input
          value={merchantText}
          list="txn-merchant-options"
          placeholder="例如：7-11"
          onChange={(e) => setMerchantText(e.target.value)}
          className={inputCls}
        />
        <datalist id="txn-merchant-options">
          {merchantOptions.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        {mismatched && (
          <p className="text-xs text-amber-600">
            ⚠️「{channel}」的商家清單/類別比對不到「{merchantText}」，當下可能沒有真的套用到這個通路的回饋(例如忘記切換權益)，建議手動確認/更正上面的回饋金額
          </p>
        )}
      </label>
      <label className={`${labelCls} col-span-2 sm:col-span-4`}>
        <span className={capCls}>備註</span>
        <input
          value={note}
          placeholder="例如：momo週年慶"
          onChange={(e) => setNote(e.target.value)}
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
