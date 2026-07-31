import type { DietPlanData } from './types';
import { WEEKDAYS } from './types';
import { inferBrandCategory, pickBrand, type BrandCategory, type BudgetTier } from './brand-picker';

export type GroceryCadence = 'weekly' | 'monthly';

export interface GroceryItem {
  name: string;
  brand: string;
  packSize: string;
  packQty: number;
  qtyPerItem: string;
  quantity: string;
  unitPriceInr: number;
  lineTotalInr: number;
  bestBuyFrom: string;
  notes?: string;
  nutritionInfo?: string;
  category: BrandCategory | 'produce' | 'protein_food' | 'other';
  cadence: GroceryCadence;
  usedInMeals: number;
}

export interface GrocerySpendBreakdown {
  thisWeekFreshInr: number;
  monthlyStaplesFullBuyInr: number;
  monthlyShareChargedThisWeekInr: number;
  estimatedWeekFoodSpendInr: number;
  formula: string;
  plainEnglish: string;
}

export interface GroceryList {
  weekly: GroceryItem[];
  monthly: GroceryItem[];
  weeklyTotalInr: number;
  monthlyTotalInr: number;
  estimatedWeekFoodSpendInr: number;
  spendBreakdown: GrocerySpendBreakdown;
  notes: string[];
  generatedAt: string;
}

interface MarketInfo {
  packLabel: string;
  packSize: string;
  qtyPerItem: string;
  priceByBudget: Record<BudgetTier, number>;
  bestBuy: Record<BudgetTier, string>;
  cadence: GroceryCadence;
  servingsPerPack: number;
  nutritionByBudget?: Record<BudgetTier, string>;
  defaultBrand?: Record<BudgetTier, string>;
}

