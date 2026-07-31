import type { MealTimingInfo, MealSlot, UserDietProfile, NutritionTargets } from './types';

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Mifflin-St Jeor BMR + goal-adjusted TDEE targets.
 * Deterministic ground truth for validation & rules planner.
 */
export function calculateNutritionTargets(profile: UserDietProfile): NutritionTargets {
  const weight = profile.weight;
  const height = profile.height;
  const age = profile.age;
  const isFemale = profile.gender?.toLowerCase() === 'female';

  // Mifflin-St Jeor
  const bmr = isFemale
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;

  const activity = ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? 1.2;
  const tdee = Math.round(bmr * activity);

  let dailyCalories = tdee;
  switch (profile.goal) {
    case 'weight_loss':
      dailyCalories = Math.round(tdee - 450);
      break;
    case 'weight_gain':
      dailyCalories = Math.round(tdee + 350);
      break;
    case 'muscle_gain':
      dailyCalories = Math.round(tdee + 250);
      break;
    case 'maintenance':
    default:
      dailyCalories = tdee;
  }

  // Safety floors
  const minCals = isFemale ? 1200 : 1500;
  dailyCalories = Math.max(minCals, dailyCalories);

  // Protein: higher for muscle / weight loss preserve
  let proteinPerKg = 1.6;
  if (profile.goal === 'muscle_gain') proteinPerKg = 2.0;
  else if (profile.goal === 'weight_loss') proteinPerKg = 1.8;
  else if (profile.goal === 'weight_gain') proteinPerKg = 1.7;

  // Medical tweaks
  const conditions = (profile.medicalConditions || []).map((c) => c.toLowerCase());
  if (conditions.some((c) => c.includes('kidney'))) {
    proteinPerKg = Math.min(proteinPerKg, 0.8);
  }
  if (conditions.some((c) => c.includes('diabetes'))) {
    // Slightly lower carb share handled below
  }

  let dailyProtein = Math.round(weight * proteinPerKg);
  dailyProtein = Math.min(dailyProtein, Math.round(dailyCalories * 0.35 / 4));

  let fatPercent = 0.28;
  if (profile.goal === 'weight_loss') fatPercent = 0.25;
  if (conditions.some((c) => c.includes('heart') || c.includes('cholesterol'))) {
    fatPercent = 0.22;
  }

  let dailyFats = Math.round((dailyCalories * fatPercent) / 9);
  let carbCalories = dailyCalories - dailyProtein * 4 - dailyFats * 9;

  if (conditions.some((c) => c.includes('diabetes'))) {
    // Cap carbs ~40% of calories
    const maxCarbCals = dailyCalories * 0.4;
    if (carbCalories > maxCarbCals) {
      carbCalories = maxCarbCals;
      dailyFats = Math.round((dailyCalories - dailyProtein * 4 - carbCalories) / 9);
    }
  }

  const dailyCarbs = Math.max(80, Math.round(carbCalories / 4));

  // Recalibrate fats if needed so macros roughly sum
  const used = dailyProtein * 4 + dailyCarbs * 4 + dailyFats * 9;
  if (Math.abs(used - dailyCalories) > 80) {
    dailyFats = Math.max(30, Math.round((dailyCalories - dailyProtein * 4 - dailyCarbs * 4) / 9));
  }

  return {
    bmr: Math.round(bmr),
    tdee,
    dailyCalories,
    dailyProtein,
    dailyCarbs,
    dailyFats,
    calorieFloor: Math.round(dailyCalories * 0.88),
    calorieCeiling: Math.round(dailyCalories * 1.12),
  };
}

