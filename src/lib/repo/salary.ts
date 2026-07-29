import { createClient } from "@/lib/supabase/client";
import type {
  SalaryRecord,
  SalaryRecordInput,
  OvertimeEntry,
  LateEntry,
  LeaveEntry,
  LeaveType,
} from "@/types/database";

export async function fetchSalaryRecords(): Promise<SalaryRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salary_records")
    .select("*")
    .order("year_month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertSalaryRecord(
  yearMonth: string,
  patch: Partial<SalaryRecordInput>
): Promise<SalaryRecord> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data, error } = await supabase
    .from("salary_records")
    .upsert(
      { user_id: user.id, year_month: yearMonth, ...patch },
      { onConflict: "user_id,year_month" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSalaryRecord(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("salary_records").delete().eq("id", id);
  if (error) throw error;
}

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user.id;
}

export async function fetchOvertimeEntries(): Promise<OvertimeEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("overtime_entries")
    .select("*")
    .order("work_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addOvertimeEntry(entry: {
  work_date: string;
  start_time: string;
  end_time: string;
  minutes: number;
  note?: string | null;
}): Promise<OvertimeEntry> {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("overtime_entries")
    .insert({ ...entry, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOvertimeEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("overtime_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchLateEntries(): Promise<LateEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("late_entries")
    .select("*")
    .order("work_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addLateEntry(entry: {
  work_date: string;
  start_time: string;
  end_time: string;
  minutes: number;
  note?: string | null;
}): Promise<LateEntry> {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("late_entries")
    .insert({ ...entry, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLateEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("late_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchLeaveEntries(): Promise<LeaveEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leave_entries")
    .select("*")
    .order("work_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addLeaveEntry(entry: {
  work_date: string;
  start_time: string;
  end_time: string;
  minutes: number;
  leave_type: LeaveType;
  note?: string | null;
}): Promise<LeaveEntry> {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("leave_entries")
    .insert({ ...entry, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLeaveEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("leave_entries").delete().eq("id", id);
  if (error) throw error;
}

