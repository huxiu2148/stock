export function toMinutesOfDay(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes between two "HH:MM" times. Handles ranges that cross midnight. */
export function minutesBetween(start: string, end: string): number {
  const startMin = toMinutesOfDay(start);
  let endMin = toMinutesOfDay(end);
  if ([startMin, endMin].some((n) => Number.isNaN(n))) return 0;

  if (endMin < startMin) endMin += 24 * 60; // crossed midnight
  return endMin - startMin;
}

/** 兩個 "HH:MM" 時間區間重疊的分鐘數（皆假設不跨午夜，rangeEnd/breakEnd 需晚於各自的 start）。 */
export function overlapMinutes(
  rangeStart: string,
  rangeEnd: string,
  breakStart: string,
  breakEnd: string
): number {
  const rStart = toMinutesOfDay(rangeStart);
  let rEnd = toMinutesOfDay(rangeEnd);
  if (rEnd < rStart) rEnd += 24 * 60;

  const bStart = toMinutesOfDay(breakStart);
  const bEnd = toMinutesOfDay(breakEnd);

  return Math.max(0, Math.min(rEnd, bEnd) - Math.max(rStart, bStart));
}

/**
 * 同 minutesBetween，但會扣除跟午休 (12:10-13:10) 重疊的時間，
 * 用於請假、遲到時長，避免把不算班的午休時段也算進去。
 */
export function workMinutesBetween(start: string, end: string): number {
  const total = minutesBetween(start, end);
  if (total <= 0) return total;

  const overlap = overlapMinutes(start, end, WORK_HOURS.lunchStart, WORK_HOURS.lunchEnd);
  return total - overlap;
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
