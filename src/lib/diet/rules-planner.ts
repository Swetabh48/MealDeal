import type {
  DayPlan,
  DietPlanData,
  FoodItem,
  Meal,
  MealSlot,
  NutritionTargets,
  StructuredMessMenu,
  UserDietProfile,
  Weekday,
} from './types';
import { WEEKDAYS } from './types';
import { calculateMealTiming, calculateNutritionTargets, normalizeShares } from './nutrition-targets';
import { findFoodEntry, filterFoods, scaleFood, type FoodDbEntry } from './food-database';
import { hasUsableMessMenu, messItemsForSlot, parseMessMenu, pickDayVariant } from './mess-parser';
import { pickBrand } from './brand-picker';
import { expandRecipeIfShort } from './expand-recipe';

function mealTotals(foods: FoodItem[]): Omit<Meal, 'name' | 'time' | 'foods'> {
  return {
    totalCalories: Math.round(foods.reduce((s, f) => s + (f.calories || 0), 0)),
    totalProtein: Math.round(foods.reduce((s, f) => s + (f.protein || 0), 0)),
    totalCarbs: Math.round(foods.reduce((s, f) => s + (f.carbs || 0), 0)),
    totalFats: Math.round(foods.reduce((s, f) => s + (f.fats || 0), 0)),
    totalCost: Math.round(foods.reduce((s, f) => s + (f.estimatedCost || 0), 0)),
  };
}

function dayTotals(meals: Meal[]): DayPlan['dailyTotal'] {
  return {
    calories: Math.round(meals.reduce((s, m) => s + m.totalCalories, 0)),
    protein: Math.round(meals.reduce((s, m) => s + m.totalProtein, 0)),
    carbs: Math.round(meals.reduce((s, m) => s + m.totalCarbs, 0)),
    fats: Math.round(meals.reduce((s, m) => s + m.totalFats, 0)),
    cost: Math.round(meals.reduce((s, m) => s + m.totalCost, 0)),
  };
}

function toFoodItem(
  entry: FoodDbEntry,
  factor = 1,
  source: FoodItem['source'] = 'rules',
  ctx?: { budget?: string; livesInHostel?: boolean; fromMess?: boolean }
): FoodItem {
  const scaled = scaleFood(entry, factor);
  const fromMess = ctx?.fromMess || source === 'mess';
  const pick = pickBrand(entry.name, ctx?.budget || 'middle', {
    livesInHostel: ctx?.livesInHostel && fromMess,
    fromMess,
  });
  return {
    item: entry.name,
    quantity: scaled.quantity,
    calories: scaled.calories,
    protein: scaled.protein,
    carbs: scaled.carbs,
    fats: scaled.fats,
    estimatedCost: scaled.estimatedCost,
    brand: fromMess ? 'Hostel Mess' : pick.name,
    recipe: expandRecipeIfShort(entry.name, entry.recipe, scaled.quantity),
    benefits: fromMess
      ? entry.benefits
      : `${entry.benefits} Suggested buy: ${pick.name} — ${pick.why}`,
    source: fromMess ? 'mess' : source === 'hostel_supplement' && !ctx?.livesInHostel ? 'market' : source,
  };
}

function resolveMessOrDb(
  name: string,
  restrictions: string[],
  conditions: string[],
  preferredTags: string[],
  budget: string
): FoodItem | null {
  const junk = /^(tea|coffee|water|salt|sugar|menu|timing|am|pm)$/i;
  if (junk.test(name.trim())) return null;

  const fromDb = findFoodEntry(name);
  if (fromDb) {
    const allowed = filterFoods(undefined, restrictions, conditions).some((f) => f.id === fromDb.id);
    if (allowed) {
      return toFoodItem(fromDb, 1, 'mess', { budget, livesInHostel: true, fromMess: true });
    }
    return null;
  }

  const pool = filterFoods(preferredTags.length ? preferredTags : ['mess'], restrictions, conditions);
  const fallback = pool.find((f) => preferredTags.some((t) => f.tags.includes(t as any))) || pool[0];
  if (!fallback) return null;

  const item = toFoodItem(fallback, 1, 'mess', { budget, livesInHostel: true, fromMess: true });
  item.item = name;
  item.brand = 'Hostel Mess';
  item.recipe =
    'Available in mess — take the portion listed.\n1. Collect the serving as shown on the mess counter.\n2. Add salad/curd/dal if available for better protein.\n3. Avoid second helpings of fried items if cutting weight.';
  item.benefits = `Mess item approximated using ${fallback.name} nutrition values.`;
  return item;
}

