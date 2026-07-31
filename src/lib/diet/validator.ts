import type {
  DayPlan,
  DietPlanData,
  FoodItem,
  Meal,
  NutritionTargets,
  UserDietProfile,
  ValidationIssue,
  ValidationResult,
} from './types';
import { WEEKDAYS } from './types';
import { findFoodEntry, filterFoods, scaleFood } from './food-database';
import { calculateNutritionTargets } from './nutrition-targets';
import { brandLabel } from './brand-picker';

function sumFoods(foods: FoodItem[]) {
  return {
    calories: Math.round(foods.reduce((s, f) => s + Number(f.calories || 0), 0)),
    protein: Math.round(foods.reduce((s, f) => s + Number(f.protein || 0), 0)),
    carbs: Math.round(foods.reduce((s, f) => s + Number(f.carbs || 0), 0)),
    fats: Math.round(foods.reduce((s, f) => s + Number(f.fats || 0), 0)),
    cost: Math.round(foods.reduce((s, f) => s + Number(f.estimatedCost || 0), 0)),
  };
}

/** Recalculate all meal/day totals from foods — fixes AI math errors */
export function recalculatePlanTotals(plan: DietPlanData): DietPlanData {
  const weeklyPlan: Record<string, DayPlan> = { ...plan.weeklyPlan };

  for (const day of WEEKDAYS) {
    const dayPlan = weeklyPlan[day];
    if (!dayPlan?.meals) continue;

    const meals: Meal[] = dayPlan.meals.map((meal) => {
      const foods = (meal.foods || []).map((f) => ({
        ...f,
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fats: Number(f.fats) || 0,
        estimatedCost: Number(f.estimatedCost) || 0,
        quantity: f.quantity || '1 serving',
        item: f.item || 'Food item',
      }));
      const t = sumFoods(foods);
      return {
        name: meal.name || 'Meal',
        time: meal.time || '',
        foods,
        totalCalories: t.calories,
        totalProtein: t.protein,
        totalCarbs: t.carbs,
        totalFats: t.fats,
        totalCost: t.cost,
      };
    });

    const daily = {
      calories: Math.round(meals.reduce((s, m) => s + m.totalCalories, 0)),
      protein: Math.round(meals.reduce((s, m) => s + m.totalProtein, 0)),
      carbs: Math.round(meals.reduce((s, m) => s + m.totalCarbs, 0)),
      fats: Math.round(meals.reduce((s, m) => s + m.totalFats, 0)),
      cost: Math.round(meals.reduce((s, m) => s + m.totalCost, 0)),
    };

    weeklyPlan[day] = { meals, dailyTotal: daily };
  }

  return { ...plan, weeklyPlan };
}

function avgDailyMacros(plan: DietPlanData) {
  let cals = 0;
  let protein = 0;
  let carbs = 0;
  let fats = 0;
  let n = 0;
  for (const day of WEEKDAYS) {
    const d = plan.weeklyPlan[day]?.dailyTotal;
    if (!d) continue;
    cals += d.calories;
    protein += d.protein;
    carbs += d.carbs;
    fats += d.fats;
    n++;
  }
  if (!n) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  return {
    calories: Math.round(cals / n),
    protein: Math.round(protein / n),
    carbs: Math.round(carbs / n),
    fats: Math.round(fats / n),
  };
}

function violatesRestrictions(item: string, restrictions: string[]): boolean {
  const name = item.toLowerCase();
  const r = restrictions.map((x) => x.toLowerCase());

  const nonveg = ['chicken', 'mutton', 'fish', 'meat', 'beef', 'pork', 'prawn', 'egg', 'omelette', 'anda'];
  const eggOnly = ['egg', 'omelette', 'anda'];
  const dairy = ['milk', 'curd', 'dahi', 'paneer', 'butter', 'ghee', 'cheese', 'yogurt'];

  if (r.some((x) => x.includes('vegan'))) {
    if ([...nonveg, ...dairy].some((k) => name.includes(k))) return true;
  }
  if (r.some((x) => x.includes('vegetarian') && !x.includes('egg'))) {
    if (nonveg.some((k) => name.includes(k))) return true;
  }
  if (r.some((x) => x.includes('dairy') || x.includes('lactose'))) {
    if (dairy.some((k) => name.includes(k))) return true;
  }
  return false;
}

/**
 * Score 0–100. Errors heavily penalize; warnings lightly.
 */
