import { generateRulesDietPlan } from '../src/lib/diet/rules-planner';
import { sanitizePlanBranding } from '../src/lib/diet/validator';

const p = {
  age: 22,
  gender: 'male',
  height: 175,
  weight: 70,
  activityLevel: 'moderate',
  goal: 'muscle_gain',
  dietaryRestrictions: [],
  medicalConditions: [],
  budget: 'middle',
  location: { country: 'India', state: '', city: 'Pune' },
  livesInHostel: false,
  messMenuText: '',
  gymTiming: 'evening',
};

const plan = sanitizePlanBranding(generateRulesDietPlan(p as any), p as any);
const brands = new Set<string>();
for (const day of Object.values(plan.weeklyPlan)) {
  for (const meal of day.meals) {
    for (const food of meal.foods) {
      if (food.brand) brands.add(food.brand);
    }
  }
}
console.log([...brands].slice(0, 15));
console.log('hasHostel', [...brands].some((b) => /hostel|mess/i.test(b)));
