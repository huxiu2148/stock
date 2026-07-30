"use client";

import { errorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import {
  fetchSalaryRecords,
  upsertSalaryRecord,
  deleteSalaryRecord,
  fetchOvertimeEntries,
  addOvertimeEntry,
  updateOvertimeEntry,
  deleteOvertimeEntry,
  fetchLateEntries,
  addLateEntry,
  updateLateEntry,
  deleteLateEntry,
  fetchLeaveEntries,
  addLeaveEntry,
  updateLeaveEntry,
  deleteLeaveEntry,
} from "@/lib/repo/salary";
import { fetchUserSettings, upsertHireDate } from "@/lib/repo/settings";
import type {
  LateEntry,
  LeaveEntry,
  LeaveType,
  OvertimeEntry,
  SalaryRecord,
} from "@/types/database";
import { YearMonthPicker } from "./YearMonthPicker";
import { BaseSalarySection } from "./BaseSalarySection";
import { DeductionsSection } from "./DeductionsSection";
import { OvertimeSection } from "./OvertimeSection";
import { LateSection } from "./LateSection";
import { LeaveSection } from "./LeaveSection";
import { LeaveBalanceSection } from "./LeaveBalanceSection";
import { SummaryBar } from "./SummaryBar";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 查看當月時預設今天，查看其他月份時預設該月第一天，避免加班/遲到/請假紀錄的日期跑到今天。 */
function defaultWorkDate(yearMonth: string): string {
  const today = todayStr();
  return today.startsWith(yearMonth) ? today : `${yearMonth}-01`;
}

function draftRecord(yearMonth: string): SalaryRecord {
  return {
    id: `draft:${yearMonth}`,
    user_id: "",
    year_month: yearMonth,
    pay_date: null,
    base_basic: 0,
    base_position: 0,
    base_meal: 0,
    base_other: 0,
    base_other_allowance: 0,
    base_night_shift: 0,
    base_evaluation_bonus: 0,
    performance_bonus: 0,
    bonus: 0,
    festival_bonus: 0,
    festival_bonus_note: null,
    deduct_welfare: 0,
    deduct_labor_insurance: 0,
    deduct_health_insurance: 0,
    deduct_labor_pension_self: 0,
    deduct_guarantee_insurance: 0,
    hourly_wage: null,
    overtime_pay_override: null,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function SalaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [overtimeEntries, setOvertimeEntries] = useState<OvertimeEntry[]>([]);
  const [lateEntries, setLateEntries] = useState<LateEntry[]>([]);
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [hireDate, setHireDate] = useState<string | null>(null);
  const [extraMonths, setExtraMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());

  useEffect(() => {
    (async () => {
      try {
        const [rec, ot, late, leave] = await Promise.all([
          fetchSalaryRecords(),
          fetchOvertimeEntries(),
          fetchLateEntries(),
          fetchLeaveEntries(),
        ]);
        setRecords(rec);
        setOvertimeEntries(ot);
        setLateEntries(late);
        setLeaveEntries(leave);
      } catch (e) {
        setError(errorMessage(e, "資料載入失敗"));
      } finally {
        setLoading(false);
      }

      // 到職日設定失敗（例如尚未執行 user_settings 的 migration）不應該擋住其他資料。
      try {
        const settings = await fetchUserSettings();
        setHireDate(settings?.hire_date ?? null);
      } catch {
        setHireDate(null);
      }
    })();
  }, []);

  const months = useMemo(() => {
    const set = new Set<string>([
      currentYearMonth(),
      ...records.map((r) => r.year_month),
      ...extraMonths,
    ]);
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [records, extraMonths]);

  const currentRecord = useMemo(
    () =>
      records.find((r) => r.year_month === selectedMonth) ??
      draftRecord(selectedMonth),
    [records, selectedMonth]
  );

  const monthOvertimeEntries = useMemo(
    () => overtimeEntries.filter((e) => e.work_date.startsWith(selectedMonth)),
    [overtimeEntries, selectedMonth]
  );
  const monthLateEntries = useMemo(
    () => lateEntries.filter((e) => e.work_date.startsWith(selectedMonth)),
    [lateEntries, selectedMonth]
  );
  const monthLeaveEntries = useMemo(
    () => leaveEntries.filter((e) => e.work_date.startsWith(selectedMonth)),
    [leaveEntries, selectedMonth]
  );

  async function handleDeleteMonth(yearMonth: string) {
    const record = records.find((r) => r.year_month === yearMonth);
    try {
      if (record) {
        await deleteSalaryRecord(record.id);
        setRecords((prev) => prev.filter((r) => r.year_month !== yearMonth));
      }
      setExtraMonths((prev) => prev.filter((m) => m !== yearMonth));
      if (selectedMonth === yearMonth) {
        setSelectedMonth(currentYearMonth());
      }
    } catch (e) {
      setError(errorMessage(e, "刪除失敗"));
    }
  }

  async function handleRecordChange(patch: Partial<SalaryRecord>) {
    setRecords((prev) => {
      const exists = prev.some((r) => r.year_month === selectedMonth);
      if (exists) {
        return prev.map((r) =>
          r.year_month === selectedMonth ? { ...r, ...patch } : r
        );
      }
      return [...prev, { ...draftRecord(selectedMonth), ...patch }];
    });
    try {
      const saved = await upsertSalaryRecord(selectedMonth, patch);
      setRecords((prev) => {
        const others = prev.filter((r) => r.year_month !== selectedMonth);
        return [...others, saved];
      });
    } catch (e) {
      setError(errorMessage(e, "儲存失敗"));
    }
  }

  async function handleAddOvertime(entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    is_holiday?: boolean;
    note?: string;
  }) {
    const saved = await addOvertimeEntry(entry);
    setOvertimeEntries((prev) => [saved, ...prev]);
  }

  async function handleUpdateOvertime(
    id: string,
    entry: {
      work_date: string;
      start_time: string;
      end_time: string;
      minutes: number;
      is_holiday?: boolean;
      note?: string;
    }
  ) {
    const saved = await updateOvertimeEntry(id, entry);
    setOvertimeEntries((prev) => prev.map((e) => (e.id === id ? saved : e)));
  }

  async function handleAddLate(entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    note?: string;
  }) {
    const saved = await addLateEntry(entry);
    setLateEntries((prev) => [saved, ...prev]);
  }

  async function handleUpdateLate(
    id: string,
    entry: {
      work_date: string;
      start_time: string;
      end_time: string;
      minutes: number;
      note?: string;
    }
  ) {
    const saved = await updateLateEntry(id, entry);
    setLateEntries((prev) => prev.map((e) => (e.id === id ? saved : e)));
  }

  async function handleAddLeave(entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    leave_type: LeaveType;
    note?: string;
  }) {
    const saved = await addLeaveEntry(entry);
    setLeaveEntries((prev) => [saved, ...prev]);
  }

  async function handleUpdateLeave(
    id: string,
    entry: {
      work_date: string;
      start_time: string;
      end_time: string;
      minutes: number;
      leave_type: LeaveType;
      note?: string;
    }
  ) {
    const saved = await updateLeaveEntry(id, entry);
    setLeaveEntries((prev) => prev.map((e) => (e.id === id ? saved : e)));
  }

  async function handleSaveHireDate(date: string) {
    try {
      const saved = await upsertHireDate(date);
      setHireDate(saved.hire_date);
    } catch (e) {
      setError(errorMessage(e, "儲存失敗"));
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">載入中…</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <YearMonthPicker
        months={months}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
        onAddMonth={(ym) => {
          setExtraMonths((prev) => Array.from(new Set([...prev, ym])));
          setSelectedMonth(ym);
        }}
        onDeleteMonth={handleDeleteMonth}
      />

      <SummaryBar
        record={currentRecord}
        overtimeEntries={monthOvertimeEntries}
        leaveEntries={monthLeaveEntries}
        lateEntries={monthLateEntries}
        onPayDateChange={(date) => handleRecordChange({ pay_date: date })}
      />

      <BaseSalarySection record={currentRecord} onChange={handleRecordChange} />

      <DeductionsSection record={currentRecord} onChange={handleRecordChange} />

      <OvertimeSection
        record={currentRecord}
        entries={monthOvertimeEntries}
        defaultDate={defaultWorkDate(selectedMonth)}
        onAdd={handleAddOvertime}
        onUpdate={handleUpdateOvertime}
        onDelete={(id) =>
          deleteOvertimeEntry(id).then(() =>
            setOvertimeEntries((prev) => prev.filter((e) => e.id !== id))
          )
        }
        onOverrideChange={(v) =>
          handleRecordChange({ overtime_pay_override: v })
        }
        onClearOverride={() =>
          handleRecordChange({ overtime_pay_override: null })
        }
      />

      <LateSection
        entries={monthLateEntries}
        defaultDate={defaultWorkDate(selectedMonth)}
        onAdd={handleAddLate}
        onUpdate={handleUpdateLate}
        onDelete={(id) =>
          deleteLateEntry(id).then(() =>
            setLateEntries((prev) => prev.filter((e) => e.id !== id))
          )
        }
      />

      <LeaveSection
        entries={monthLeaveEntries}
        defaultDate={defaultWorkDate(selectedMonth)}
        onAdd={handleAddLeave}
        onUpdate={handleUpdateLeave}
        onDelete={(id) =>
          deleteLeaveEntry(id).then(() =>
            setLeaveEntries((prev) => prev.filter((e) => e.id !== id))
          )
        }
      />

      <LeaveBalanceSection
        leaveEntries={leaveEntries}
        hireDate={hireDate}
        onSaveHireDate={handleSaveHireDate}
      />
    </div>
  );
}