function pickFromPool(
  pool: FoodDbEntry[],
  dayIndex: number,
  salt: number,
  count: number
): FoodDbEntry[] {
  if (!pool.length) return [];
  const out: FoodDbEntry[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(dayIndex * 3 + salt + i) % pool.length]);
  }
  return out;
}

function buildSlotFoods(options: {
  profile: UserDietProfile;
  day: Weekday;
  dayIndex: number;
  slot: MealSlot;
  targetCals: number;
  targetProtein: number;
  mess: StructuredMessMenu;
  useMess: boolean;
}): FoodItem[] {
  const { profile, day, dayIndex, slot, targetCals, targetProtein, mess, useMess } = options;
  const restrictions = profile.dietaryRestrictions || [];
  const conditions = profile.medicalConditions || [];
  const budget = profile.budget || 'middle';
  const foodCtx = { budget, livesInHostel: !!profile.livesInHostel };
  const foods: FoodItem[] = [];

  const slotTags =
    slot.kind === 'pre_workout'
      ? ['pre_workout', 'snack']
      : slot.kind === 'post_workout'
        ? ['post_workout', 'high_protein']
        : slot.name.toLowerCase().includes('breakfast')
          ? ['breakfast']
          : slot.name.toLowerCase().includes('lunch')
            ? ['lunch']
            : slot.name.toLowerCase().includes('dinner')
              ? ['dinner']
              : ['snack'];

  if (useMess) {
    const messPool = messItemsForSlot(mess, day, slot.name);
    const pickCount = slot.kind === 'snack' || slot.kind === 'pre_workout' ? 1 : 2;
    const picked = pickDayVariant(day, messPool, pickCount);

    for (const m of picked) {
      const resolved = resolveMessOrDb(m.name, restrictions, conditions, slotTags, budget);
      if (resolved) foods.push(resolved);
    }
  }

  // Fill from DB if mess empty or incomplete
  const isSnackish = slot.kind === 'snack' || slot.kind === 'pre_workout';
  const pool = filterFoods(
    isSnackish
      ? slot.kind === 'pre_workout'
        ? ['pre_workout', 'snack']
        : ['snack', 'supplement']
      : slotTags,
    restrictions,
    conditions
  );
  const hostelExtras = useMess && !isSnackish
    ? filterFoods(['supplement', 'high_protein'], restrictions, conditions)
    : [];
  const combinedPool = [...pool, ...hostelExtras.filter((h) => !pool.some((p) => p.id === h.id))];

  const supplementPool = filterFoods(
    ['high_protein', 'supplement'],
    restrictions,
    conditions
  );

  // Prefer distinct foods
  const usedIds = new Set(foods.map((f) => f.item.toLowerCase()));

  if (!foods.length || (foods.length < 2 && !isSnackish)) {
    const mains = pickFromPool(
      combinedPool.length ? combinedPool : filterFoods(slotTags, restrictions, conditions),
      dayIndex,
      slot.name.length + slot.kind.length,
      isSnackish ? 1 : 2
    );
    for (const f of mains) {
      if (usedIds.has(f.name.toLowerCase())) continue;
      foods.push(
        toFoodItem(f, 1, useMess ? 'hostel_supplement' : 'market', {
          ...foodCtx,
          fromMess: false,
        })
      );
      usedIds.add(f.name.toLowerCase());
    }
  }

  // Protein boost for post-workout / main meals if short
  let protein = foods.reduce((s, f) => s + f.protein, 0);
  let calories = foods.reduce((s, f) => s + f.calories, 0);

  if (!isSnackish && protein < targetProtein * 0.7 && supplementPool.length) {
    const booster =
      supplementPool.find((f) => !usedIds.has(f.name.toLowerCase())) ||
      supplementPool[(dayIndex + 1) % supplementPool.length];
    foods.push(
      toFoodItem(booster, 1, useMess ? 'hostel_supplement' : 'market', {
        ...foodCtx,
        fromMess: false,
      })
    );
    protein += booster.protein;
    calories += booster.calories;
  }

  // Pre-workout: light carb snack preference (oats/PB/fruit/sweet potato rotate by day)
  if (slot.kind === 'pre_workout') {
    const light = filterFoods(['pre_workout'], restrictions, conditions);
    if (light.length && (foods.length === 0 || foods.every((f) => f.calories > 220))) {
      return [
        toFoodItem(light[dayIndex % light.length], 1, 'market', {
          ...foodCtx,
          fromMess: false,
        }),
      ];
    }
  }

  // Post-workout: force a high-protein recovery item + optional fruit/veg for micros
  if (slot.kind === 'post_workout') {
    const recovery = filterFoods(['post_workout', 'high_protein'], restrictions, conditions);
    const micros = filterFoods(['snack'], restrictions, conditions).filter((f) =>
      /fruit|orange|guava|curd|salad|carrot|spinach|amla|berry/i.test(f.name)
    );
    if (recovery.length) {
      const main = toFoodItem(recovery[(dayIndex + 2) % recovery.length], 1, 'market', {
        ...foodCtx,
        fromMess: false,
      });
      const side =
        micros.length > 0
          ? [
              toFoodItem(micros[dayIndex % micros.length], 1, 'market', {
                ...foodCtx,
                fromMess: false,
              }),
            ]
          : [];
      // Prefer recovery plate over whatever was randomly picked if protein was weak
      if (protein < targetProtein * 0.55 || foods.length === 0) {
        return [main, ...side];
      }
      if (!foods.some((f) => f.protein >= 15) && foods.length < 3) {
        foods.unshift(main);
      }
    }
  }

  // Scale gently toward calorie target
  if (calories > 0 && targetCals > 0) {
    const factor = Math.min(1.4, Math.max(0.7, targetCals / calories));
    if (Math.abs(factor - 1) > 0.15) {
      for (const f of foods) {
        const entry = findFoodEntry(f.item);
        if (entry) {
          const scaled = scaleFood(entry, factor);
          f.calories = scaled.calories;
          f.protein = scaled.protein;
          f.carbs = scaled.carbs;
          f.fats = scaled.fats;
          f.estimatedCost = scaled.estimatedCost;
          f.quantity = scaled.quantity;
        } else {
          f.calories = Math.round(f.calories * factor);
          f.protein = Math.round(f.protein * factor * 10) / 10;
          f.carbs = Math.round(f.carbs * factor * 10) / 10;
          f.fats = Math.round(f.fats * factor * 10) / 10;
        }
      }
    }
  }

  // Pre-workout: keep light — trim heavy items
  if (slot.kind === 'pre_workout' && foods.length > 2) {
    return foods.slice(0, 2);
  }

  return foods;
}

