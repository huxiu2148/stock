"use client";

import { useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import { statementTwdAmount } from "@/lib/calc/creditCard";
import { formatCurrency } from "@/lib/format";
import type { CreditCard, CreditCardInput, CreditCardStatement } from "@/types/database";
import { CreditCardForm } from "./CreditCardForm";

interface CreditCardRowProps {
  card: CreditCard;
  statement: CreditCardStatement | undefined;
  onCommitAmount: (amount: number) => void;
  onCommitExchangeRate: (rate: number) => void;
  onUpdateCard: (input: CreditCardInput) => Promise<void>;
  onDeleteCard: () => void;
}

function dayLabel(day: number | null): string {
  return day ? `${day} 號` : "—";
}

export function CreditCardRow({
  card,
  statement,
  onCommitAmount,
  onCommitExchangeRate,
  onUpdateCard,
  onDeleteCard,
}: CreditCardRowProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-xl bg-slate-50 p-4">
        <CreditCardForm
          initial={card}
          submitLabel="儲存變更"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await onUpdateCard(input);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const twdAmount = statementTwdAmount(card, statement);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3">
      <div className="min-w-[140px]">
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          {card.name}
          {card.currency === "USD" && (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
              USD
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          結帳 {dayLabel(card.statement_day)} · 入帳 {dayLabel(card.post_day)} · 扣款{" "}
          {dayLabel(card.debit_day)}
        </div>
      </div>

      <MoneyInput
        label={card.currency === "USD" ? "帳單金額 (USD)" : "帳單金額"}
        value={statement?.amount ?? 0}
        onCommit={onCommitAmount}
      />

      {card.currency === "USD" && (
        <>
          <MoneyInput
            label="約略匯率"
            step="0.01"
            value={statement?.exchange_rate ?? 0}
            onCommit={onCommitExchangeRate}
          />
          <div className="text-sm text-slate-500">
            ≈ {formatCurrency(twdAmount)}
          </div>
        </>
      )}

      <div className="ml-auto flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-slate-700"
        >
          編輯卡片
        </button>
        <button
          onClick={onDeleteCard}
          className="text-xs text-slate-400 hover:text-rose-600"
        >
          刪除卡片
        </button>
      </div>
    </div>
  );
}