export function validateDietPlanData(
  plan: DietPlanData,
  profile: UserDietProfile,
  targets?: NutritionTargets
): ValidationResult {
  const t = targets || calculateNutritionTargets(profile);
  const issues: ValidationIssue[] = [];
  let planFixed = recalculatePlanTotals(plan);

  // Structure
  for (const day of WEEKDAYS) {
    if (!planFixed.weeklyPlan[day]?.meals?.length) {
      issues.push({
        severity: 'error',
        code: 'MISSING_DAY',
        message: `Missing meals for ${day}`,
        day,
      });
    }
  }

  const avg = avgDailyMacros(planFixed);

  if (avg.calories < t.calorieFloor || avg.calories > t.calorieCeiling) {
    issues.push({
      severity: 'error',
      code: 'CALORIE_DRIFT',
      message: `Avg calories ${avg.calories} outside target range ${t.calorieFloor}–${t.calorieCeiling} (target ${t.dailyCalories})`,
    });
  }

  if (avg.protein < t.dailyProtein * 0.75) {
    issues.push({
      severity: 'error',
      code: 'PROTEIN_LOW',
      message: `Avg protein ${avg.protein}g is below 75% of target ${t.dailyProtein}g`,
    });
  } else if (avg.protein < t.dailyProtein * 0.9) {
    issues.push({
      severity: 'warning',
      code: 'PROTEIN_SOFT',
      message: `Avg protein ${avg.protein}g is slightly under target ${t.dailyProtein}g`,
    });
  }

  // Restrictions
  const restrictions = profile.dietaryRestrictions || [];
  for (const day of WEEKDAYS) {
    const meals = planFixed.weeklyPlan[day]?.meals || [];
    for (const meal of meals) {
      for (const food of meal.foods || []) {
        if (violatesRestrictions(food.item, restrictions)) {
          issues.push({
            severity: 'error',
            code: 'RESTRICTION',
            message: `"${food.item}" violates dietary restrictions`,
            day,
          });
        }
      }
    }
  }

  // Hostel mess adherence (soft)
  if (profile.livesInHostel && profile.messMenuText) {
    let messTagged = 0;
    let totalFoods = 0;
    for (const day of WEEKDAYS) {
      for (const meal of planFixed.weeklyPlan[day]?.meals || []) {
        for (const food of meal.foods || []) {
          totalFoods++;
          const brand = (food.brand || '').toLowerCase();
          const recipe = (food.recipe || '').toLowerCase();
          if (brand.includes('mess') || recipe.includes('mess') || food.source === 'mess') messTagged++;
        }
      }
    }
    if (totalFoods > 0 && messTagged / totalFoods < 0.35) {
      issues.push({
        severity: 'warning',
        code: 'MESS_LOW',
        message: 'Hostel plan uses few mess-tagged items; may be impractical.',
      });
    }
  }

  // Empty recipes
  let missingRecipes = 0;
  for (const day of WEEKDAYS) {
    for (const meal of planFixed.weeklyPlan[day]?.meals || []) {
      for (const food of meal.foods || []) {
        if (!food.recipe || food.recipe.trim().length < 8) missingRecipes++;
      }
    }
  }
  if (missingRecipes > 5) {
    issues.push({
      severity: 'warning',
      code: 'RECIPE_GAPS',
      message: `${missingRecipes} foods missing usable recipes`,
    });
  }

  // Align declared targets
  planFixed = {
    ...planFixed,
    dailyCalories: t.dailyCalories,
    dailyProtein: t.dailyProtein,
    dailyCarbs: t.dailyCarbs,
    dailyFats: t.dailyFats,
  };

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errors * 18 - warnings * 6);

  return {
    ok: errors === 0 && score >= 70,
    score,
    issues,
    plan: planFixed,
  };
}

function addProteinBooster(dayPlan: DayPlan, profile: UserDietProfile): DayPlan {
  const pool = filterFoods(['high_protein', 'supplement'], profile.dietaryRestrictions || [], profile.medicalConditions || []);
  const booster = pool[0];
  if (!booster) return dayPlan;

  const meals = [...dayPlan.meals];
  // Prefer post-workout or dinner
  let idx = meals.findIndex((m) => /post-workout|dinner|lunch/i.test(m.name));
  if (idx < 0) idx = meals.length - 1;
  if (idx < 0) return dayPlan;

  const food = {
    item: booster.name,
    ...scaleFood(booster, 1),
    brand: brandLabel(booster.name, profile.budget || 'middle', {
      livesInHostel: false,
      fromMess: false,
    }),
    recipe: booster.recipe,
    benefits: booster.benefits,
    source: 'market' as const,
  };

  const foods = [...meals[idx].foods, food];
  const t = sumFoods(foods);
  meals[idx] = {
    ...meals[idx],
    foods,
    totalCalories: t.calories,
    totalProtein: t.protein,
    totalCarbs: t.carbs,
    totalFats: t.fats,
    totalCost: t.cost,
  };

  return {
    meals,
    dailyTotal: {
      calories: Math.round(meals.reduce((s, m) => s + m.totalCalories, 0)),
      protein: Math.round(meals.reduce((s, m) => s + m.totalProtein, 0)),
      carbs: Math.round(meals.reduce((s, m) => s + m.totalCarbs, 0)),
      fats: Math.round(meals.reduce((s, m) => s + m.totalFats, 0)),
      cost: Math.round(meals.reduce((s, m) => s + m.totalCost, 0)),
    },
  };
}