const MARKET: Partial<Record<BrandCategory | 'produce' | 'protein_food', MarketInfo>> = {
  atta: {
    packLabel: '5 kg pack',
    packSize: '5 kg',
    qtyPerItem: '~100–120g flour / roti meal',
    priceByBudget: { lower: 220, middle: 280, upper: 380 },
    bestBuy: {
      lower: 'Local chakki / kirana',
      middle: 'Supermarket / BigBasket',
      upper: 'Organic / trusted chakki',
    },
    cadence: 'monthly',
    servingsPerPack: 40,
  },
  rice: {
    packLabel: '5 kg pack',
    packSize: '5 kg',
    qtyPerItem: '~75–100g raw rice / plate',
    priceByBudget: { lower: 280, middle: 420, upper: 650 },
    bestBuy: {
      lower: 'Kirana loose',
      middle: 'Supermarket / DMart 5kg',
      upper: 'Brand basmati if needed',
    },
    cadence: 'monthly',
    servingsPerPack: 35,
  },
  oil: {
    packLabel: '1 L bottle',
    packSize: '1 L',
    qtyPerItem: '~1–2 tsp / meal',
    priceByBudget: { lower: 140, middle: 190, upper: 320 },
    bestBuy: {
      lower: 'Kirana / DMart',
      middle: 'Supermarket offers',
      upper: 'Local mill cold-pressed',
    },
    cadence: 'monthly',
    servingsPerPack: 40,
  },
  dairy_milk: {
    packLabel: '1 L pouch',
    packSize: '1 L',
    qtyPerItem: '250–300 ml / glass',
    priceByBudget: { lower: 58, middle: 68, upper: 78 },
    bestBuy: {
      lower: 'Local dairy / Amul pouch',
      middle: 'Amul / Mother Dairy subscription',
      upper: 'Amul Gold / full cream',
    },
    cadence: 'weekly',
    servingsPerPack: 1,
    nutritionByBudget: {
      lower: 'Toned ≈ 3% fat, ~3.1% protein; often Vit A/D fortified.',
      middle: 'Amul / MD toned ≈ 3% fat, ~3.1–3.3% protein.',
      upper: 'Full cream ≈ 6% fat; double-toned ≈ 1.5% fat if cutting.',
    },
  },
  dairy_curd: {
    packLabel: '1 kg tub',
    packSize: '1 kg',
    qtyPerItem: '150–200g / bowl',
    priceByBudget: { lower: 70, middle: 95, upper: 140 },
    bestBuy: {
      lower: 'Homemade from milk',
      middle: 'Amul / Mother Dairy 1kg',
      upper: 'Greek-style cups',
    },
    cadence: 'weekly',
    servingsPerPack: 5,
  },
  paneer: {
    packLabel: '200g pack',
    packSize: '200 g',
    qtyPerItem: '100–150g / meal',
    priceByBudget: { lower: 80, middle: 95, upper: 110 },
    bestBuy: {
      lower: 'Local dairy',
      middle: 'Amul paneer',
      upper: 'Amul / Milky Mist',
    },
    cadence: 'weekly',
    servingsPerPack: 2,
  },
  bread: {
    packLabel: '1 loaf',
    packSize: '1 loaf',
    qtyPerItem: '2 slices / snack',
    priceByBudget: { lower: 35, middle: 45, upper: 70 },
    bestBuy: {
      lower: 'Local bakery atta bread',
      middle: 'Britannia / Modern',
      upper: 'Specialty bakery',
    },
    cadence: 'weekly',
    servingsPerPack: 6,
  },
  oats: {
    packLabel: '1 kg box',
    packSize: '1 kg',
    qtyPerItem: '40g dry / bowl',
    priceByBudget: { lower: 160, middle: 220, upper: 320 },
    bestBuy: {
      lower: 'Kirana rolled oats',
      middle: 'Quaker / Saffola',
      upper: 'True Elements',
    },
    cadence: 'monthly',
    servingsPerPack: 20,
  },
  peanuts: {
    packLabel: '500g / PB jar',
    packSize: '500 g',
    qtyPerItem: '1 tbsp PB or handful',
    priceByBudget: { lower: 90, middle: 130, upper: 200 },
    bestBuy: {
      lower: 'Kirana / Pintola sale',
      middle: 'Pintola / Sundrop natural PB',
      upper: 'Happilo / Farmley',
    },
    cadence: 'monthly',
    servingsPerPack: 12,
  },
  eggs: {
    packLabel: 'Tray of 12',
    packSize: '12 eggs',
    qtyPerItem: '2–3 eggs / meal',
    priceByBudget: { lower: 70, middle: 84, upper: 100 },
    bestBuy: {
      lower: 'Local market',
      middle: 'Supermarket / Suguna',
      upper: 'Cage-free if available',
    },
    cadence: 'weekly',
    servingsPerPack: 6,
  },
  protein_powder: {
    packLabel: '1 kg tub',
    packSize: '1 kg',
    qtyPerItem: '1 scoop (~30g)',
    priceByBudget: { lower: 1600, middle: 2800, upper: 4500 },
    bestBuy: {
      lower: 'Nakpro / MB discount',
      middle: 'MuscleBlaze / ON sale',
      upper: 'ON / MyProtein deals',
    },
    cadence: 'monthly',
    servingsPerPack: 30,
  },
  besan: {
    packLabel: '1 kg',
    packSize: '1 kg',
    qtyPerItem: '~40–50g / 2 chillas',
    priceByBudget: { lower: 90, middle: 120, upper: 160 },
    bestBuy: {
      lower: 'Kirana loose',
      middle: 'Rajdhani / Fortune',
      upper: 'Organic besan',
    },
    cadence: 'monthly',
    servingsPerPack: 15,
  },
  dal: {
    packLabel: '1 kg pack',
    packSize: '1 kg',
    qtyPerItem: '~30–40g dry / bowl',
    priceByBudget: { lower: 120, middle: 160, upper: 220 },
    bestBuy: {
      lower: 'Kirana loose',
      middle: 'Tata Sampann / Fortune',
      upper: 'Organic / unpolished',
    },
    cadence: 'monthly',
    servingsPerPack: 20,
  },
  spices: {
    packLabel: 'Spice refill kit',
    packSize: 'assorted',
    qtyPerItem: 'pinch–1 tsp / meal',
    priceByBudget: { lower: 120, middle: 200, upper: 350 },
    bestBuy: {
      lower: 'Kirana loose',
      middle: 'MDH / Everest',
      upper: 'Whole spices',
    },
    cadence: 'monthly',
    servingsPerPack: 60,
  },
  soya: {
    packLabel: '200g pack',
    packSize: '200 g',
    qtyPerItem: '40–50g dry / curry',
    priceByBudget: { lower: 45, middle: 55, upper: 70 },
    bestBuy: {
      lower: 'Kirana / DMart',
      middle: 'Nutrela',
      upper: 'Nutrela / organic',
    },
    cadence: 'monthly',
    servingsPerPack: 6,
  },
  produce: {
    packLabel: 'per item',
    packSize: '500 g–1 kg',
    qtyPerItem: 'as per meal',
    priceByBudget: { lower: 40, middle: 55, upper: 80 },
    bestBuy: {
      lower: 'Local sabzi mandi',
      middle: 'Mandi + supermarket',
      upper: 'Organic / premium mandi',
    },
    cadence: 'weekly',
    servingsPerPack: 4,
    defaultBrand: {
      lower: 'Local sabzi mandi',
      middle: 'Local sabzi mandi',
      upper: 'Local / organic mandi',
    },
  },
  protein_food: {
    packLabel: '500 g–1 kg',
    packSize: '500 g',
    qtyPerItem: '120–150g cooked',
    priceByBudget: { lower: 180, middle: 250, upper: 350 },
    bestBuy: {
      lower: 'Local butcher',
      middle: 'Trusted butcher / Licious sale',
      upper: 'Premium butcher',
    },
    cadence: 'weekly',
    servingsPerPack: 3,
  },
  general: {
    packLabel: 'as needed',
    packSize: 'as needed',
    qtyPerItem: 'per recipe',
    priceByBudget: { lower: 80, middle: 120, upper: 180 },
    bestBuy: {
      lower: 'Kirana',
      middle: 'Supermarket',
      upper: 'Trusted store',
    },
    cadence: 'weekly',
    servingsPerPack: 4,
  },
};

