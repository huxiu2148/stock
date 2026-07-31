"use client";

import { errorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import {
  fetchLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  fetchLoanPayments,
  createLoanPayment,
  updateLoanPayment,
  deleteLoanPayment,
} from "@/lib/repo/loans";
import type { Loan, LoanPayment } from "@/types/database";
import { LoanForm } from "./LoanForm";
import { LoanCard } from "./LoanCard";

export default function LoansPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [loanRows, paymentRows] = await Promise.all([
          fetchLoans(),
          fetchLoanPayments(),
        ]);
        setLoans(loanRows);
        setPayments(paymentRows);
      } catch (e) {
        setError(errorMessage(e, "資料載入失敗"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const paymentsByLoan = useMemo(() => {
    const map = new Map<string, LoanPayment[]>();
    for (const p of payments) {
      const list = map.get(p.loan_id) ?? [];
      list.push(p);
      map.set(p.loan_id, list);
    }
    return map;
  }, [payments]);

  if (loading) return <p className="text-sm text-slate-400">載入中…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">貸款還款計畫</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {showAddForm ? "取消新增" : "+ 新增貸款"}
        </button>
      </div>

      {showAddForm && (
        <LoanForm
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (input) => {
            const saved = await createLoan(input);
            setLoans((prev) => [...prev, saved]);
            setShowAddForm(false);
          }}
        />
      )}

      {loans.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">尚無貸款紀錄</p>
      ) : (
        loans.map((loan) => (
          <LoanCard
            key={loan.id}
            loan={loan}
            payments={paymentsByLoan.get(loan.id) ?? []}
            onUpdateLoan={async (id, input) => {
              const saved = await updateLoan(id, input);
              setLoans((prev) => prev.map((l) => (l.id === id ? saved : l)));
            }}
            onDeleteLoan={(id) =>
              deleteLoan(id)
                .then(() => {
                  setLoans((prev) => prev.filter((l) => l.id !== id));
                  setPayments((prev) => prev.filter((p) => p.loan_id !== id));
                })
                .catch((e) => setError(errorMessage(e, "刪除失敗")))
            }
            onAddPayment={async (input) => {
              const saved = await createLoanPayment(input);
              setPayments((prev) => [...prev, saved]);
            }}
            onUpdatePayment={async (id, input) => {
              const saved = await updateLoanPayment(id, input);
              setPayments((prev) => prev.map((p) => (p.id === id ? saved : p)));
            }}
            onDeletePayment={(id) =>
              deleteLoanPayment(id)
                .then(() => setPayments((prev) => prev.filter((p) => p.id !== id)))
                .catch((e) => setError(errorMessage(e, "刪除失敗")))
            }
          />
        ))
      )}
    </div>
  );
}
