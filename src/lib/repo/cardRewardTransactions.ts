import { createClient } from "@/lib/supabase/client";
import type {
  CardRewardTransaction,
  CardRewardTransactionInput,
} from "@/types/database";

export async function fetchCardRewardTransactions(): Promise<
  CardRewardTransaction[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_reward_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCardRewardTransaction(
  input: CardRewardTransactionInput
): Promise<CardRewardTransaction> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("card_reward_transactions")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCardRewardTransaction(
  id: string,
  patch: Partial<CardRewardTransactionInput>
): Promise<CardRewardTransaction> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_reward_transactions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCardRewardTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("card_reward_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
