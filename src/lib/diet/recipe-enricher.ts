import type { DietPlanData, FoodItem } from './types';
import { WEEKDAYS } from './types';
import { findFoodEntry } from './food-database';

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';

interface RecipeHit {
  title: string;
  instructions: string;
  source: 'themealdb' | 'openfoodfacts' | 'local';
  image?: string;
}

const cache = new Map<string, RecipeHit | null>();

function formatMealDbInstructions(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      if (/^\d+[\).\]]/.test(l)) return l;
      return `${i + 1}. ${l}`;
    })
    .join('\n');
}

async function fetchMealDb(query: string): Promise<RecipeHit | null> {
  const key = `mdb:${query.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key) || null;

  try {
    const q = encodeURIComponent(query.split(/\s+/)[0]);
    const res = await fetch(`${MEALDB_BASE}/search.php?s=${q}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    const meal = data?.meals?.[0];
    if (!meal?.strInstructions) {
      cache.set(key, null);
      return null;
    }
    const hit: RecipeHit = {
      title: meal.strMeal,
      instructions: formatMealDbInstructions(meal.strInstructions),
      source: 'themealdb',
      image: meal.strMealThumb || undefined,
    };
    cache.set(key, hit);
    return hit;
  } catch {
    cache.set(key, null);
    return null;
  }
}

/**
 * Open Food Facts — free, no key. Best for packaged items; used as light enrichment.
 */
async function fetchOpenFoodFactsHint(query: string): Promise<RecipeHit | null> {
  const key = `off:${query.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key) || null;

  try {
    const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'YeleDiet/1.0 (diet planner; educational)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    const product = data?.products?.[0];
    if (!product) {
      cache.set(key, null);
      return null;
    }

    const name = product.product_name || query;
    const brands = product.brands || '';
    const hit: RecipeHit = {
      title: name,
      instructions: brands
        ? `Packaged option: ${name} (${brands}). Use the quantity listed in your meal plan. Check label for allergens.`
        : `Packaged/common product match: ${name}. Use the quantity listed in your meal plan.`,
      source: 'openfoodfacts',
      image: product.image_front_small_url || undefined,
    };
    cache.set(key, hit);
    return hit;
  } catch {
    cache.set(key, null);
    return null;
  }
}

/**
 * Optional USDA FoodData Central — free key from https://api.data.gov/signup/
 * Set USDA_API_KEY in .env — DEMO_KEY works for light testing but is rate-limited.
 */
export async function lookupUsdaNutrition(query: string): Promise<{
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
} | null> {
  const apiKey = process.env.USDA_API_KEY || process.env.FDC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=1`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const food = data?.foods?.[0];
    if (!food) return null;

    const nutrients = food.foodNutrients || [];
    const find = (id: number) => nutrients.find((n: any) => n.nutrientId === id)?.value;

    return {
      description: food.description,
      calories: find(1008),
      protein: find(1003),
      carbs: find(1005),
      fats: find(1004),
    };
  } catch {
    return null;
  }
}

function needsEnrichment(food: FoodItem): boolean {
  const recipe = (food.recipe || '').trim();
  if (recipe.length < 25) return true;
  if (/^available in mess/i.test(recipe)) return false; // keep mess note
  if (recipe.split('\n').length < 2 && recipe.length < 80) return true;
  return false;
}

async function enrichOneFood(food: FoodItem): Promise<{ food: FoodItem; enriched: boolean }> {
  // Prefer local DB recipes first
  const local = findFoodEntry(food.item);
  if (local?.recipe && (!(food.recipe && food.recipe.length > local.recipe.length) || needsEnrichment(food))) {
    return {
      food: {
        ...food,
        recipe: food.recipe && food.recipe.length > 40 && !needsEnrichment(food) ? food.recipe : local.recipe,
        benefits: food.benefits || local.benefits,
        brand: food.brand || local.brand,
      },
      enriched: true,
    };
  }

  let next = { ...food };
  let enriched = false;

  // USDA: cross-check / fill macros when local DB has no entry
  if (!local && process.env.USDA_API_KEY) {
    const usda = await lookupUsdaNutrition(food.item);
    if (usda && (usda.calories || usda.protein)) {
      const note = `USDA ref: ${usda.description}` +
        (usda.calories != null ? ` (~${Math.round(usda.calories)} kcal/100g` : '') +
        (usda.protein != null ? `, ${Math.round(usda.protein)}g protein` : '') +
        (usda.calories != null ? ')' : '');
      next = {
        ...next,
        // Only override macros if AI left zeros / missing
        calories: next.calories > 0 ? next.calories : Math.round(usda.calories || 0),
        protein: next.protein > 0 ? next.protein : Math.round((usda.protein || 0) * 10) / 10,
        carbs: next.carbs > 0 ? next.carbs : Math.round((usda.carbs || 0) * 10) / 10,
        fats: next.fats > 0 ? next.fats : Math.round((usda.fats || 0) * 10) / 10,
        benefits: next.benefits ? `${next.benefits} (${note})` : note,
        brand: next.brand || 'USDA FoodData',
      };
      enriched = true;
    }
  }

  if (!needsEnrichment(next)) {
    return { food: next, enriched };
  }

  const mealDb = await fetchMealDb(food.item);
  if (mealDb) {
    return {
      food: {
        ...next,
        recipe: `${mealDb.instructions}\n\n(Adapted from ${mealDb.title} via TheMealDB — adjust spices/portions to your plan.)`,
        brand: next.brand || 'Recipe enriched',
      },
      enriched: true,
    };
  }

  const off = await fetchOpenFoodFactsHint(food.item);
  if (off) {
    return {
      food: {
        ...next,
        recipe: next.recipe && next.recipe.length > 15 ? `${next.recipe}\n\n${off.instructions}` : off.instructions,
        brand: next.brand || off.title,
      },
      enriched: true,
    };
  }

  return { food: next, enriched };
}

/**
 * Enrich recipes across the weekly plan using local DB + free APIs.
 * Caps external calls to keep generation fast.
 */
export async function enrichPlanRecipes(plan: DietPlanData): Promise<{ plan: DietPlanData; enriched: number }> {
  let enriched = 0;
  let externalCalls = 0;
  const MAX_EXTERNAL = 12;

  const weeklyPlan = { ...plan.weeklyPlan };

  for (const day of WEEKDAYS) {
    const dayPlan = weeklyPlan[day];
    if (!dayPlan) continue;

    const meals = [];
    for (const meal of dayPlan.meals) {
      const foods = [];
      for (const food of meal.foods || []) {
        if (externalCalls >= MAX_EXTERNAL && needsEnrichment(food)) {
          const local = findFoodEntry(food.item);
          if (local) {
            foods.push({
              ...food,
              recipe: local.recipe,
              benefits: food.benefits || local.benefits,
              brand: food.brand || local.brand,
            });
            enriched++;
          } else {
            foods.push(food);
          }
          continue;
        }

        const beforeCalls = externalCalls;
        // Count potential external only when local miss
        const local = findFoodEntry(food.item);
        if (!local && needsEnrichment(food)) externalCalls++;

        const result = await enrichOneFood(food);
        if (result.enriched) enriched++;
        if (!local && needsEnrichment(food) && beforeCalls === externalCalls) {
          // enrichOneFood may have called APIs
        }
        foods.push(result.food);
      }
      meals.push({ ...meal, foods });
    }

    weeklyPlan[day] = { ...dayPlan, meals };
  }

  return { plan: { ...plan, weeklyPlan }, enriched };
}
