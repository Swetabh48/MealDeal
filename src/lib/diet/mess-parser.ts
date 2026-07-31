import type { StructuredMessItem, StructuredMessMenu, Weekday } from './types';
import { WEEKDAYS } from './types';

const DAY_ALIASES: Record<string, Weekday> = {
  mon: 'monday',
  monday: 'monday',
  tue: 'tuesday',
  tues: 'tuesday',
  tuesday: 'tuesday',
  wed: 'wednesday',
  wednesday: 'wednesday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  thursday: 'thursday',
  fri: 'friday',
  friday: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
  sun: 'sunday',
  sunday: 'sunday',
};

const MEAL_ALIASES: Record<string, StructuredMessItem['mealType']> = {
  breakfast: 'breakfast',
  'break fast': 'breakfast',
  bf: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  supper: 'dinner',
  snacks: 'snack',
  snack: 'snack',
  evening: 'snack',
  'evening snacks': 'snack',
  tea: 'snack',
};

function detectDay(line: string): Weekday | undefined {
  const lower = line.toLowerCase().replace(/[^a-z]/g, ' ');
  for (const [alias, day] of Object.entries(DAY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lower)) return day;
  }
  return undefined;
}

function detectMealType(line: string): StructuredMessItem['mealType'] | undefined {
  const lower = line.toLowerCase();
  for (const [alias, type] of Object.entries(MEAL_ALIASES)) {
    if (lower.includes(alias)) return type;
  }
  return undefined;
}

function cleanItemName(raw: string): string {
  return raw
    .replace(/^[-•*●○\d.)\]]+\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[|]/g, ',')
    .trim();
}

function normalizeLoose(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitFoodTokens(line: string): string[] {
  return line
    .split(/[,;/|+]|\band\b/i)
    .map(cleanItemName)
    .filter((t) => t.length > 1 && t.length < 60)
    .filter((t) => !/^(day|menu|mess|hostel|timing|am|pm|\d+)$/i.test(t));
}

/**
 * Best-effort structure of OCR mess text into day/meal/items.
 * Does not require perfect OCR — unmatched items still usable.
 */
export function parseMessMenu(raw?: string): StructuredMessMenu {
  const empty: StructuredMessMenu = {
    raw: raw || '',
    items: [],
    byDay: {},
    byMealType: { breakfast: [], lunch: [], dinner: [], snack: [], unknown: [] },
  };

  if (!raw || raw.trim().length < 10) return empty;

  let currentDay: Weekday | undefined;
  let currentMeal: StructuredMessItem['mealType'] = 'unknown';
  const items: StructuredMessItem[] = [];

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const day = detectDay(line);
    if (day) currentDay = day;

    const meal = detectMealType(line);
    if (meal) {
      currentMeal = meal;
      // If line is only a header, skip food extraction
      const stripped = line
        .toLowerCase()
        .replace(/breakfast|lunch|dinner|snacks?|evening|supper|break fast/gi, '')
        .replace(/[:\-–—]/g, '')
        .trim();
      if (stripped.length < 3) continue;
    }

    const tokens = splitFoodTokens(line);
    for (const token of tokens) {
      const pureDay = Object.keys(DAY_ALIASES).some(
        (a) => normalizeLoose(token) === a || normalizeLoose(token) === DAY_ALIASES[a]
      );
      const pureMeal = Object.keys(MEAL_ALIASES).some(
        (a) => normalizeLoose(token) === a || normalizeLoose(token) === MEAL_ALIASES[a]
      );
      if (pureDay || pureMeal) continue;

      // Strip leading day/meal words from compound tokens: "Monday Breakfast: Poha" → "Poha"
      const cleanedToken = token
        .replace(
          /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b[:\s-]*/i,
          ''
        )
        .replace(
          /^(breakfast|lunch|dinner|snacks?|supper|evening snacks?|break fast)\b[:\s-]*/i,
          ''
        )
        .trim();

      if (!cleanedToken || cleanedToken.length < 2) continue;

      items.push({
        name: cleanedToken,
        mealType: currentMeal,
        day: currentDay,
      });
    }
  }

  // Deduplicate while keeping order
  const seen = new Set<string>();
  const unique = items.filter((it) => {
    const key = `${it.day || ''}|${it.mealType}|${it.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const byDay: Record<string, StructuredMessItem[]> = {};
  const byMealType: Record<string, StructuredMessItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    unknown: [],
  };

  for (const it of unique) {
    if (it.day) {
      byDay[it.day] = byDay[it.day] || [];
      byDay[it.day].push(it);
    }
    byMealType[it.mealType] = byMealType[it.mealType] || [];
    byMealType[it.mealType].push(it);
  }

  return { raw, items: unique, byDay, byMealType };
}

export function messItemsForSlot(
  menu: StructuredMessMenu,
  day: Weekday,
  slotName: string
): StructuredMessItem[] {
  const lower = slotName.toLowerCase();
  let mealType: StructuredMessItem['mealType'] = 'unknown';
  if (lower.includes('breakfast') || lower.includes('post-workout breakfast')) mealType = 'breakfast';
  else if (lower.includes('lunch')) mealType = 'lunch';
  else if (lower.includes('dinner')) mealType = 'dinner';
  else if (lower.includes('snack') || lower.includes('pre-workout') || lower.includes('post-workout'))
    mealType = 'snack';

  const dayItems = menu.byDay[day] || [];
  const typed = dayItems.filter((i) => i.mealType === mealType);
  if (typed.length) return typed;

  const globalTyped = menu.byMealType[mealType] || [];
  if (globalTyped.length) return globalTyped;

  // Do NOT fall back to all-day/all-menu items for snacks — that dumps lunch dal into snacks.
  if (mealType === 'snack') return [];

  // For main meals without typed labels, use same-day items only
  if (dayItems.length) return dayItems.filter((i) => i.mealType !== 'snack');
  return [];
}

export function hasUsableMessMenu(menu: StructuredMessMenu): boolean {
  return menu.items.length >= 3;
}

/** Rotate through WEEKDAYS for variety when menu has no day labels */
export function pickDayVariant(day: Weekday, pool: StructuredMessItem[], count: number): StructuredMessItem[] {
  if (!pool.length) return [];
  const dayIndex = WEEKDAYS.indexOf(day);
  const start = ((dayIndex >= 0 ? dayIndex : 0) * 2) % pool.length;
  const out: StructuredMessItem[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}
