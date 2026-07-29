"use client";

import { MoneyInput } from "@/components/MoneyInput";
import { formatCurrency } from "@/lib/format";
import { deductionsTotal } from "@/lib/calc/salary";
import type { SalaryRecord } from "@/types/database";

interface DeductionsSectionProps {
  record: SalaryRecord;
  onChange: (patch: Partial<SalaryRecord>) => void;
}

const FIELDS: { key: keyof SalaryRecord; label: string }[] = [
  { key: "deduct_welfare", label: "福利金" },
  { key: "deduct_labor_insurance", label: "勞保費" },
  { key: "deduct_health_insurance", label: "健保費" },
  { key: "deduct_labor_pension_self", label: "勞退自提" },
  { key: "deduct_guarantee_insurance", label: "人事保證保險" },
];

export function DeductionsSection({ record, onChange }: DeductionsSectionProps) {
  const total = deductionsTotal(record);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">扣除項目</h2>
        <span className="text-sm text-slate-500">
          扣除合計 <b className="text-rose-600">-{formatCurrency(total)}</b>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <MoneyInput
            key={f.key}
            label={f.label}
            value={record[f.key] as number}
            onCommit={(v) => onChange({ [f.key]: v })}
          />
        ))}
      </div>
    </section>
  );
}