/** Named produce → display + typical pack */
const PRODUCE_CATALOG: Record<
  string,
  { name: string; packSize: string; qtyPerItem: string; unitPrice: Record<BudgetTier, number> }
> = {
  banana: { name: 'Banana', packSize: '1 dozen', qtyPerItem: '1 fruit', unitPrice: { lower: 40, middle: 50, upper: 70 } },
  apple: { name: 'Apple', packSize: '1 kg', qtyPerItem: '1 fruit', unitPrice: { lower: 120, middle: 160, upper: 220 } },
  orange: { name: 'Orange', packSize: '1 kg', qtyPerItem: '1 fruit', unitPrice: { lower: 60, middle: 80, upper: 120 } },
  guava: { name: 'Guava', packSize: '1 kg', qtyPerItem: '1 fruit', unitPrice: { lower: 50, middle: 70, upper: 100 } },
  amla: { name: 'Amla', packSize: '250 g', qtyPerItem: '½–1 fruit', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  papaya: { name: 'Papaya', packSize: '1 kg', qtyPerItem: '1 bowl', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  pomegranate: { name: 'Pomegranate', packSize: '1 kg', qtyPerItem: '½ fruit', unitPrice: { lower: 140, middle: 180, upper: 250 } },
  berry: { name: 'Berries / strawberries', packSize: '200 g', qtyPerItem: '1 handful', unitPrice: { lower: 80, middle: 120, upper: 180 } },
  spinach: { name: 'Spinach / palak', packSize: '1 bunch', qtyPerItem: '1 bowl cooked', unitPrice: { lower: 20, middle: 30, upper: 45 } },
  palak: { name: 'Spinach / palak', packSize: '1 bunch', qtyPerItem: '1 bowl cooked', unitPrice: { lower: 20, middle: 30, upper: 45 } },
  carrot: { name: 'Carrot', packSize: '1 kg', qtyPerItem: '½–1 carrot', unitPrice: { lower: 40, middle: 50, upper: 70 } },
  broccoli: { name: 'Broccoli', packSize: '500 g', qtyPerItem: '1 cup', unitPrice: { lower: 60, middle: 80, upper: 120 } },
  tomato: { name: 'Tomato', packSize: '1 kg', qtyPerItem: '1–2 pcs', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  cucumber: { name: 'Cucumber', packSize: '1 kg', qtyPerItem: '½–1 pcs', unitPrice: { lower: 30, middle: 40, upper: 55 } },
  onion: { name: 'Onion', packSize: '1 kg', qtyPerItem: 'as needed', unitPrice: { lower: 30, middle: 40, upper: 55 } },
  capsicum: { name: 'Capsicum / bell pepper', packSize: '500 g', qtyPerItem: '½ pepper', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  pepper: { name: 'Capsicum / bell pepper', packSize: '500 g', qtyPerItem: '½ pepper', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  mushroom: { name: 'Mushroom', packSize: '200 g', qtyPerItem: '100 g', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  'sweet potato': { name: 'Sweet potato', packSize: '1 kg', qtyPerItem: '1 medium', unitPrice: { lower: 40, middle: 50, upper: 70 } },
  shakarkandi: { name: 'Sweet potato', packSize: '1 kg', qtyPerItem: '1 medium', unitPrice: { lower: 40, middle: 50, upper: 70 } },
  lemon: { name: 'Lemon / nimbu', packSize: '250 g', qtyPerItem: '½ lemon', unitPrice: { lower: 20, middle: 30, upper: 45 } },
  cabbage: { name: 'Cabbage', packSize: '1 pc', qtyPerItem: 'as needed', unitPrice: { lower: 25, middle: 35, upper: 50 } },
  salad: { name: 'Salad greens mix', packSize: '1 bunch', qtyPerItem: '1 bowl', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  fruit: { name: 'Seasonal mixed fruit', packSize: '1 kg', qtyPerItem: '1 bowl', unitPrice: { lower: 80, middle: 100, upper: 150 } },
  veg: { name: 'Mixed seasonal vegetables', packSize: '1 kg', qtyPerItem: '1 bowl sabzi', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  veggies: { name: 'Mixed seasonal vegetables', packSize: '1 kg', qtyPerItem: '1 bowl sabzi', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  vegetable: { name: 'Mixed seasonal vegetables', packSize: '1 kg', qtyPerItem: '1 bowl sabzi', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  sabzi: { name: 'Mixed seasonal vegetables', packSize: '1 kg', qtyPerItem: '1 bowl sabzi', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  potato: { name: 'Potato', packSize: '1 kg', qtyPerItem: '1–2 pcs', unitPrice: { lower: 25, middle: 35, upper: 50 } },
  aloo: { name: 'Potato', packSize: '1 kg', qtyPerItem: '1–2 pcs', unitPrice: { lower: 25, middle: 35, upper: 50 } },
  garlic: { name: 'Garlic', packSize: '250 g', qtyPerItem: '2–3 cloves', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  ginger: { name: 'Ginger', packSize: '250 g', qtyPerItem: '1 inch', unitPrice: { lower: 25, middle: 35, upper: 50 } },
  coriander: { name: 'Coriander / dhania', packSize: '1 bunch', qtyPerItem: 'as garnish', unitPrice: { lower: 10, middle: 15, upper: 25 } },
  dhania: { name: 'Coriander / dhania', packSize: '1 bunch', qtyPerItem: 'as garnish', unitPrice: { lower: 10, middle: 15, upper: 25 } },
  methi: { name: 'Methi / fenugreek leaves', packSize: '1 bunch', qtyPerItem: '1 bowl', unitPrice: { lower: 15, middle: 25, upper: 40 } },
  cauliflower: { name: 'Cauliflower / gobi', packSize: '1 pc', qtyPerItem: '1 cup florets', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  gobi: { name: 'Cauliflower / gobi', packSize: '1 pc', qtyPerItem: '1 cup florets', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  beans: { name: 'Green beans', packSize: '500 g', qtyPerItem: '1 cup', unitPrice: { lower: 30, middle: 40, upper: 60 } },
  peas: { name: 'Green peas', packSize: '500 g', qtyPerItem: '½ cup', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  matar: { name: 'Green peas', packSize: '500 g', qtyPerItem: '½ cup', unitPrice: { lower: 40, middle: 55, upper: 80 } },
  mango: { name: 'Mango (seasonal)', packSize: '1 kg', qtyPerItem: '1 fruit', unitPrice: { lower: 60, middle: 90, upper: 140 } },
  watermelon: { name: 'Watermelon', packSize: '1 pc', qtyPerItem: '1 bowl', unitPrice: { lower: 40, middle: 60, upper: 90 } },
  grapes: { name: 'Grapes', packSize: '500 g', qtyPerItem: '1 handful', unitPrice: { lower: 60, middle: 80, upper: 120 } },
};

function budgetTier(budget?: string): BudgetTier {
  if (budget === 'lower' || budget === 'upper') return budget;
  return 'middle';
}

function extractProduceKeys(foodName: string): string[] {
  const n = foodName.toLowerCase();
  const found: string[] = [];
  const keys = Object.keys(PRODUCE_CATALOG).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    // Avoid "veg" matching inside unrelated words; require word-ish boundary for short keys
    if (key.length <= 3) {
      const re = new RegExp(`(?:^|[^a-z])${key}(?:[^a-z]|$)`);
      if (re.test(n)) found.push(key);
    } else if (n.includes(key)) {
      found.push(key);
    }
  }
  // Deduplicate by display name
  const seen = new Set<string>();
  return found.filter((k) => {
    const name = PRODUCE_CATALOG[k].name;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function categorizeItem(name: string): BrandCategory | 'produce' | 'protein_food' {
  const n = name.toLowerCase();
  // Staples first — don't let "banana" in "oats + banana" wipe oats/PB
  if (/oat/.test(n)) return 'oats';
  if (/peanut|pintola|\bpb\b|moongphali/.test(n)) return 'peanuts';
  if (/whey|protein powder|protein shake/.test(n)) return 'protein_powder';
  if (/paneer/.test(n)) return 'paneer';
  if (/egg|omelette|anda/.test(n)) return 'eggs';
  if (/curd|dahi|yogurt/.test(n)) return 'dairy_curd';
  if (/milk/.test(n) && !/protein/.test(n)) return 'dairy_milk';
  if (/besan|chilla|cheela/.test(n)) return 'besan';
  if (/\bdal\b|lentil|moong|masoor|toor|arhar|chana dal|rajma|chole|chickpea/.test(n)) return 'dal';
  if (/soya|nutrela/.test(n)) return 'soya';
  if (/bread|toast|pav/.test(n)) return 'bread';
  if (/chicken|fish|mutton|shrimp|turkey|meat/.test(n)) return 'protein_food';
  if (/pasta|pesto|chia|honey/.test(n)) return 'general';
  if (/poha|upma|idli|dosa|khichdi|paratha|roti|chapati/.test(n)) {
    if (/roti|chapati|paratha/.test(n)) return 'atta';
    if (/idli|dosa|khichdi|poha|upma/.test(n)) return 'rice';
  }
  if (extractProduceKeys(name).length > 0) return 'produce';
  return inferBrandCategory(name);
}

/** Pull every staple category hinted by a compound dish name */
function extractStapleCategories(name: string): Array<BrandCategory | 'protein_food'> {
  const n = name.toLowerCase();
  const cats: Array<BrandCategory | 'protein_food'> = [];
  const add = (c: BrandCategory | 'protein_food') => {
    if (!cats.includes(c)) cats.push(c);
  };
  if (/oat/.test(n)) add('oats');
  if (/peanut|pintola|\bpb\b|moongphali/.test(n)) add('peanuts');
  if (/whey|protein powder|protein shake/.test(n)) add('protein_powder');
  if (/paneer/.test(n)) add('paneer');
  if (/egg|omelette|anda/.test(n)) add('eggs');
  if (/curd|dahi|yogurt/.test(n)) add('dairy_curd');
  if (/\bmilk\b/.test(n) && !/protein/.test(n)) add('dairy_milk');
  if (/besan|chilla|cheela/.test(n)) add('besan');
  if (/\bdal\b|lentil|moong(?!phali)|masoor|toor|arhar|chana dal|rajma|chole|chickpea/.test(n)) add('dal');
  if (/soya|nutrela/.test(n)) add('soya');
  if (/bread|toast|pav/.test(n)) add('bread');
  if (/atta|roti|chapati|paratha/.test(n)) add('atta');
  if (/rice|chawal|biryani|khichdi|idli|dosa|poha|upma/.test(n)) add('rice');
  if (/chicken|fish|mutton|shrimp|turkey|\bmeat\b/.test(n)) add('protein_food');
  if (/pasta|pesto/.test(n)) add('general');
  if (/chia|honey|cinnamon/.test(n)) add('spices');
  return cats;
}

function stapleDisplayName(category: BrandCategory | 'produce' | 'protein_food', sampleName: string): string {
  const map: Record<string, string> = {
    atta: 'Atta / flour',
    rice: 'Rice',
    oil: 'Cooking oil',
    dairy_milk: 'Milk',
    dairy_curd: 'Curd / dahi',
    paneer: 'Paneer',
    bread: 'Bread',
    oats: 'Oats',
    peanuts: 'Peanut butter / peanuts',
    eggs: 'Eggs',
    protein_powder: 'Protein powder',
    besan: 'Besan',
    dal: 'Dal / lentils',
    spices: 'Spices / masala',
    soya: 'Soya chunks',
    protein_food: 'Chicken / fish',
    general: sampleName,
    mess: sampleName,
    produce: sampleName,
  };
  return map[category] || sampleName;
}

type CountRow = {
  category: BrandCategory | 'produce' | 'protein_food';
  sample: string;
  brand: string;
  servings: number;
  isNamedProduce?: boolean;
  produceKey?: string;
};

function bump(counts: Map<string, CountRow>, key: string, row: Omit<CountRow, 'servings'> & { servings?: number }) {
  const existing = counts.get(key);
  if (existing) existing.servings += row.servings || 1;
  else counts.set(key, { ...row, servings: row.servings || 1 });
}

/**
 * Build weekly + monthly grocery lists from a generated diet plan.
 * Produce is listed as separate vegetables/fruits — not one blob row.
 */
export function buildGroceryList(
  plan: DietPlanData,
  opts?: { budget?: string; livesInHostel?: boolean }
): GroceryList {
  const tier = budgetTier(opts?.budget);
  const counts = new Map<string, CountRow>();

  for (const day of WEEKDAYS) {
    const dayPlan = plan.weeklyPlan?.[day];
    if (!dayPlan?.meals) continue;
    for (const meal of dayPlan.meals) {
      for (const food of meal.foods || []) {
        const brand = (food.brand || '').toLowerCase();
        if (
          food.source === 'mess' ||
          brand.includes('hostel') ||
          brand.includes('mess') ||
          /available in mess/i.test(food.recipe || '')
        ) {
          continue;
        }

        const produceKeys = extractProduceKeys(food.item);
        // Also peek recipe text for staples named in ingredients (oats, milk, dal…)
        const recipeHint = `${food.item} ${food.recipe || ''} ${food.quantity || ''}`;
        const stapleCats = extractStapleCategories(recipeHint);

        if (produceKeys.length > 0) {
          for (const pk of produceKeys) {
            const meta = PRODUCE_CATALOG[pk];
            bump(counts, `produce:${meta.name}`, {
              category: 'produce',
              sample: meta.name,
              brand: MARKET.produce!.defaultBrand![tier],
              isNamedProduce: true,
              produceKey: pk,
            });
          }
        }

        if (stapleCats.length > 0) {
          for (const stapleCat of stapleCats) {
            if (stapleCat === 'general') {
              bump(counts, `dish:${food.item.toLowerCase()}`, {
                category: 'general',
                sample: food.item,
                brand:
                  food.brand && !/mess|hostel|quaker|pintola/i.test(food.brand)
                    ? food.brand
                    : pickBrand(food.item, tier).name,
              });
            } else {
              const brandPick = pickBrand(
                stapleCat === 'oats'
                  ? 'oats'
                  : stapleCat === 'peanuts'
                    ? 'peanut butter'
                    : stapleCat === 'dairy_milk'
                      ? 'milk'
                      : stapleCat === 'dal'
                        ? 'toor dal'
                        : stapleCat === 'protein_food'
                          ? 'chicken'
                          : food.item,
                tier,
                { livesInHostel: false, fromMess: false }
              ).name;
              bump(counts, stapleCat, {
                category: stapleCat,
                sample: food.item,
                brand: brandPick,
              });
            }
          }
          continue;
        }

        if (produceKeys.length > 0) continue;

        const category = categorizeItem(food.item);
        // Named dishes (pasta etc.) stay as their own weekly line
        if (category === 'general') {
          bump(counts, `dish:${food.item.toLowerCase()}`, {
            category: 'general',
            sample: food.item,
            brand: food.brand && !/mess|hostel|quaker|pintola/i.test(food.brand)
              ? food.brand
              : pickBrand(food.item, tier).name,
          });
          continue;
        }

        const brandPick = pickBrand(food.item, tier, { livesInHostel: false, fromMess: false }).name;
        bump(counts, category, {
          category,
          sample: food.item,
          brand: brandPick,
        });
        continue;
      }
    }
  }

  if (counts.size > 0) {
    if (![...counts.keys()].some((k) => k === 'oil')) {
      bump(counts, 'oil', { category: 'oil', sample: 'Cooking oil', brand: pickBrand('oil', tier).name, servings: 7 });
    }
    if (![...counts.keys()].some((k) => k === 'spices')) {
      bump(counts, 'spices', { category: 'spices', sample: 'Spices', brand: pickBrand('spices', tier).name, servings: 7 });
    }
  }

  const wantsProteinPowder =
    (plan.supplements || []).some((s) => /protein|whey/i.test(s.name)) ||
    [...counts.values()].some((c) => c.category === 'protein_powder');

  if (wantsProteinPowder && !counts.has('protein_powder')) {
    bump(counts, 'protein_powder', {
      category: 'protein_powder',
      sample: 'Whey / plant protein',
      brand: pickBrand('protein powder', tier).name,
      servings: 7,
    });
  }

  const weekly: GroceryItem[] = [];
  const monthly: GroceryItem[] = [];

  for (const [, row] of counts) {
    if (row.isNamedProduce && row.produceKey) {
      const meta = PRODUCE_CATALOG[row.produceKey];
      const packs = Math.max(1, Math.ceil(row.servings / 4));
      const unit = meta.unitPrice[tier];
      weekly.push({
        name: meta.name,
        brand: MARKET.produce!.defaultBrand![tier],
        packSize: meta.packSize,
        packQty: packs,
        qtyPerItem: meta.qtyPerItem,
        quantity: `${packs} × ${meta.packSize}`,
        unitPriceInr: unit,
        lineTotalInr: unit * packs,
        bestBuyFrom: MARKET.produce!.bestBuy[tier],
        notes: `Used in ~${row.servings} meals this week`,
        category: 'produce',
        cadence: 'weekly',
        usedInMeals: row.servings,
      });
      continue;
    }

    const info = MARKET[row.category] || MARKET.general!;
    const packs =
      row.category === 'dairy_milk'
        ? Math.max(7, Math.ceil(row.servings / 2))
        : Math.max(1, Math.ceil(row.servings / info.servingsPerPack));
    const unit = info.priceByBudget[tier];
    const item: GroceryItem = {
      name: stapleDisplayName(row.category, row.sample),
      brand: row.brand,
      packSize: info.packSize,
      packQty: packs,
      qtyPerItem: info.qtyPerItem,
      quantity: `${packs} × ${info.packSize}`,
      unitPriceInr: unit,
      lineTotalInr: unit * packs,
      bestBuyFrom: info.bestBuy[tier],
      nutritionInfo: info.nutritionByBudget?.[tier],
      notes:
        info.cadence === 'monthly'
          ? 'Full pack price — you buy once; lasts ~1 month'
          : `Used in ~${row.servings} meals this week`,
      category: row.category,
      cadence: info.cadence,
      usedInMeals: row.servings,
    };
    if (info.cadence === 'monthly') monthly.push(item);
    else weekly.push(item);
  }

  const sortFn = (a: GroceryItem, b: GroceryItem) => a.name.localeCompare(b.name);
  weekly.sort(sortFn);
  monthly.sort(sortFn);

  const weeklyTotalInr = weekly.reduce((s, i) => s + i.lineTotalInr, 0);
  const monthlyTotalInr = monthly.reduce((s, i) => s + i.lineTotalInr, 0);
  const monthlyShareChargedThisWeekInr = Math.round(monthlyTotalInr / 4);
  const estimatedWeekFoodSpendInr = weeklyTotalInr + monthlyShareChargedThisWeekInr;

  const spendBreakdown: GrocerySpendBreakdown = {
    thisWeekFreshInr: weeklyTotalInr,
    monthlyStaplesFullBuyInr: monthlyTotalInr,
    monthlyShareChargedThisWeekInr,
    estimatedWeekFoodSpendInr,
    formula: `₹${weeklyTotalInr} (this week) + ₹${monthlyShareChargedThisWeekInr} (¼ of monthly ₹${monthlyTotalInr}) = ₹${estimatedWeekFoodSpendInr}`,
    plainEnglish:
      `₹${monthlyTotalInr} is what you pay at the shop when you buy monthly staples (atta, oil, protein tub…). ` +
      `That pack lasts ~4 weeks, so only ~₹${monthlyShareChargedThisWeekInr} counts toward THIS week's food cost. ` +
      `Add the weekly fresh list (₹${weeklyTotalInr}) → estimated week spend ₹${estimatedWeekFoodSpendInr}. ` +
      `It is NOT ₹${weeklyTotalInr} + ₹${monthlyTotalInr}.`,
  };

  const notes = [
    spendBreakdown.plainEnglish,
    'Weekly tab = fresh items this week (veg, fruit, milk, eggs, paneer, chicken…).',
    'Monthly tab = staples you buy less often — oats, peanut butter, dal, atta, rice, oil, spices, protein powder.',
    'If breakfast has oats/PB and you only open Weekly, switch to Monthly — they live there.',
    'Qty / item = how much you use per meal. Pack size × Pack qty = what to put in the cart.',
  ];

  return {
    weekly,
    monthly,
    weeklyTotalInr,
    monthlyTotalInr,
    estimatedWeekFoodSpendInr,
    spendBreakdown,
    notes,
    generatedAt: new Date().toISOString(),
  };
}

export function withGroceryList(
  plan: DietPlanData,
  opts?: { budget?: string; livesInHostel?: boolean }
): DietPlanData & { groceryList: GroceryList } {
  return {
    ...plan,
    groceryList: buildGroceryList(plan, opts),
  };
}