export function calculateMealTiming(gymTiming?: string): MealTimingInfo {
  const defaults: MealTimingInfo = {
    numberOfMeals: 5,
    mealStructure: 'Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner',
    workoutMealNote: 'No workout schedule provided - standard meal timing',
    slots: [
      { name: 'Breakfast', time: '7:30 AM', calorieShare: 0.25, proteinShare: 0.22, kind: 'main' },
      { name: 'Mid-Morning Snack', time: '10:30 AM', calorieShare: 0.1, proteinShare: 0.1, kind: 'snack' },
      { name: 'Lunch', time: '1:00 PM', calorieShare: 0.3, proteinShare: 0.28, kind: 'main' },
      { name: 'Evening Snack', time: '5:00 PM', calorieShare: 0.1, proteinShare: 0.1, kind: 'snack' },
      { name: 'Dinner', time: '8:00 PM', calorieShare: 0.25, proteinShare: 0.3, kind: 'main' },
    ],
  };

  const timingMap: Record<string, MealTimingInfo> = {
    'early-morning': {
      numberOfMeals: 6,
      mealStructure:
        'Pre-Workout Snack (4:30 AM), Post-Workout Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (1:00 PM), Evening Snack (5:00 PM), Dinner (8:00 PM)',
      workoutMealNote:
        'Pre-workout: Light, easily digestible snack 30-45 mins before. Post-workout: Protein-rich breakfast within 30-60 mins after.',
      slots: [
        { name: 'Pre-Workout Snack', time: '4:30 AM', calorieShare: 0.08, proteinShare: 0.06, kind: 'pre_workout' },
        { name: 'Post-Workout Breakfast', time: '7:00 AM', calorieShare: 0.25, proteinShare: 0.28, kind: 'post_workout' },
        { name: 'Mid-Morning Snack', time: '10:00 AM', calorieShare: 0.08, proteinShare: 0.08, kind: 'snack' },
        { name: 'Lunch', time: '1:00 PM', calorieShare: 0.28, proteinShare: 0.26, kind: 'main' },
        { name: 'Evening Snack', time: '5:00 PM', calorieShare: 0.08, proteinShare: 0.08, kind: 'snack' },
        { name: 'Dinner', time: '8:00 PM', calorieShare: 0.23, proteinShare: 0.24, kind: 'main' },
      ],
    },
    morning: {
      numberOfMeals: 6,
      mealStructure:
        'Breakfast (6:30 AM), Pre-Workout Snack (8:30 AM), Post-Workout Meal (10:30 AM), Lunch (1:00 PM), Evening Snack (5:00 PM), Dinner (8:00 PM)',
      workoutMealNote:
        'Pre-workout: Light snack 30-45 mins before. Post-workout: Protein & carb meal within 30-60 mins after.',
      slots: [
        { name: 'Breakfast', time: '6:30 AM', calorieShare: 0.18, proteinShare: 0.16, kind: 'main' },
        { name: 'Pre-Workout Snack', time: '8:30 AM', calorieShare: 0.08, proteinShare: 0.06, kind: 'pre_workout' },
        { name: 'Post-Workout Meal', time: '10:30 AM', calorieShare: 0.18, proteinShare: 0.22, kind: 'post_workout' },
        { name: 'Lunch', time: '1:00 PM', calorieShare: 0.26, proteinShare: 0.24, kind: 'main' },
        { name: 'Evening Snack', time: '5:00 PM', calorieShare: 0.08, proteinShare: 0.08, kind: 'snack' },
        { name: 'Dinner', time: '8:00 PM', calorieShare: 0.22, proteinShare: 0.24, kind: 'main' },
      ],
    },
    'late-morning': {
      numberOfMeals: 5,
      mealStructure:
        'Breakfast (7:00 AM), Pre-Workout Snack (10:30 AM), Post-Workout Lunch (1:00 PM), Evening Snack (5:00 PM), Dinner (8:00 PM)',
      workoutMealNote:
        'Pre-workout: Light snack before workout. Post-workout: Make lunch protein-rich within 60 mins after.',
      slots: [
        { name: 'Breakfast', time: '7:00 AM', calorieShare: 0.22, proteinShare: 0.2, kind: 'main' },
        { name: 'Pre-Workout Snack', time: '10:30 AM', calorieShare: 0.1, proteinShare: 0.08, kind: 'pre_workout' },
        { name: 'Post-Workout Lunch', time: '1:00 PM', calorieShare: 0.32, proteinShare: 0.34, kind: 'post_workout' },
        { name: 'Evening Snack', time: '5:00 PM', calorieShare: 0.1, proteinShare: 0.1, kind: 'snack' },
        { name: 'Dinner', time: '8:00 PM', calorieShare: 0.26, proteinShare: 0.28, kind: 'main' },
      ],
    },
    afternoon: {
      numberOfMeals: 5,
      mealStructure:
        'Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (12:30 PM), Pre-Workout Snack (3:00 PM), Post-Workout Dinner (6:00 PM)',
      workoutMealNote:
        'Pre-workout: Light snack 30-45 mins before. Post-workout: Protein-rich dinner within 60 mins after.',
      slots: [
        { name: 'Breakfast', time: '7:00 AM', calorieShare: 0.24, proteinShare: 0.2, kind: 'main' },
        { name: 'Mid-Morning Snack', time: '10:00 AM', calorieShare: 0.1, proteinShare: 0.1, kind: 'snack' },
        { name: 'Lunch', time: '12:30 PM', calorieShare: 0.28, proteinShare: 0.26, kind: 'main' },
        { name: 'Pre-Workout Snack', time: '3:00 PM', calorieShare: 0.1, proteinShare: 0.08, kind: 'pre_workout' },
        { name: 'Post-Workout Dinner', time: '6:00 PM', calorieShare: 0.28, proteinShare: 0.36, kind: 'post_workout' },
      ],
    },
    evening: {
      numberOfMeals: 6,
      mealStructure:
        'Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (1:00 PM), Pre-Workout Snack (4:30 PM), Post-Workout Meal (6:30 PM), Light Dinner (8:30 PM)',
      workoutMealNote:
        'Pre-workout: Carb-focused snack 45-60 mins before. Post-workout: Protein & carb meal within 30-60 mins. Light dinner later.',
      slots: [
        { name: 'Breakfast', time: '7:00 AM', calorieShare: 0.22, proteinShare: 0.2, kind: 'main' },
        { name: 'Mid-Morning Snack', time: '10:00 AM', calorieShare: 0.08, proteinShare: 0.08, kind: 'snack' },
        { name: 'Lunch', time: '1:00 PM', calorieShare: 0.26, proteinShare: 0.24, kind: 'main' },
        { name: 'Pre-Workout Snack', time: '4:30 PM', calorieShare: 0.1, proteinShare: 0.08, kind: 'pre_workout' },
        { name: 'Post-Workout Meal', time: '6:30 PM', calorieShare: 0.2, proteinShare: 0.26, kind: 'post_workout' },
        { name: 'Light Dinner', time: '8:30 PM', calorieShare: 0.14, proteinShare: 0.14, kind: 'main' },
      ],
    },
    night: {
      numberOfMeals: 6,
      mealStructure:
        'Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (1:00 PM), Evening Snack (5:00 PM), Pre-Workout Snack (7:30 PM), Post-Workout Dinner (9:30 PM)',
      workoutMealNote:
        'Pre-workout: Light snack 30-45 mins before. Post-workout: Protein-rich but lighter dinner within 60 mins after.',
      slots: [
        { name: 'Breakfast', time: '7:00 AM', calorieShare: 0.22, proteinShare: 0.2, kind: 'main' },
        { name: 'Mid-Morning Snack', time: '10:00 AM', calorieShare: 0.08, proteinShare: 0.08, kind: 'snack' },
        { name: 'Lunch', time: '1:00 PM', calorieShare: 0.28, proteinShare: 0.26, kind: 'main' },
        { name: 'Evening Snack', time: '5:00 PM', calorieShare: 0.08, proteinShare: 0.08, kind: 'snack' },
        { name: 'Pre-Workout Snack', time: '7:30 PM', calorieShare: 0.08, proteinShare: 0.06, kind: 'pre_workout' },
        { name: 'Post-Workout Dinner', time: '9:30 PM', calorieShare: 0.26, proteinShare: 0.32, kind: 'post_workout' },
      ],
    },
    flexible: defaults,
  };

  if (!gymTiming) return defaults;
  return timingMap[gymTiming] || timingMap.flexible;
}

export function normalizeShares(slots: MealSlot[]): MealSlot[] {
  const calSum = slots.reduce((s, x) => s + x.calorieShare, 0) || 1;
  const proSum = slots.reduce((s, x) => s + x.proteinShare, 0) || 1;
  return slots.map((s) => ({
    ...s,
    calorieShare: s.calorieShare / calSum,
    proteinShare: s.proteinShare / proSum,
  }));
}
