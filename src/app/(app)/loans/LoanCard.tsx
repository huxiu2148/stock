"use client";

import { useState } from "react";
import { summarizeLoan } from "@/lib/calc/loan";
import { formatCurrency } from "@/lib/format";
import type { Loan, LoanInput, LoanPayment, LoanPaymentInput } from "@/types/database";
import { LoanForm } from "./LoanForm";
import { LoanPaymentForm } from "./LoanPaymentForm";

interface LoanCardProps {
  loan: Loan;
  payments: LoanPayment[];
  onUpdateLoan: (id: string, input: LoanInput) => Promise<void>;
  onDeleteLoan: (id: string) => void;
  onAddPayment: (input: LoanPaymentInput) => Promise<void>;
  onUpdatePayment: (id: string, input: LoanPaymentInput) => Promise<void>;
  onDeletePayment: (id: string) => void;
}

/** 還款日預設帶今天所在月份的還款日，方便快速新增本期還款。 */
function suggestedPayDate(dueDay: number | null): string {
  const today = new Date();
  if (!dueDay) return today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dueDay, daysInMonth);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function LoanCard({
  loan,
  payments,
  onUpdateLoan,
  onDeleteLoan,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}: LoanCardProps) {
  const [editingLoan, setEditingLoan] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { rows, summary } = summarizeLoan(loan, payments);
  const progress =
    loan.total_installments && loan.total_installments > 0
      ? `${summary.paidInstallments} / ${loan.total_installments} 期`
      : `已繳 ${summary.paidInstallments} 期`;

  if (editingLoan) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <LoanForm
          initial={loan}
          submitLabel="儲存變更"
          onCancel={() => setEditingLoan(false)}
          onSubmit={async (input) => {
            await onUpdateLoan(loan.id, input);
            setEditingLoan(false);
          }}
        />
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-800">{loan.name}</h3>
            {loan.category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {loan.category}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {loan.start_date && `${loan.start_date} 開始 · `}
            {loan.due_day ? `每月 ${loan.due_day} 號還款` : "未設定還款日"}
            {" · "}
            {progress}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingLoan(true)}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            編輯
          </button>
          <button
            onClick={() => onDeleteLoan(loan.id)}
            className="text-xs text-slate-400 hover:text-rose-600"
          >
            刪除
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-400">借款總額</div>
          <div className="mt-1 font-semibold text-slate-800">
            {formatCurrency(loan.principal_total)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-400">
            已付{loan.has_interest ? "本金 / 利息" : "金額"}
          </div>
          <div className="mt-1 font-semibold text-slate-800">
            {formatCurrency(summary.paidPrincipal)}
            {loan.has_interest && (
              <span className="text-slate-400"> / {formatCurrency(summary.paidInterest)}</span>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-400">已付總金額(含息)</div>
          <div className="mt-1 font-semibold text-slate-800">
            {formatCurrency(summary.paidTotal)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-400">剩餘本金</div>
          <div className="mt-1 font-semibold text-rose-600">
            {formatCurrency(summary.remainingPrincipal)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!addingPayment && (
          <button
            onClick={() => setAddingPayment(true)}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            + 新增本期還款
          </button>
        )}
        {addingPayment && (
          <LoanPaymentForm
            loan={loan}
            defaultPayDate={suggestedPayDate(loan.due_day)}
            onCancel={() => setAddingPayment(false)}
            onSubmit={async (input) => {
              await onAddPayment(input);
              setAddingPayment(false);
            }}
          />
        )}
      </div>

      {rows.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <span className={`transition ${showHistory ? "rotate-90" : ""}`}>›</span>
            還款紀錄（{rows.length} 筆）
          </button>

          {showHistory && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                    <th className="py-2 pr-3">還款日</th>
                    <th className="py-2 pr-3">還款本金</th>
                    {loan.has_interest && <th className="py-2 pr-3">還款利息</th>}
                    <th className="py-2 pr-3">還款後剩餘本金</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    if (editingPaymentId === row.id) {
                      return (
                        <tr key={row.id}>
                          <td colSpan={5} className="py-3">
                            <LoanPaymentForm
                              loan={loan}
                              initial={row}
                              defaultPayDate={row.pay_date}
                              submitLabel="儲存變更"
                              onCancel={() => setEditingPaymentId(null)}
                              onSubmit={async (input) => {
                                await onUpdatePayment(row.id, input);
                                setEditingPaymentId(null);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 text-slate-600">{row.pay_date}</td>
                        <td className="py-2 pr-3 text-slate-600">
                          {formatCurrency(row.principal_paid)}
                        </td>
                        {loan.has_interest && (
                          <td className="py-2 pr-3 text-slate-600">
                            {formatCurrency(row.interest_paid)}
                          </td>
                        )}
                        <td className="py-2 pr-3 text-slate-600">
                          {formatCurrency(row.remainingPrincipal)}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingPaymentId(row.id)}
                            className="mr-2 text-xs text-slate-400 hover:text-slate-700"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => onDeletePayment(row.id)}
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
        </div>
      )}
    </section>
  );
}
