import { generateRulesDietPlan } from '../src/lib/diet/rules-planner';
import { validateDietPlanData, repairDietPlan } from '../src/lib/diet/validator';
import { calculateNutritionTargets } from '../src/lib/diet/nutrition-targets';
import { fillMissingRecipes } from '../src/lib/diet/validator';

const profile = {
  age: 21,
  gender: 'male',
  height: 175,
  weight: 70,
  activityLevel: 'moderate',
  goal: 'muscle_gain',
  dietaryRestrictions: ['Vegetarian'],
  medicalConditions: [],
  budget: 'middle',
  location: { country: 'India', state: 'Maharashtra', city: 'Pune' },
  livesInHostel: true,
  messMenuText:
    'Monday Breakfast: Poha, Tea\nLunch: Roti, Dal, Rice, Sabzi\nDinner: Rice, Dal, Salad\nTuesday Breakfast: Idli Sambar\nLunch: Chapati, Rajma, Rice\nDinner: Khichdi, Curd',
  gymTiming: 'evening',
};

const plan = generateRulesDietPlan(profile as any);
const targets = calculateNutritionTargets(profile as any);
let v = validateDietPlanData(plan, profile as any, targets);
if (!v.ok) {
  const repaired = repairDietPlan(v.plan, profile as any, targets);
  v = validateDietPlanData(repaired.plan, profile as any, targets);
}
const withRecipes = fillMissingRecipes(v.plan);

console.log(
  JSON.stringify(
    {
      targets,
      monMeals: withRecipes.plan.weeklyPlan.monday.meals.map((m) => ({
        name: m.name,
        time: m.time,
        cals: m.totalCalories,
        protein: m.totalProtein,
        items: m.foods.map((f) => f.item),
      })),
      monTotals: withRecipes.plan.weeklyPlan.monday.dailyTotal,
      score: v.score,
      ok: v.ok,
      issues: v.issues,
      sampleRecipe: withRecipes.plan.weeklyPlan.monday.meals[0]?.foods[0]?.recipe?.slice(0, 100),
    },
    null,
    2
  )
);
