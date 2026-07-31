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
  onToggleReserved: (reserved: boolean) => void;
  onToggleDebited: (debited: boolean) => void;
  onUpdateCard: (input: CreditCardInput) => Promise<void>;
  onDeleteCard: () => void;
}

function dayLabel(day: number | null): string {
  return day ? `${day} 號` : "—";
}

/** 兆豐、聯邦、星展用藍色底，其他卡片用紫色底，方便一眼區分。 */
const BLUE_CARDS = new Set(["兆豐", "聯邦", "星展"]);
function cardBgClass(name: string): string {
  return BLUE_CARDS.has(name) ? "bg-blue-50" : "bg-purple-50";
}

function MarkToggle({
  label,
  activeLabel,
  active,
  onToggle,
}: {
  label: string;
  activeLabel: string;
  active: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
          : "border-slate-300 bg-white text-slate-400 hover:bg-slate-100"
      }`}
    >
      {active ? `✓ ${activeLabel}` : label}
    </button>
  );
}

export function CreditCardRow({
  card,
  statement,
  onCommitAmount,
  onCommitExchangeRate,
  onToggleReserved,
  onToggleDebited,
  onUpdateCard,
  onDeleteCard,
}: CreditCardRowProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className={`rounded-xl p-4 ${cardBgClass(card.name)}`}>
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
    <div className={`flex flex-wrap items-center gap-4 rounded-xl p-3 ${cardBgClass(card.name)}`}>
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

      <div className="flex gap-2">
        <MarkToggle
          label="預約交易"
          activeLabel="已預約"
          active={statement?.reserved ?? false}
          onToggle={onToggleReserved}
        />
        <MarkToggle
          label="完成扣款"
          activeLabel="已扣款"
          active={statement?.debited ?? false}
          onToggle={onToggleDebited}
        />
      </div>

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
