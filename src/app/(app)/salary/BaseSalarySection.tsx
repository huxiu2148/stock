"use client";

import { MoneyInput } from "@/components/MoneyInput";
import { formatCurrency } from "@/lib/format";
import { baseSalaryTotal } from "@/lib/calc/salary";
import type { SalaryRecord } from "@/types/database";

interface BaseSalarySectionProps {
  record: SalaryRecord;
  onChange: (patch: Partial<SalaryRecord>) => void;
}

const FIELDS: { key: keyof SalaryRecord; label: string }[] = [
  { key: "base_basic", label: "基本底薪" },
  { key: "base_position", label: "職務加給" },
  { key: "base_meal", label: "伙食費" },
  { key: "base_other", label: "其他" },
  { key: "base_other_allowance", label: "其他加給" },
  { key: "base_night_shift", label: "夜班津貼" },
];

export function BaseSalarySection({ record, onChange }: BaseSalarySectionProps) {
  const total = baseSalaryTotal(record);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">底薪組成</h2>
        <span className="text-sm text-slate-500">
          底薪合計 <b className="text-slate-900">{formatCurrency(total)}</b>
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

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:w-2/3">
        <MoneyInput
          label="考績獎金"
          value={record.performance_bonus}
          onCommit={(v) => onChange({ performance_bonus: v })}
        />
        <MoneyInput
          label="獎金"
          value={record.bonus}
          onCommit={(v) => onChange({ bonus: v })}
        />
      </div>
    </section>
  );
}