function buildRecommendations(profile: UserDietProfile, targets: NutritionTargets): string[] {
  const recs = [
    `Targets: Aim for ~${targets.dailyCalories} kcal with ${targets.dailyProtein}g protein daily.`,
    'Hydration: Drink water consistently; extra 300–500ml around workouts.',
    'Sleep: 7–8 hours supports recovery and appetite control.',
    'Micronutrients: Rotate orange/guava/amla (Vit C), carrot/spinach/sweet potato (Vit A), oats/eggs/dals (B vitamins), fortified milk + sunlight (Vit D/calcium).',
    'Variety: Swap pesto pasta, oats+PB+banana, grilled paneer+broccoli, and dal-palak across the week so meals do not feel repetitive.',
  ];

  if (profile.gymTiming) {
    recs.push(
      `Gym (${profile.gymTiming}): Follow labeled Pre-Workout (light carbs) and Post-Workout (protein + carbs) meals in this plan — do not skip or swap them casually.`
    );
  }

  if (profile.livesInHostel) {
    recs.push('Hostel tip: Keep boiled eggs/peanuts/fruit/curd/oats/PB as backup when mess is carb-heavy.');
    recs.push('Mess strategy: Always add salad/curd/dal when available to improve protein quality.');
  }
  if (profile.goal === 'muscle_gain' || profile.goal === 'weight_gain') {
    recs.push('Surplus tip: Add one extra protein portion (paneer/soya/eggs) if weight stalls for 10+ days.');
  }
  if (profile.goal === 'weight_loss') {
    recs.push('Deficit tip: Prefer roti + sabzi over large rice portions; keep protein high to protect muscle.');
  }
  if ((profile.medicalConditions || []).some((c) => c.toLowerCase().includes('diabetes'))) {
    recs.push('Diabetes: Prefer low-GI combos (dal + roti + salad); avoid sugary drinks and large dessert portions.');
  }
  return recs;
}

