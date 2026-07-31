import { createClient } from "@/lib/supabase/client";
import type { Loan, LoanInput, LoanPayment, LoanPaymentInput } from "@/types/database";

export async function fetchLoans(): Promise<Loan[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createLoan(input: LoanInput): Promise<Loan> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("loans")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateLoan(
  id: string,
  patch: Partial<LoanInput>
): Promise<Loan> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLoan(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("loans").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchLoanPayments(): Promise<LoanPayment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loan_payments")
    .select("*")
    .order("pay_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createLoanPayment(
  input: LoanPaymentInput
): Promise<LoanPayment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("loan_payments")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateLoanPayment(
  id: string,
  patch: Partial<LoanPaymentInput>
): Promise<LoanPayment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loan_payments")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLoanPayment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("loan_payments").delete().eq("id", id);
  if (error) throw error;
}
