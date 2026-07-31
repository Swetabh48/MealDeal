export interface UserDietProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  dietaryRestrictions: string[];
  medicalConditions: string[];
  budget: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  additionalInfo?: {
    goalDescription?: string;
    challenges?: string;
    expectations?: string;
  };
  livesInHostel?: boolean;
  messMenuText?: string;
  gymTiming?: string;
}

export interface FoodItem {
  item: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  estimatedCost: number;
  brand?: string;
  recipe?: string;
  benefits?: string;
  source?: 'mess' | 'hostel_supplement' | 'market' | 'rules' | 'ai';
}

export interface Meal {
  name: string;
  time: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCost: number;
}

export interface DayPlan {
  meals: Meal[];
  dailyTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    cost: number;
  };
}

export interface DietPlanData {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  weeklyPlan: Record<string, DayPlan>;
  recommendations: string[];
  supplements: Array<{
    name: string;
    dosage: string;
    reason: string;
    timing: string;
  }>;
  hydration: string;
  exerciseRecommendations?: string;
  progressTracking?: string;
  cautionaryNotes?: string;
  generationMeta?: GenerationMeta;
  groceryList?: import('./grocery-list').GroceryList;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  calorieFloor: number;
  calorieCeiling: number;
}

export interface MealSlot {
  name: string;
  time: string;
  calorieShare: number;
  proteinShare: number;
  kind: 'pre_workout' | 'post_workout' | 'main' | 'snack';
}

export interface MealTimingInfo {
  numberOfMeals: number;
  mealStructure: string;
  workoutMealNote: string;
  slots: MealSlot[];
}

export interface StructuredMessItem {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown';
  day?: string;
}

export interface StructuredMessMenu {
  raw: string;
  items: StructuredMessItem[];
  byDay: Record<string, StructuredMessItem[]>;
  byMealType: Record<string, StructuredMessItem[]>;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  day?: string;
}

export interface ValidationResult {
  ok: boolean;
  score: number;
  issues: ValidationIssue[];
  plan: DietPlanData;
}

export interface GenerationMeta {
  pipeline: 'dual_v1';
  sources: {
    gemini: boolean;
    rules: boolean;
    winner: 'gemini' | 'rules' | 'merged';
  };
  geminiScore?: number;
  rulesScore?: number;
  finalScore: number;
  targets: NutritionTargets;
  issuesFixed: number;
  recipeEnriched: number;
  generatedAt: string;
}

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