function buildSupplements(profile: UserDietProfile): DietPlanData['supplements'] {
  const supplements: DietPlanData['supplements'] = [
    {
      name: 'Vitamin D3',
      dosage: '600–1000 IU/day (as advised)',
      reason: 'Common deficiency; supports bone and immunity',
      timing: 'With a meal containing fat',
    },
  ];

  if (profile.livesInHostel || profile.goal === 'muscle_gain') {
    supplements.push({
      name: 'Whey or Plant Protein',
      dosage: '1 scoop (20–25g protein) on training days',
      reason: 'Helps hit protein target when mess is carb-heavy',
      timing: 'Within 60 minutes post-workout',
    });
  }

  return supplements;
}

export function generateRulesDietPlan(profile: UserDietProfile): DietPlanData {
  const targets = calculateNutritionTargets(profile);
  const timing = calculateMealTiming(profile.gymTiming);
  const slots = normalizeShares(timing.slots);
  const mess = parseMessMenu(profile.messMenuText);
  const useMess = !!(profile.livesInHostel && hasUsableMessMenu(mess));

  const weeklyPlan: Record<string, DayPlan> = {};

  WEEKDAYS.forEach((day, dayIndex) => {
    const meals: Meal[] = slots.map((slot) => {
      const foods = buildSlotFoods({
        profile,
        day,
        dayIndex,
        slot,
        targetCals: Math.round(targets.dailyCalories * slot.calorieShare),
        targetProtein: Math.round(targets.dailyProtein * slot.proteinShare),
        mess,
        useMess,
      });
      return {
        name: slot.name,
        time: slot.time,
        foods,
        ...mealTotals(foods),
      };
    });

    weeklyPlan[day] = {
      meals,
      dailyTotal: dayTotals(meals),
    };
  });

  const cautionBits: string[] = [];
  if ((profile.medicalConditions || []).length) {
    cautionBits.push(
      `Medical conditions noted (${profile.medicalConditions!.join(', ')}): this plan is educational, not a prescription. Consult a doctor for personalized medical diet advice.`
    );
  }
  cautionBits.push('Stop and seek medical help for unexplained chest pain, severe dizziness, or allergic reactions to new foods.');

  return {
    dailyCalories: targets.dailyCalories,
    dailyProtein: targets.dailyProtein,
    dailyCarbs: targets.dailyCarbs,
    dailyFats: targets.dailyFats,
    weeklyPlan,
    recommendations: buildRecommendations(profile, targets),
    supplements: buildSupplements(profile),
    hydration: profile.gymTiming
      ? `Drink 3–3.5L water/day. Have 300–500ml in the 60 mins around your ${profile.gymTiming} workout. Limit large meals 60–90 mins pre-workout.`
      : 'Drink 3–3.5L water/day. Start morning with 300–500ml; sip through the day.',
    exerciseRecommendations:
      'Follow your workout plan; keep 1–2 rest days. Walk 6–8k steps on non-gym days.',
    progressTracking:
      'Track weight weekly (same day/time), waist monthly, and workout energy. Adjust calories ±150 if progress stalls 2+ weeks.',
    cautionaryNotes: cautionBits.join(' '),
  };
}
