-- Adds 考核獎金 (evaluation bonus), which is part of the 底薪/薪資合計 subtotal
-- on the payslip, distinct from 考績獎金 (performance_bonus) which is added
-- separately afterward. Run this in the SQL Editor.

alter table salary_records
  add column if not exists base_evaluation_bonus numeric not null default 0;
