/** Minutes between two "HH:MM" times. Handles ranges that cross midnight. */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;

  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin < startMin) endMin += 24 * 60; // crossed midnight
  return endMin - startMin;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} 分鐘`;
  if (m === 0) return `${h} 小時`;
  return `${h} 小時 ${m} 分鐘`;
}

export const WORK_HOURS = {
  start: "08:10",
  end: "17:10",
  lunchStart: "12:10",
  lunchEnd: "13:10",
};