function stripRestrictedFoods(dayPlan: DayPlan, profile: UserDietProfile): DayPlan {
  const restrictions = profile.dietaryRestrictions || [];
  const meals = dayPlan.meals.map((meal) => {
    const foods = (meal.foods || []).filter((f) => !violatesRestrictions(f.item, restrictions));
    // If emptied, add safe fallback
    if (!foods.length) {
      const pool = filterFoods(['hostel'], restrictions, profile.medicalConditions || []);
      const fb = pool[0];
      if (fb) {
        foods.push({
          item: fb.name,
          ...scaleFood(fb, 1),
          brand: fb.brand,
          recipe: fb.recipe,
          benefits: fb.benefits,
          source: 'rules',
        });
      }
    }
    const t = sumFoods(foods);
    return {
      ...meal,
      foods,
      totalCalories: t.calories,
      totalProtein: t.protein,
      totalCarbs: t.carbs,
      totalFats: t.fats,
      totalCost: t.cost,
    };
  });

  return {
    meals,
    dailyTotal: {
      calories: Math.round(meals.reduce((s, m) => s + m.totalCalories, 0)),
      protein: Math.round(meals.reduce((s, m) => s + m.totalProtein, 0)),
      carbs: Math.round(meals.reduce((s, m) => s + m.totalCarbs, 0)),
      fats: Math.round(meals.reduce((s, m) => s + m.totalFats, 0)),
      cost: Math.round(meals.reduce((s, m) => s + m.totalCost, 0)),
    },
  };
}

/**
 * Repair common failures: restrictions, protein, calorie drift (via boosters / trim note).
 */
export function repairDietPlan(
  plan: DietPlanData,
  profile: UserDietProfile,
  targets?: NutritionTargets
): { plan: DietPlanData; fixes: number } {
  const t = targets || calculateNutritionTargets(profile);
  let fixes = 0;
  let next = recalculatePlanTotals(plan);

  const weeklyPlan: Record<string, DayPlan> = { ...next.weeklyPlan };

  for (const day of WEEKDAYS) {
    let dayPlan = weeklyPlan[day];
    if (!dayPlan) continue;

    const before = JSON.stringify(dayPlan);
    dayPlan = stripRestrictedFoods(dayPlan, profile);
    if (JSON.stringify(dayPlan) !== before) fixes++;

    // Boost protein if day low
    if (dayPlan.dailyTotal.protein < t.dailyProtein * 0.8) {
      dayPlan = addProteinBooster(dayPlan, profile);
      fixes++;
    }

    // Second boost if still low
    if (dayPlan.dailyTotal.protein < t.dailyProtein * 0.85) {
      dayPlan = addProteinBooster(dayPlan, profile);
      fixes++;
    }

    weeklyPlan[day] = dayPlan;
  }

  next = {
    ...next,
    weeklyPlan,
    dailyCalories: t.dailyCalories,
    dailyProtein: t.dailyProtein,
    dailyCarbs: t.dailyCarbs,
    dailyFats: t.dailyFats,
  };

  next = recalculatePlanTotals(next);
  return { plan: next, fixes };
}

