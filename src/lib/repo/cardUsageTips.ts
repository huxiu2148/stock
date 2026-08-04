import { createClient } from "@/lib/supabase/client";
import type { CardUsageTip, CardUsageTipInput } from "@/types/database";

export async function fetchCardUsageTips(): Promise<CardUsageTip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_usage_tips")
    .select("*")
    .order("scenario", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCardUsageTip(
  input: CardUsageTipInput
): Promise<CardUsageTip> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("card_usage_tips")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCardUsageTip(
  id: string,
  patch: Partial<CardUsageTipInput>
): Promise<CardUsageTip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_usage_tips")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCardUsageTip(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("card_usage_tips").delete().eq("id", id);
  if (error) throw error;
}
