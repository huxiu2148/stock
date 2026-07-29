import { createClient } from "@/lib/supabase/client";

export interface UserSettings {
  hire_date: string | null;
}

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("hire_date")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertHireDate(hireDate: string): Promise<UserSettings> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, hire_date: hireDate, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("hire_date")
    .single();
  if (error) throw error;
  return data;
}
