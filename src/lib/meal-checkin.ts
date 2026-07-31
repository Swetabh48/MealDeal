/** Local calendar helpers for meal check-in streaks (no UTC day drift). */

export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateKey(dt);
}

export interface DayAdherence {
  dateKey: string;
  planned: number;
  checkedIn: number;
  /** 0–100 */
  percent: number;
  /** Day counts toward streak if ≥60% of planned meals checked in (or all if ≤2 meals) */
  qualifies: boolean;
}

export function computeDayAdherence(planned: number, checkedIn: number): Omit<DayAdherence, 'dateKey'> {
  if (planned <= 0) {
    return { planned: 0, checkedIn, percent: checkedIn > 0 ? 100 : 0, qualifies: checkedIn > 0 };
  }
  const percent = Math.min(100, Math.round((checkedIn / planned) * 100));
  const need = planned <= 2 ? planned : Math.ceil(planned * 0.6);
  return {
    planned,
    checkedIn: Math.min(checkedIn, planned),
    percent,
    qualifies: checkedIn >= need,
  };
}

/** Count consecutive qualifying days ending at todayKey (inclusive). */
export function computeStreak(
  todayKey: string,
  dayMap: Map<string, { planned: number; checkedIn: number }>
): { currentStreak: number; bestStreak: number; today: DayAdherence } {
  const todayData = dayMap.get(todayKey) || { planned: 0, checkedIn: 0 };
  const today = { dateKey: todayKey, ...computeDayAdherence(todayData.planned, todayData.checkedIn) };

  let currentStreak = 0;
  let key = todayKey;
  // If today doesn't qualify yet, streak can still count yesterday onward
  if (!today.qualifies) {
    key = shiftDateKey(todayKey, -1);
  }

  for (let i = 0; i < 365; i++) {
    const row = dayMap.get(key);
    if (!row) break;
    const adh = computeDayAdherence(row.planned, row.checkedIn);
    if (!adh.qualifies) break;
    currentStreak += 1;
    key = shiftDateKey(key, -1);
  }

  // Best streak in the map window
  const keys = [...dayMap.keys()].sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    const adh = computeDayAdherence(dayMap.get(k)!.planned, dayMap.get(k)!.checkedIn);
    if (!adh.qualifies) {
      run = 0;
      prev = k;
      continue;
    }
    if (prev && shiftDateKey(prev, 1) === k) run += 1;
    else run = 1;
    bestStreak = Math.max(bestStreak, run);
    prev = k;
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak), today };
}
