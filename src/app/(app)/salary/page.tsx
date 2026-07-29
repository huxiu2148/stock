"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchSalaryRecords,
  upsertSalaryRecord,
  fetchOvertimeEntries,
  addOvertimeEntry,
  deleteOvertimeEntry,
  fetchLateEntries,
  addLateEntry,
  deleteLateEntry,
  fetchLeaveEntries,
  addLeaveEntry,
  deleteLeaveEntry,
  fetchLeaveBalances,
  upsertLeaveBalance,
} from "@/lib/repo/salary";
import type {
  LateEntry,
  LeaveBalance,
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
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [extraMonths, setExtraMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());

  useEffect(() => {
    (async () => {
      try {
        const [rec, ot, late, leave, balances] = await Promise.all([
          fetchSalaryRecords(),
          fetchOvertimeEntries(),
          fetchLateEntries(),
          fetchLeaveEntries(),
          fetchLeaveBalances(),
        ]);
        setRecords(rec);
        setOvertimeEntries(ot);
        setLateEntries(late);
        setLeaveEntries(leave);
        setLeaveBalances(balances);
      } catch (e) {
        setError(e instanceof Error ? e.message : "資料載入失敗");
      } finally {
        setLoading(false);
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
      setError(e instanceof Error ? e.message : "儲存失敗");
    }
  }

  async function handleAddOvertime(entry: {
    work_date: string;
    start_time: string;
    end_time: string;
    minutes: number;
    note?: string;
  }) {
    const saved = await addOvertimeEntry(entry);
    setOvertimeEntries((prev) => [saved, ...prev]);
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

  async function handleSaveBalance(
    leaveType: LeaveType,
    days: number,
    note: string
  ) {
    const saved = await upsertLeaveBalance(leaveType, days, note);
    setLeaveBalances((prev) => [
      ...prev.filter((b) => b.leave_type !== leaveType),
      saved,
    ]);
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
      />

      <SummaryBar
        record={currentRecord}
        overtimeEntries={monthOvertimeEntries}
        leaveEntries={monthLeaveEntries}
        onPayDateChange={(date) => handleRecordChange({ pay_date: date })}
      />

      <BaseSalarySection record={currentRecord} onChange={handleRecordChange} />

      <DeductionsSection record={currentRecord} onChange={handleRecordChange} />

      <OvertimeSection
        record={currentRecord}
        entries={monthOvertimeEntries}
        onAdd={handleAddOvertime}
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
        onAdd={handleAddLate}
        onDelete={(id) =>
          deleteLateEntry(id).then(() =>
            setLateEntries((prev) => prev.filter((e) => e.id !== id))
          )
        }
      />

      <LeaveSection
        entries={monthLeaveEntries}
        onAdd={handleAddLeave}
        onDelete={(id) =>
          deleteLeaveEntry(id).then(() =>
            setLeaveEntries((prev) => prev.filter((e) => e.id !== id))
          )
        }
      />

      <LeaveBalanceSection balances={leaveBalances} onSave={handleSaveBalance} />
    </div>
  );
}
