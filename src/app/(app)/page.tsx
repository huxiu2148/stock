"use client";

import { errorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchSalaryRecords,
  fetchOvertimeEntries,
  fetchLateEntries,
  fetchLeaveEntries,
} from "@/lib/repo/salary";
import { fetchUserSettings } from "@/lib/repo/settings";
import { fetchStockTrades } from "@/lib/repo/stocks";
import { summarizeSalaryRecord, summarizeYearlySalary } from "@/lib/calc/salary";
import {
  computeAnnualLeaveBalance,
  computeMenstrualLeaveBalance,
} from "@/lib/calc/leaveBalance";
import { summarizeStockTrades } from "@/lib/calc/stock";
import { formatCurrency, formatYearMonth } from "@/lib/format";
import type {
  LateEntry,
  LeaveEntry,
  OvertimeEntry,
  SalaryRecord,
  StockTrade,
} from "@/types/database";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [overtimeEntries, setOvertimeEntries] = useState<OvertimeEntry[]>([]);
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [lateEntries, setLateEntries] = useState<LateEntry[]>([]);
  const [hireDate, setHireDate] = useState<string | null>(null);
  const [trades, setTrades] = useState<StockTrade[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [rec, ot, late, leave, stockTrades] = await Promise.all([
          fetchSalaryRecords(),
          fetchOvertimeEntries(),
          fetchLateEntries(),
          fetchLeaveEntries(),
          fetchStockTrades(),
        ]);
        setRecords(rec);
        setOvertimeEntries(ot);
        setLateEntries(late);
        setLeaveEntries(leave);
        setTrades(stockTrades);
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

  const thisMonth = currentYearMonth();
  const currentRecord = records.find((r) => r.year_month === thisMonth);
  const currentTotals = useMemo(() => {
    if (!currentRecord) return null;
    const entries = overtimeEntries.filter((e) =>
      e.work_date.startsWith(thisMonth)
    );
    const leave = leaveEntries.filter((e) => e.work_date.startsWith(thisMonth));
    const late = lateEntries.filter((e) => e.work_date.startsWith(thisMonth));
    return summarizeSalaryRecord(currentRecord, entries, leave, late);
  }, [currentRecord, overtimeEntries, leaveEntries, lateEntries, thisMonth]);

  const annualLeaveBalance = useMemo(
    () => computeAnnualLeaveBalance(hireDate, leaveEntries),
    [hireDate, leaveEntries]
  );
  const menstrualLeaveBalance = useMemo(
    () => computeMenstrualLeaveBalance(leaveEntries),
    [leaveEntries]
  );

  const stockSummary = useMemo(() => summarizeStockTrades(trades), [trades]);
  const yearlySalary = useMemo(
    () => summarizeYearlySalary(records, overtimeEntries, leaveEntries, lateEntries),
    [records, overtimeEntries, leaveEntries, lateEntries]
  );

  if (loading) return <p className="text-sm text-slate-400">載入中…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/salary"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
        >
          <div className="text-xs text-slate-400">
            {formatYearMonth(thisMonth)} 本月薪資
          </div>
          {currentTotals ? (
            <>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(currentTotals.netPay)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                應發 {formatCurrency(currentTotals.grossPay)} · 扣除{" "}
                {formatCurrency(currentTotals.deductions)}
                {currentTotals.leaveDeduction > 0 && (
                  <> · 請假扣款 {formatCurrency(currentTotals.leaveDeduction)}</>
                )}
                {currentTotals.lateDeduction > 0 && (
                  <> · 遲到扣款 {formatCurrency(currentTotals.lateDeduction)}</>
                )}
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-slate-400">尚未建立本月紀錄，點我新增</div>
          )}
        </Link>

        <Link
          href="/stocks"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
        >
          <div className="text-xs text-slate-400">股票已實現損益 (台幣)</div>
          <div
            className={`mt-2 text-2xl font-bold ${
              stockSummary.realizedGainTwd >= 0
                ? "text-rose-600"
                : "text-emerald-600"
            }`}
          >
            {stockSummary.realizedGainTwd >= 0 ? "+" : ""}
            {formatCurrency(stockSummary.realizedGainTwd)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            持有中 {stockSummary.openPositions} 筆 · 投入{" "}
            {formatCurrency(stockSummary.investedTwdOpen)}
          </div>
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-semibold text-slate-700">年度薪資統計</h2>
        {yearlySalary.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">尚無薪資紀錄</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                  <th className="py-2 pr-3">年度</th>
                  <th className="py-2 pr-3">月數</th>
                  <th className="py-2 pr-3">實發總額</th>
                  <th className="py-2 pr-3">平均月薪 (實發)</th>
                  <th className="py-2 pr-3">應發總額</th>
                </tr>
              </thead>
              <tbody>
                {yearlySalary.map((y) => (
                  <tr key={y.year} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {y.year}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{y.monthCount}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-900">
                      {formatCurrency(y.totalNet)}
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {formatCurrency(y.avgNet)}
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {formatCurrency(y.totalGross)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">假別剩餘天數</h2>
          <Link href="/salary" className="text-xs text-slate-400 hover:text-slate-700">
            管理 →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {annualLeaveBalance ? (
            <div className="rounded-xl bg-rose-50 p-3">
              <div className="text-xs font-medium text-rose-700">特休剩餘</div>
              <div className="text-lg font-bold text-rose-700">
                {Math.max(0, Math.round(annualLeaveBalance.remaining * 10) / 10)} 天
              </div>
              <div className="text-xs text-rose-400">
                總額 {annualLeaveBalance.quota} 天
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
              尚未設定到職日，無法計算特休。
              <Link href="/salary" className="ml-1 underline">
                去設定
              </Link>
            </div>
          )}
          <div className="rounded-xl bg-rose-50 p-3">
            <div className="text-xs font-medium text-rose-700">生理假剩餘</div>
            <div className="text-lg font-bold text-rose-700">
              {Math.max(0, Math.round(menstrualLeaveBalance.remaining * 10) / 10)} 天
            </div>
            <div className="text-xs text-rose-400">
              總額 {menstrualLeaveBalance.quota} 天
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
