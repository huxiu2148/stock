import { createClient } from "@/lib/supabase/client";
import type { StockTrade, StockTradeInput } from "@/types/database";

export async function fetchStockTrades(): Promise<StockTrade[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stock_trades")
    .select("*")
    .order("buy_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createStockTrade(
  input: StockTradeInput
): Promise<StockTrade> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("stock_trades")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateStockTrade(
  id: string,
  patch: Partial<StockTradeInput>
): Promise<StockTrade> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stock_trades")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStockTrade(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("stock_trades").delete().eq("id", id);
  if (error) throw error;
}
