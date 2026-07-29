export function formatCurrency(value: number, currency: "TWD" | "USD" = "TWD"): string {
  const symbol = currency === "USD" ? "US$" : "NT$";
  const rounded = Math.round(value);
  return `${symbol}${rounded.toLocaleString("zh-TW")}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("zh-TW");
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${y} / ${Number(m)}`;
}
