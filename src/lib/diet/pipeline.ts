import type { DietPlanData, GenerationMeta, UserDietProfile } from './types';
import { calculateNutritionTargets } from './nutrition-targets';
import { generateRulesDietPlan } from './rules-planner';
import {
  fillMissingRecipes,
  recalculatePlanTotals,
  repairDietPlan,
  sanitizePlanBranding,
  selectBestPlan,
  validateDietPlanData,
} from './validator';
import { enrichPlanRecipes } from './recipe-enricher';
import { generateGeminiDietPlan } from './gemini-diet';
import { withGroceryList } from './grocery-list';

export type { UserDietProfile, DietPlanData } from './types';

/**
 * Dual diet pipeline:
 * 1) Deterministic nutrition targets
 * 2) Path A: Gemini (creative) + Path B: rules/food-DB (stable) in parallel
 * 3) Validate + score both
 * 4) Select / merge
 * 5) Repair failures
 * 6) Recipe enrichment (local + free TheMealDB / Open Food Facts)
 * 7) Final validation pass
 */
export async function generateDietPlanDual(profile: UserDietProfile): Promise<DietPlanData> {
  const targets = calculateNutritionTargets(profile);
  console.log('📐 Nutrition targets:', {
    calories: targets.dailyCalories,
    protein: targets.dailyProtein,
    carbs: targets.dailyCarbs,
    fats: targets.dailyFats,
    tdee: targets.tdee,
  });

  // Path B is sync / fast — always available
  const rulesRaw = generateRulesDietPlan(profile);
  const rulesValidated = validateDietPlanData(rulesRaw, profile, targets);
  console.log(`🧮 Rules planner score: ${rulesValidated.score}`);

  // Path A: Gemini (may fail on quota / parse)
  let geminiValidated = null as ReturnType<typeof validateDietPlanData> | null;
  let geminiOk = false;

  try {
    console.log('🤖 Running Gemini path in parallel mindset...');
    const geminiRaw = await generateGeminiDietPlan(profile, targets);
    geminiValidated = validateDietPlanData(geminiRaw, profile, targets);
    geminiOk = true;
    console.log(`🤖 Gemini planner score: ${geminiValidated.score}`);
  } catch (err: any) {
    console.warn('⚠️ Gemini path failed, continuing with rules engine:', err?.message || err);
  }

  let { plan, winner } = selectBestPlan(geminiValidated, rulesValidated);
  console.log(`🏆 Selected source: ${winner}`);

  // Repair
  const repaired = repairDietPlan(plan, profile, targets);
  plan = repaired.plan;
  let issuesFixed = repaired.fixes;

  // Local recipe fill
  const filled = fillMissingRecipes(plan);
  plan = filled.plan;

  // Free API / local recipe enrichment
  const enriched = await enrichPlanRecipes(plan);
  plan = enriched.plan;
  const recipeEnriched = filled.filled + enriched.enriched;

  // Final validate + optional second repair
  let final = validateDietPlanData(plan, profile, targets);
  if (!final.ok) {
    console.log('🔧 Final repair pass...');
    const second = repairDietPlan(final.plan, profile, targets);
    plan = second.plan;
    issuesFixed += second.fixes;
    final = validateDietPlanData(plan, profile, targets);
  } else {
    plan = final.plan;
  }

  plan = recalculatePlanTotals(plan);
  plan = sanitizePlanBranding(plan, profile);

  // If still broken, hard-fallback to repaired rules plan
  if (!final.ok) {
    console.warn('⚠️ Final plan still soft-failing; forcing rules baseline');
    const forced = repairDietPlan(rulesValidated.plan, profile, targets);
    plan = sanitizePlanBranding(
      recalculatePlanTotals(fillMissingRecipes(forced.plan).plan),
      profile
    );
    winner = 'rules';
    final = validateDietPlanData(plan, profile, targets);
  }

  const meta: GenerationMeta = {
    pipeline: 'dual_v1',
    sources: {
      gemini: geminiOk,
      rules: true,
      winner,
    },
    geminiScore: geminiValidated?.score,
    rulesScore: rulesValidated.score,
    finalScore: final.score,
    targets,
    issuesFixed,
    recipeEnriched,
    generatedAt: new Date().toISOString(),
  };

  console.log('✅ Dual pipeline complete:', {
    winner: meta.sources.winner,
    finalScore: meta.finalScore,
    issuesFixed: meta.issuesFixed,
    recipeEnriched: meta.recipeEnriched,
  });

  const base = {
    ...plan,
    dailyCalories: targets.dailyCalories,
    dailyProtein: targets.dailyProtein,
    dailyCarbs: targets.dailyCarbs,
    dailyFats: targets.dailyFats,
    generationMeta: meta,
  };

  return withGroceryList(base, {
    budget: profile.budget,
    livesInHostel: profile.livesInHostel,
  });
}
