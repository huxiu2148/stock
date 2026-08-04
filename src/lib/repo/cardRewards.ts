import { createClient } from "@/lib/supabase/client";
import type { CardRewardRule, CardRewardRuleInput } from "@/types/database";

export async function fetchCardRewardRules(): Promise<CardRewardRule[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_reward_rules")
    .select("*")
    .order("card_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCardRewardRule(
  input: CardRewardRuleInput
): Promise<CardRewardRule> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("card_reward_rules")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCardRewardRule(
  id: string,
  patch: Partial<CardRewardRuleInput>
): Promise<CardRewardRule> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_reward_rules")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCardRewardRule(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("card_reward_rules").delete().eq("id", id);
  if (error) throw error;
}
