"use client";

import { errorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCreditCards,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  fetchCreditCardStatements,
  upsertCreditCardStatement,
  deleteCreditCardStatement,
} from "@/lib/repo/creditCards";
import { sumMonthTwd } from "@/lib/calc/creditCard";
import { formatCurrency, formatYearMonth } from "@/lib/format";
import { YearMonthPicker } from "@/components/YearMonthPicker";
import type { CreditCard, CreditCardInput, CreditCardStatement } from "@/types/database";
import { CreditCardForm } from "./CreditCardForm";
import { CreditCardRow } from "./CreditCardRow";
import { SpendingLineChart } from "./SpendingLineChart";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 使用者目前持有的 8 張卡片，首次使用時自動建立好，之後可自行編輯/刪除。 */
const DEFAULT_CARDS: CreditCardInput[] = [
  { name: "兆豐", currency: "TWD", opened_date: "2023-11-01", statement_day: 9, post_day: 23, debit_day: 24, note: null },
  { name: "國泰", currency: "TWD", opened_date: "2023-11-01", statement_day: 21, post_day: 7, debit_day: 8, note: null },
  { name: "聯邦", currency: "TWD", opened_date: "2024-07-01", statement_day: 12, post_day: 27, debit_day: 29, note: "28 號簡訊提醒扣款" },
  { name: "富邦", currency: "TWD", opened_date: "2024-10-01", statement_day: 26, post_day: 11, debit_day: null, note: null },
  { name: "永豐", currency: "TWD", opened_date: "2025-02-01", statement_day: 23, post_day: 8, debit_day: null, note: null },
  { name: "永豐美金", currency: "USD", opened_date: "2025-02-01", statement_day: 23, post_day: 8, debit_day: null, note: null },
  { name: "星展", currency: "TWD", opened_date: "2025-03-01", statement_day: 9, post_day: 26, debit_day: 27, note: null },
  { name: "台新", currency: "TWD", opened_date: "2026-07-01", statement_day: 20, post_day: null, debit_day: null, note: "入帳日待確認" },
];

export default function CreditCardsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [statements, setStatements] = useState<CreditCardStatement[]>([]);
  const [extraMonths, setExtraMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let cardRows = await fetchCreditCards();
        if (cardRows.length === 0) {
          cardRows = await Promise.all(DEFAULT_CARDS.map(createCreditCard));
        }
        const statementRows = await fetchCreditCardStatements();
        setCards(cardRows);
        setStatements(statementRows);
      } catch (e) {
        setError(errorMessage(e, "資料載入失敗"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const months = useMemo(() => {
    const set = new Set<string>([
      currentYearMonth(),
      ...statements.map((s) => s.year_month),
      ...extraMonths,
    ]);
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [statements, extraMonths]);

  const statementByCard = useMemo(() => {
    const map = new Map<string, CreditCardStatement>();
    for (const s of statements) {
      if (s.year_month === selectedMonth) map.set(s.card_id, s);
    }
    return map;
  }, [statements, selectedMonth]);

  const monthTotal = useMemo(
    () => sumMonthTwd(cards, statements, selectedMonth),
    [cards, statements, selectedMonth]
  );

  const chartData = useMemo(() => {
    const ascMonths = [...months].sort((a, b) => (a < b ? -1 : 1));
    return ascMonths.map((m) => ({
      month: m,
      totalTwd: sumMonthTwd(cards, statements, m),
    }));
  }, [months, cards, statements]);

  async function handleCommitStatement(
    card: CreditCard,
    patch: {
      amount?: number;
      exchange_rate?: number;
      reserved?: boolean;
      debited?: boolean;
    }
  ) {
    const existing = statementByCard.get(card.id);
    try {
      const saved = await upsertCreditCardStatement({
        card_id: card.id,
        year_month: selectedMonth,
        amount: patch.amount ?? existing?.amount ?? 0,
        exchange_rate: patch.exchange_rate ?? existing?.exchange_rate ?? null,
        reserved: patch.reserved ?? existing?.reserved ?? false,
        debited: patch.debited ?? existing?.debited ?? false,
        note: existing?.note ?? null,
      });
      setStatements((prev) => [...prev.filter((s) => s.id !== saved.id), saved]);
    } catch (e) {
      setError(errorMessage(e, "儲存失敗"));
    }
  }

  async function handleDeleteMonth(yearMonth: string) {
    const toDelete = statements.filter((s) => s.year_month === yearMonth);
    try {
      await Promise.all(toDelete.map((s) => deleteCreditCardStatement(s.id)));
      setStatements((prev) => prev.filter((s) => s.year_month !== yearMonth));
      setExtraMonths((prev) => prev.filter((m) => m !== yearMonth));
      if (selectedMonth === yearMonth) setSelectedMonth(currentYearMonth());
    } catch (e) {
      setError(errorMessage(e, "刪除失敗"));
    }
  }

  if (loading) return <p className="text-sm text-slate-400">載入中…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">刷卡紀錄</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {showAddForm ? "取消新增" : "+ 新增卡片"}
        </button>
      </div>

      {showAddForm && (
        <CreditCardForm
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (input) => {
            const saved = await createCreditCard(input);
            setCards((prev) => [...prev, saved]);
            setShowAddForm(false);
          }}
        />
      )}

      <YearMonthPicker
        months={months}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
        onAddMonth={(ym) => {
          setExtraMonths((prev) => Array.from(new Set([...prev, ym])));
          setSelectedMonth(ym);
        }}
        onDeleteMonth={handleDeleteMonth}
      />

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-medium text-slate-500">每月刷卡總額 (台幣)</h3>
        <div className="mt-3">
          <SpendingLineChart data={chartData} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-500">
            {formatYearMonth(selectedMonth)} 刷卡總額 (台幣)
          </h3>
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(monthTotal)}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {cards.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">尚無卡片</p>
          )}
          {cards.map((card) => (
            <CreditCardRow
              key={card.id}
              card={card}
              statement={statementByCard.get(card.id)}
              onCommitAmount={(amount) => handleCommitStatement(card, { amount })}
              onCommitExchangeRate={(rate) =>
                handleCommitStatement(card, { exchange_rate: rate })
              }
              onToggleReserved={(reserved) => handleCommitStatement(card, { reserved })}
              onToggleDebited={(debited) => handleCommitStatement(card, { debited })}
              onUpdateCard={async (input) => {
                const saved = await updateCreditCard(card.id, input);
                setCards((prev) => prev.map((c) => (c.id === card.id ? saved : c)));
              }}
              onDeleteCard={() =>
                deleteCreditCard(card.id)
                  .then(() => {
                    setCards((prev) => prev.filter((c) => c.id !== card.id));
                    setStatements((prev) => prev.filter((s) => s.card_id !== card.id));
                  })
                  .catch((e) => setError(errorMessage(e, "刪除失敗")))
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
