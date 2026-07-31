import type { Loan, LoanPayment } from "@/types/database";

export function sortLoanPaymentsAsc(payments: LoanPayment[]): LoanPayment[] {
  return [...payments].sort((a, b) => a.pay_date.localeCompare(b.pay_date));
}

export function sortLoanPaymentsDesc(payments: LoanPayment[]): LoanPayment[] {
  return [...payments].sort((a, b) => b.pay_date.localeCompare(a.pay_date));
}

export interface LoanPaymentRow extends LoanPayment {
  /** 這筆繳款後，剩餘要還的本金。 */
  remainingPrincipal: number;
}

export interface LoanSummary {
  paidPrincipal: number;
  paidInterest: number;
  paidTotal: number;
  remainingPrincipal: number;
  paidInstallments: number;
}

/** 依還款日由舊到新累計本金，算出每一筆繳款後的剩餘本金，以及整體摘要。 */
export function summarizeLoan(
  loan: Loan,
  payments: LoanPayment[]
): { rows: LoanPaymentRow[]; summary: LoanSummary } {
  const asc = sortLoanPaymentsAsc(payments);
  let remaining = loan.principal_total;
  const rowsAsc: LoanPaymentRow[] = asc.map((p) => {
    remaining -= p.principal_paid;
    return { ...p, remainingPrincipal: remaining };
  });

  const paidPrincipal = payments.reduce((s, p) => s + p.principal_paid, 0);
  const paidInterest = payments.reduce((s, p) => s + p.interest_paid, 0);

  return {
    rows: [...rowsAsc].reverse(),
    summary: {
      paidPrincipal,
      paidInterest,
      paidTotal: paidPrincipal + paidInterest,
      remainingPrincipal: loan.principal_total - paidPrincipal,
      paidInstallments: payments.length,
    },
  };
}
