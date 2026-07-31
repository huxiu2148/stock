import { createClient } from "@/lib/supabase/client";
import type {
  CreditCard,
  CreditCardInput,
  CreditCardStatement,
  CreditCardStatementInput,
} from "@/types/database";

export async function fetchCreditCards(): Promise<CreditCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .order("opened_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCreditCard(
  input: CreditCardInput
): Promise<CreditCard> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("credit_cards")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCreditCard(
  id: string,
  patch: Partial<CreditCardInput>
): Promise<CreditCard> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCreditCard(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCreditCardStatements(): Promise<
  CreditCardStatement[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("credit_card_statements")
    .select("*")
    .order("year_month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** 每張卡每個月只有一筆帳單，依 card_id+year_month upsert，不用區分新增/更新。 */
export async function upsertCreditCardStatement(
  input: CreditCardStatementInput
): Promise<CreditCardStatement> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("credit_card_statements")
    .upsert(
      { ...input, user_id: user.id },
      { onConflict: "card_id,year_month" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCreditCardStatement(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("credit_card_statements")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