/** Prefer higher-scoring plan; if close, merge Gemini variety onto rules macros. */
export function selectBestPlan(
  gemini: ValidationResult | null,
  rules: ValidationResult
): { plan: DietPlanData; winner: 'gemini' | 'rules' | 'merged' } {
  if (!gemini) {
    return { plan: rules.plan, winner: 'rules' };
  }

  if (gemini.ok && gemini.score >= rules.score + 5) {
    return { plan: gemini.plan, winner: 'gemini' };
  }

  if (gemini.ok && Math.abs(gemini.score - rules.score) <= 8) {
    // Merged: keep Gemini meals but force target macros header from rules
    return {
      plan: {
        ...gemini.plan,
        dailyCalories: rules.plan.dailyCalories,
        dailyProtein: rules.plan.dailyProtein,
        dailyCarbs: rules.plan.dailyCarbs,
        dailyFats: rules.plan.dailyFats,
        recommendations: Array.from(
          new Set([...(gemini.plan.recommendations || []), ...(rules.plan.recommendations || [])])
        ).slice(0, 10),
        supplements: gemini.plan.supplements?.length ? gemini.plan.supplements : rules.plan.supplements,
        cautionaryNotes: gemini.plan.cautionaryNotes || rules.plan.cautionaryNotes,
      },
      winner: 'merged',
    };
  }

  return { plan: rules.plan, winner: 'rules' };
}

export function fillMissingRecipes(plan: DietPlanData): { plan: DietPlanData; filled: number } {
  let filled = 0;
  const weeklyPlan: Record<string, DayPlan> = { ...plan.weeklyPlan };

  for (const day of WEEKDAYS) {
    const dayPlan = weeklyPlan[day];
    if (!dayPlan) continue;
    const meals = dayPlan.meals.map((meal) => ({
      ...meal,
      foods: meal.foods.map((food) => {
        if (food.recipe && food.recipe.trim().length >= 8) return food;
        const entry = findFoodEntry(food.item);
        if (entry?.recipe) {
          filled++;
          return {
            ...food,
            recipe: entry.recipe,
            benefits: food.benefits || entry.benefits,
            brand: food.brand || entry.brand,
          };
        }
        if ((food.brand || '').toLowerCase().includes('mess')) {
          filled++;
          return {
            ...food,
            recipe: 'Available in hostel mess. Take listed portion; combine with dal/curd/salad when possible.',
          };
        }
        filled++;
        return {
          ...food,
          recipe: `Simple prep for ${food.item}: portion as listed (${food.quantity}). Cook hygienically with minimal oil; season lightly.`,
        };
      }),
    }));
    weeklyPlan[day] = { ...dayPlan, meals };
  }

  return { plan: { ...plan, weeklyPlan }, filled };
}

/** Strip mess/hostel branding when user is not in hostel; apply budget brand picks. */
export function sanitizePlanBranding(plan: DietPlanData, profile: UserDietProfile): DietPlanData {
  const livesInHostel = !!profile.livesInHostel;
  const weeklyPlan: Record<string, DayPlan> = { ...plan.weeklyPlan };

  for (const day of WEEKDAYS) {
    const dayPlan = weeklyPlan[day];
    if (!dayPlan) continue;
    weeklyPlan[day] = {
      ...dayPlan,
      meals: dayPlan.meals.map((meal) => ({
        ...meal,
        foods: meal.foods.map((food) => {
          const brand = (food.brand || '').toLowerCase();
          const recipe = (food.recipe || '').toLowerCase();
          const benefits = (food.benefits || '').toLowerCase();
          const fromMess =
            food.source === 'mess' ||
            brand.includes('hostel') ||
            brand.includes('mess') ||
            recipe.includes('available in mess') ||
            recipe.includes('hostel mess') ||
            benefits.includes('mess item');

          if (!livesInHostel && fromMess) {
            const pick = brandLabel(food.item, profile.budget || 'middle');
            return {
              ...food,
              brand: pick,
              source: 'market',
              recipe:
                food.recipe && !/mess/i.test(food.recipe)
                  ? food.recipe
                  : findFoodEntry(food.item)?.recipe ||
                    `1. Portion ${food.item} as listed (${food.quantity}).\n2. Cook with minimal oil on medium heat.\n3. Season lightly; serve hot with salad or curd if available.`,
              benefits: (food.benefits || '').replace(/mess item[^.]*\.?/gi, '').trim() ||
                `Fits your plan. Suggested buy: ${pick}.`,
            };
          }

          if (!livesInHostel && (!food.brand || /mess|hostel/i.test(food.brand))) {
            return {
              ...food,
              brand: brandLabel(food.item, profile.budget || 'middle'),
              source: food.source === 'mess' || food.source === 'hostel_supplement' ? 'market' : food.source,
            };
          }

          return food;
        }),
      })),
    };
  }

  let recommendations = plan.recommendations || [];
  if (!livesInHostel) {
    recommendations = recommendations.filter(
      (r) => !/hostel|mess menu|mess food/i.test(r)
    );
  }

  return { ...plan, weeklyPlan, recommendations };
}
