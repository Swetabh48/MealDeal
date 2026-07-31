export interface FoodDbEntry {
  id: string;
  name: string;
  aliases: string[];
  /** Macros per serving */
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  costInr: number;
  tags: Array<
    | 'veg'
    | 'vegan'
    | 'nonveg'
    | 'egg'
    | 'dairy'
    | 'gluten'
    | 'hostel'
    | 'mess'
    | 'supplement'
    | 'pre_workout'
    | 'post_workout'
    | 'high_protein'
    | 'low_gi'
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'snack'
  >;
  brand?: string;
  recipe: string;
  benefits: string;
  avoidIf?: string[]; // medical/dietary keywords
}

/**
 * Curated Indian / hostel-friendly food database.
 * Values approximate IFCT / common Indian portion sizes.
 */
export const FOOD_DATABASE: FoodDbEntry[] = [
  // ---- Breakfast / staples ----
  {
    id: 'poha',
    name: 'Poha',
    aliases: ['poha', 'pohe', 'flattened rice'],
    serving: '1 plate (150g)',
    calories: 250,
    protein: 5,
    carbs: 45,
    fats: 6,
    costInr: 25,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'breakfast', 'gluten'],
    brand: undefined, // resolved at plan-time
    recipe:
      '1. Rinse 1 cup poha and drain.\n2. Heat 1 tsp oil, add mustard seeds, curry leaves, onion.\n3. Add poha, turmeric, salt, peanuts.\n4. Mix gently 3–4 mins. Squeeze lemon. Serve hot.',
    benefits: 'Light carbs for morning energy; easy to digest.',
  },
  {
    id: 'idli_sambar',
    name: 'Idli with Sambar',
    aliases: ['idli', 'idly', 'sambar idli'],
    serving: '3 idlis + 1 bowl sambar',
    calories: 280,
    protein: 10,
    carbs: 48,
    fats: 4,
    costInr: 30,
    tags: ['veg', 'hostel', 'mess', 'breakfast', 'low_gi'],
    brand: undefined, // resolved at plan-time
    recipe:
      '1. Steam fermented idli batter 10–12 mins.\n2. For sambar: boil dal + veggies with sambar powder.\n3. Temper mustard, curry leaves in oil; add to sambar.\n4. Serve idlis with hot sambar.',
    benefits: 'Fermented, gut-friendly, low oil protein+carbs.',
  },
  {
    id: 'dosa',
    name: 'Dosa',
    aliases: ['dosa', 'masala dosa', 'plain dosa'],
    serving: '1 medium dosa',
    calories: 180,
    protein: 4,
    carbs: 28,
    fats: 6,
    costInr: 25,
    tags: ['veg', 'hostel', 'mess', 'breakfast'],
    brand: undefined, // resolved at plan-time
    recipe:
      '1. Spread fermented batter thinly on hot tawa.\n2. Drizzle few drops oil on edges.\n3. Cook till crisp; fold and serve with chutney.',
    benefits: 'Quick energy; pair with protein sides for balance.',
  },
  {
    id: 'upma',
    name: 'Upma',
    aliases: ['upma', 'rava upma'],
    serving: '1 plate (150g)',
    calories: 220,
    protein: 6,
    carbs: 38,
    fats: 5,
    costInr: 20,
    tags: ['veg', 'hostel', 'mess', 'breakfast', 'gluten'],
    brand: undefined, // resolved at plan-time
    recipe:
      '1. Roast rava lightly.\n2. Temper mustard, urad dal, curry leaves, veggies.\n3. Add water, salt; stir in rava. Cook till fluffy.',
    benefits: 'Filling breakfast with veggies if included.',
  },
  {
    id: 'paratha',
    name: 'Paratha',
    aliases: ['paratha', 'aloo paratha', 'plain paratha'],
    serving: '1 medium paratha',
    calories: 260,
    protein: 6,
    carbs: 35,
    fats: 11,
    costInr: 25,
    tags: ['veg', 'hostel', 'mess', 'breakfast', 'gluten'],
    brand: undefined, // resolved at plan-time
    recipe:
      '1. Knead atta dough; roll with or without stuffing.\n2. Cook on tawa with light ghee/oil both sides.\n3. Serve with curd or pickle.',
    benefits: 'Energy-dense; good for active days / weight gain.',
    avoidIf: ['celiac', 'gluten'],
  },
  {
    id: 'bread_omelette',
    name: 'Bread Omelette',
    aliases: ['bread omelette', 'omelette', 'egg omelette'],
    serving: '2 bread slices + 2 egg omelette',
    calories: 350,
    protein: 18,
    carbs: 30,
    fats: 16,
    costInr: 40,
    tags: ['egg', 'nonveg', 'hostel', 'mess', 'breakfast', 'high_protein', 'post_workout', 'gluten'],
    brand: undefined,
    recipe:
      '1. Beat 2 eggs with salt, pepper, onion, chili.\n2. Cook omelette on greased pan.\n3. Toast bread; serve omelette between or beside bread.',
    benefits: 'High protein breakfast ideal after workout.',
    avoidIf: ['vegan', 'vegetarian', 'egg allergy'],
  },
  {
    id: 'boiled_eggs',
    name: 'Boiled Eggs',
    aliases: ['boiled egg', 'egg', 'eggs'],
    serving: '2 large eggs',
    calories: 140,
    protein: 12,
    carbs: 1,
    fats: 10,
    costInr: 20,
    tags: ['egg', 'nonveg', 'hostel', 'supplement', 'high_protein', 'snack', 'post_workout', 'breakfast'],
    brand: 'Local Market',
    recipe: '1. Boil eggs 8–10 mins.\n2. Cool, peel.\n3. Sprinkle salt/pepper. Eat as snack or with meals.',
    benefits: 'Complete protein; cheap hostel staple.',
    avoidIf: ['vegan', 'vegetarian', 'egg allergy'],
  },
  {
    id: 'curd',
    name: 'Curd (Dahi)',
    aliases: ['curd', 'dahi', 'yogurt', 'yoghurt'],
    serving: '1 cup (200g)',
    calories: 120,
    protein: 7,
    carbs: 8,
    fats: 6,
    costInr: 20,
    tags: ['veg', 'dairy', 'hostel', 'mess', 'supplement', 'snack', 'lunch', 'dinner', 'low_gi'],
    brand: undefined,
    recipe: 'Serve plain chilled curd, or mix with roasted cumin powder and salt as raita.',
    benefits: 'Probiotics, protein, cooling with spicy mess meals.',
    avoidIf: ['vegan', 'lactose'],
  },
  {
    id: 'milk',
    name: 'Milk',
    aliases: ['milk', 'toned milk'],
    serving: '1 glass (250ml)',
    calories: 150,
    protein: 8,
    carbs: 12,
    fats: 8,
    costInr: 20,
    tags: ['veg', 'dairy', 'hostel', 'supplement', 'snack', 'pre_workout', 'post_workout'],
    brand: 'Amul / Local Dairy',
    recipe: 'Warm or cold. Optional: mix 1 scoop protein powder post-workout.',
    benefits: 'Calcium + protein; easy hostel supplement.',
    avoidIf: ['vegan', 'lactose'],
  },
  {
    id: 'banana',
    name: 'Banana',
    aliases: ['banana', 'kela'],
    serving: '1 medium',
    calories: 105,
    protein: 1,
    carbs: 27,
    fats: 0,
    costInr: 10,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'snack', 'pre_workout'],
    brand: 'Local Market',
    recipe: 'Eat as-is 30–45 mins before workout for quick carbs.',
    benefits: 'Potassium + fast carbs; ideal pre-workout.',
  },
  {
    id: 'apple',
    name: 'Apple',
    aliases: ['apple', 'seb'],
    serving: '1 medium',
    calories: 95,
    protein: 0,
    carbs: 25,
    fats: 0,
    costInr: 25,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'snack', 'low_gi'],
    brand: 'Local Market',
    recipe: 'Wash and eat whole. Pair with handful of peanuts for satiety.',
    benefits: 'Fiber-rich snack; helps blood sugar control.',
  },
  {
    id: 'peanuts',
    name: 'Roasted Peanuts',
    aliases: ['peanuts', 'moongphali', 'groundnuts'],
    serving: '30g (handful)',
    calories: 170,
    protein: 8,
    carbs: 5,
    fats: 14,
    costInr: 15,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'snack', 'high_protein'],
    brand: 'Local Market',
    recipe: 'Dry roast lightly or buy roasted unsalted. Store in airtight box.',
    benefits: 'Plant protein + healthy fats; cheap hostel snack.',
    avoidIf: ['nut allergy', 'peanut'],
  },
  {
    id: 'sprouts',
    name: 'Mixed Sprouts',
    aliases: ['sprouts', 'sprouted moong', 'moong sprouts'],
    serving: '1 bowl (100g)',
    calories: 120,
    protein: 10,
    carbs: 18,
    fats: 1,
    costInr: 20,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'snack', 'breakfast', 'high_protein', 'low_gi'],
    brand: 'Self / Local',
    recipe:
      '1. Soak moong overnight; sprout 1–2 days.\n2. Steam lightly or eat raw.\n3. Toss onion, tomato, lemon, salt, chaat masala.',
    benefits: 'High protein veg option for hostel students.',
  },
  // ---- Lunch / Dinner ----
  {
    id: 'roti',
    name: 'Chapati / Roti',
    aliases: ['roti', 'chapati', 'phulka', 'chappati'],
    serving: '2 medium rotis',
    calories: 180,
    protein: 6,
    carbs: 36,
    fats: 2,
    costInr: 15,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'lunch', 'dinner', 'gluten'],
    brand: undefined, // resolved at plan-time
    recipe: 'Knead atta, roll thin, cook on tawa until puffed. No or minimal oil.',
    benefits: 'Complex carbs; staple with dal/sabzi.',
    avoidIf: ['celiac', 'gluten'],
  },
  {
    id: 'rice',
    name: 'Steamed Rice',
    aliases: ['rice', 'plain rice', 'steamed rice', 'chawal'],
    serving: '1 cup cooked (150g)',
    calories: 200,
    protein: 4,
    carbs: 45,
    fats: 0,
    costInr: 15,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'lunch', 'dinner'],
    brand: undefined, // resolved at plan-time
    recipe: 'Wash rice, cook 1:2 rice:water until fluffy. Prefer half plate if weight loss.',
    benefits: 'Easy digestible carbs; pair with dal + veg for complete meal.',
  },
  {
    id: 'dal',
    name: 'Dal (Lentils)',
    aliases: ['dal', 'daal', 'sambar', 'rajma', 'chole', 'chana dal', 'moong dal', 'toor dal'],
    serving: '1 bowl (150g)',
    calories: 160,
    protein: 10,
    carbs: 22,
    fats: 3,
    costInr: 20,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'lunch', 'dinner', 'high_protein', 'low_gi'],
    brand: undefined, // resolved at plan-time
    recipe:
      '1. Pressure cook washed dal with turmeric.\n2. Temper cumin, garlic, tomato in oil.\n3. Mix, simmer 5 mins. Add coriander.',
    benefits: 'Primary plant protein in Indian mess meals.',
  },
  {
    id: 'sabzi',
    name: 'Mixed Vegetable Sabzi',
    aliases: ['sabzi', 'vegetable', 'veg curry', 'alu gobi', 'bhindi', 'mixed veg', 'paneer sabzi'],
    serving: '1 bowl (150g)',
    calories: 120,
    protein: 3,
    carbs: 14,
    fats: 6,
    costInr: 25,
    tags: ['veg', 'hostel', 'mess', 'lunch', 'dinner'],
    brand: undefined, // resolved at plan-time
    recipe: 'Sauté onions, spices, add chopped veggies, cook covered till tender. Limit oil.',
    benefits: 'Micronutrients + fiber with every meal.',
  },
  {
    id: 'paneer',
    name: 'Paneer',
    aliases: ['paneer', 'cottage cheese', 'paneer curry', 'palak paneer', 'shahi paneer'],
    serving: '100g',
    calories: 265,
    protein: 18,
    carbs: 4,
    fats: 20,
    costInr: 50,
    tags: ['veg', 'dairy', 'hostel', 'supplement', 'high_protein', 'post_workout', 'lunch', 'dinner'],
    brand: 'Amul / Local',
    recipe:
      '1. Cut paneer into cubes.\n2. Lightly pan-sear or add to curry with tomato-onion gravy.\n3. 100g portion for protein boost.',
    benefits: 'Best vegetarian high-protein add-on for hostel.',
    avoidIf: ['vegan', 'lactose'],
  },
  {
    id: 'chicken_curry',
    name: 'Chicken Curry',
    aliases: ['chicken', 'chicken curry', 'chicken masala', 'butter chicken'],
    serving: '150g chicken + gravy',
    calories: 280,
    protein: 28,
    carbs: 6,
    fats: 16,
    costInr: 80,
    tags: ['nonveg', 'hostel', 'mess', 'high_protein', 'post_workout', 'lunch', 'dinner'],
    brand: undefined,
    recipe:
      '1. Marinate chicken with yogurt, spices 20 mins.\n2. Cook onion-tomato gravy; add chicken.\n3. Simmer till tender. Prefer grilled/less oil when possible.',
    benefits: 'Lean animal protein for muscle gain / recovery.',
    avoidIf: ['vegan', 'vegetarian', 'hindu vegetarian'],
  },
  {
    id: 'egg_curry',
    name: 'Egg Curry',
    aliases: ['egg curry', 'anda curry'],
    serving: '2 eggs in curry',
    calories: 240,
    protein: 14,
    carbs: 8,
    fats: 16,
    costInr: 35,
    tags: ['egg', 'nonveg', 'hostel', 'mess', 'high_protein', 'lunch', 'dinner'],
    brand: undefined, // resolved at plan-time
    recipe: 'Boil eggs, prepare onion-tomato gravy, simmer eggs 5–8 mins.',
    benefits: 'Affordable non-veg protein when chicken unavailable.',
    avoidIf: ['vegan', 'vegetarian', 'egg allergy'],
  },
  {
    id: 'salad',
    name: 'Cucumber Tomato Salad',
    aliases: ['salad', 'cucumber', 'kheera', 'tomato salad'],
    serving: '1 bowl',
    calories: 40,
    protein: 2,
    carbs: 8,
    fats: 0,
    costInr: 15,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'lunch', 'dinner', 'snack', 'low_gi'],
    brand: undefined,
    recipe: 'Chop cucumber, tomato, onion. Add lemon, salt, black pepper.',
    benefits: 'Volume + fiber with almost no calories.',
  },
  {
    id: 'khichdi',
    name: 'Khichdi',
    aliases: ['khichdi', 'khichri'],
    serving: '1 plate (200g)',
    calories: 280,
    protein: 10,
    carbs: 48,
    fats: 5,
    costInr: 25,
    tags: ['veg', 'hostel', 'mess', 'lunch', 'dinner', 'low_gi'],
    brand: undefined, // resolved at plan-time
    recipe: 'Pressure cook rice + moong dal with turmeric, ghee, veggies. Soft and easy to digest.',
    benefits: 'Gentle on stomach; balanced single-pot meal.',
  },
  {
    id: 'biryani',
    name: 'Veg / Chicken Biryani',
    aliases: ['biryani', 'veg biryani', 'chicken biryani'],
    serving: '1 plate',
    calories: 450,
    protein: 14,
    carbs: 60,
    fats: 16,
    costInr: 60,
    tags: ['hostel', 'mess', 'lunch', 'dinner'],
    brand: undefined, // resolved at plan-time
    recipe: 'Layered rice with spices and veg/chicken. Prefer smaller portion + raita + salad.',
    benefits: 'Higher calorie day meal — useful for weight/muscle gain.',
  },
  // ---- Snacks / supplements ----
  {
    id: 'protein_powder',
    name: 'Whey / Plant Protein Shake',
    aliases: ['protein powder', 'whey', 'protein shake'],
    serving: '1 scoop with water (30g powder)',
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1,
    costInr: 40,
    tags: ['hostel', 'supplement', 'high_protein', 'post_workout', 'snack'],
    brand: undefined,
    recipe: 'Mix 1 scoop with 250–300ml water or milk. Shake well. Drink within 60 mins post-workout.',
    benefits: 'Fills protein gap when mess food is carb-heavy.',
  },
  {
    id: 'oats',
    name: 'Oats Bowl',
    aliases: ['oats', 'oatmeal', 'porridge'],
    serving: '40g dry oats cooked',
    calories: 150,
    protein: 5,
    carbs: 27,
    fats: 3,
    costInr: 20,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'breakfast', 'snack', 'pre_workout', 'low_gi', 'gluten'],
    brand: 'Quaker / Saffola',
    recipe:
      '1. Cook oats with water/milk 3–5 mins.\n2. Add banana slices or peanuts.\n3. Optional cinnamon.',
    benefits: 'Slow carbs; great pre-workout or light breakfast.',
  },
  {
    id: 'besan_chilla',
    name: 'Besan Chilla',
    aliases: ['chilla', 'besan chilla', 'cheela'],
    serving: '2 medium chillas',
    calories: 220,
    protein: 12,
    carbs: 24,
    fats: 8,
    costInr: 25,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'breakfast', 'high_protein', 'snack'],
    brand: 'Self-made',
    recipe:
      '1. Mix besan, water, spices, chopped onion/tomato into batter.\n2. Spread on nonstick pan like pancake.\n3. Cook both sides. Serve with mint chutney.',
    benefits: 'High-protein vegetarian hostel breakfast/snack.',
  },
  {
    id: 'fruit_chaat',
    name: 'Fruit Chaat',
    aliases: ['fruit chaat', 'fruits', 'cut fruits'],
    serving: '1 bowl',
    calories: 120,
    protein: 2,
    carbs: 28,
    fats: 0,
    costInr: 30,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'snack', 'supplement'],
    brand: undefined,
    recipe: 'Mix seasonal fruits, add lemon, chaat masala, rock salt.',
    benefits: 'Vitamins + hydration; light snack option.',
  },
  {
    id: 'soya_chunks',
    name: 'Soya Chunks Curry',
    aliases: ['soya', 'soya chunks', 'nutrela'],
    serving: '50g dry (rehydrated) in curry',
    calories: 170,
    protein: 26,
    carbs: 15,
    fats: 1,
    costInr: 25,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'high_protein', 'lunch', 'dinner', 'post_workout'],
    brand: 'Nutrela / Local',
    recipe:
      '1. Boil soya chunks 5 mins; squeeze water.\n2. Cook in onion-tomato gravy with spices.\n3. Excellent cheap protein for vegetarians.',
    benefits: 'Highest protein-per-rupee vegetarian option.',
  },
  // ---- Variety / micronutrients (named produce + interesting meals) ----
  {
    id: 'pesto_protein_pasta',
    name: 'Pesto Protein Pasta',
    aliases: ['pesto pasta', 'protein pasta', 'pasta pesto'],
    serving: '1 bowl (80g dry pasta + pesto + protein)',
    calories: 480,
    protein: 32,
    carbs: 52,
    fats: 16,
    costInr: 90,
    tags: ['veg', 'dairy', 'gluten', 'lunch', 'dinner', 'post_workout', 'high_protein'],
    brand: 'Barilla / Maggi Pesto + paneer/chicken',
    recipe:
      '1. Boil pasta al dente.\n2. Toss with basil pesto (or coriander-mint pesto), cherry tomatoes, spinach.\n3. Add grilled paneer cubes or shredded chicken + lemon zest.\n4. Finish with black pepper.',
    benefits: 'Breaks roti-rice boredom; carbs + protein for recovery. Spinach/tomato add vitamins A & C.',
  },
  {
    id: 'oats_pb_banana',
    name: 'Oats + Peanut Butter + Banana Bowl',
    aliases: ['oats peanut butter', 'pb oats', 'overnight oats'],
    serving: '40g oats + 1 tbsp PB + 1 banana',
    calories: 380,
    protein: 14,
    carbs: 52,
    fats: 14,
    costInr: 45,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'breakfast', 'snack', 'pre_workout'],
    brand: 'Quaker oats + Pintola / Sundrop PB',
    recipe:
      '1. Cook oats in water/milk 3–5 mins (or overnight soak).\n2. Stir in 1 tbsp natural peanut butter.\n3. Top with banana slices + cinnamon.\n4. Optional: chia seeds.',
    benefits: 'B vitamins from oats/banana, healthy fats + satiety from PB, potassium & fiber — ideal pre-workout.',
  },
  {
    id: 'peanut_butter_toast',
    name: 'Peanut Butter on Whole Wheat Toast',
    aliases: ['peanut butter toast', 'pb toast', 'peanut butter'],
    serving: '2 slices + 1.5 tbsp PB',
    calories: 320,
    protein: 12,
    carbs: 32,
    fats: 16,
    costInr: 40,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'breakfast', 'snack', 'pre_workout'],
    brand: 'Pintola / MuscleBlaze / Sundrop natural PB',
    recipe: 'Toast whole-wheat bread; spread natural peanut butter (no sugar first ingredient). Add banana or apple slices.',
    benefits: 'Plant protein + vitamin E fats; pairs well with fruit for vitamin C.',
  },
  {
    id: 'orange_guava_bowl',
    name: 'Orange + Guava Vitamin C Bowl',
    aliases: ['orange', 'guava', 'vitamin c fruit', 'citrus bowl'],
    serving: '1 orange + 1 guava (or 200g mixed)',
    calories: 140,
    protein: 3,
    carbs: 32,
    fats: 1,
    costInr: 35,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'snack', 'breakfast'],
    brand: 'Seasonal local fruit',
    recipe: 'Wash, peel orange segments; cube guava. Squeeze lemon + pinch chaat masala. Eat fresh.',
    benefits: 'Very high vitamin C (immunity, iron absorption). Rotate with amla / kiwi when in season.',
  },
  {
    id: 'carrot_spinach_salad',
    name: 'Carrot + Spinach + Lemon Salad',
    aliases: ['carrot salad', 'spinach salad', 'vitamin a salad'],
    serving: '1 large bowl',
    calories: 90,
    protein: 3,
    carbs: 14,
    fats: 3,
    costInr: 25,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'lunch', 'dinner', 'snack'],
    brand: 'Local sabzi mandi',
    recipe: 'Grate carrot, shred spinach/palak, add cucumber + tomato. Dress with lemon, black salt, olive/mustard oil drizzle.',
    benefits: 'Vitamin A (beta-carotene), folate, vitamin K, vitamin C from lemon — micronutrient side every lunch.',
  },
  {
    id: 'amla_lemon_water',
    name: 'Amla / Lemon Infused Water',
    aliases: ['amla', 'lemon water', 'nimbu pani unsweetened'],
    serving: '1 glass',
    calories: 15,
    protein: 0,
    carbs: 4,
    fats: 0,
    costInr: 10,
    tags: ['veg', 'vegan', 'hostel', 'supplement', 'snack'],
    brand: 'Fresh local',
    recipe: 'Crush ½ amla or squeeze ½ lemon into 300ml water. Optional cumin/black salt. No sugar.',
    benefits: 'Vitamin C boost; supports iron absorption with meals.',
  },
  {
    id: 'egg_veggie_omelette',
    name: 'Veggie Omelette (Onion Capsicum Tomato)',
    aliases: ['omelette', 'veg omelette', 'egg omelette'],
    serving: '2–3 eggs + veggies',
    calories: 280,
    protein: 20,
    carbs: 8,
    fats: 18,
    costInr: 45,
    tags: ['egg', 'nonveg', 'hostel', 'supplement', 'breakfast', 'post_workout', 'high_protein'],
    brand: 'Local eggs',
    recipe:
      '1. Beat eggs with salt & pepper.\n2. Sauté onion, capsicum, tomato, spinach.\n3. Pour eggs; fold. Serve with 1 toast or fruit.',
    benefits: 'Complete protein + B12; veggies add vitamins A/C. Strong post-workout option.',
  },
  {
    id: 'dal_palak_roti',
    name: 'Dal + Palak Sabzi + Roti',
    aliases: ['dal palak', 'spinach dal', 'palak sabzi'],
    serving: '2 roti + 1 katori dal + 1 bowl palak',
    calories: 420,
    protein: 18,
    carbs: 58,
    fats: 10,
    costInr: 50,
    tags: ['veg', 'vegan', 'hostel', 'mess', 'lunch', 'dinner', 'high_protein', 'low_gi'],
    brand: undefined,
    recipe: 'Cook moong/toor dal; stir-fry palak with garlic. Soft rotis. Side: cucumber + lemon.',
    benefits: 'Iron + folate from greens; plant protein from dal; vitamin A/K from spinach.',
  },
  {
    id: 'grilled_paneer_broccoli',
    name: 'Grilled Paneer with Broccoli & Bell Peppers',
    aliases: ['paneer broccoli', 'grilled paneer veggies'],
    serving: '150g paneer + 1 cup mixed veg',
    calories: 380,
    protein: 28,
    carbs: 14,
    fats: 24,
    costInr: 90,
    tags: ['veg', 'dairy', 'lunch', 'dinner', 'post_workout', 'high_protein'],
    brand: 'Amul paneer + local broccoli',
    recipe: 'Marinate paneer in spices + yogurt; grill. Steam/sauté broccoli, red & yellow capsicum. Lemon finish.',
    benefits: 'High protein + vitamin C (peppers) + vitamin K/C (broccoli) — variety beyond plain paneer bhurji.',
  },
  {
    id: 'curd_berry_mix',
    name: 'Curd with Mixed Berries / Seasonal Fruit',
    aliases: ['curd fruit', 'yogurt bowl', 'dahi fruit'],
    serving: '200g curd + 100g fruit',
    calories: 200,
    protein: 10,
    carbs: 28,
    fats: 5,
    costInr: 50,
    tags: ['veg', 'dairy', 'hostel', 'supplement', 'snack', 'breakfast', 'post_workout'],
    brand: 'Amul / Mother Dairy dahi',
    recipe: 'Thick curd + strawberries/pomegranate/apple/banana. Optional honey drizzle (skip if cutting sugar).',
    benefits: 'Calcium + probiotics; fruit adds vitamins C/A and polyphenols.',
  },
  {
    id: 'fortified_milk_glass',
    name: 'Fortified Toned Milk',
    aliases: ['milk', 'toned milk', 'amul milk'],
    serving: '250 ml',
    calories: 130,
    protein: 8,
    carbs: 12,
    fats: 5,
    costInr: 18,
    tags: ['veg', 'dairy', 'hostel', 'supplement', 'snack', 'breakfast', 'pre_workout', 'post_workout'],
    brand: 'Amul / Mother Dairy (check fat % on pack)',
    recipe: 'Warm or cold. Prefer toned (~3% fat) or double-toned (~1.5% fat) based on goal. Look for vitamin A/D fortified packs.',
    benefits: 'Protein + calcium; many Indian packs are fortified with vitamins A & D — check label.',
  },
  {
    id: 'mushroom_egg_bhurji',
    name: 'Mushroom Egg Bhurji',
    aliases: ['mushroom bhurji', 'egg mushroom'],
    serving: '2 eggs + 100g mushrooms',
    calories: 260,
    protein: 20,
    carbs: 8,
    fats: 16,
    costInr: 55,
    tags: ['egg', 'nonveg', 'breakfast', 'lunch', 'dinner', 'post_workout', 'high_protein'],
    brand: 'Local mushrooms + eggs',
    recipe: 'Sauté mushrooms with onion/tomato; scramble eggs in. Turmeric + pepper.',
    benefits: 'B vitamins + some vitamin D precursors from mushrooms (esp. sun-exposed); high protein.',
  },
  {
    id: 'sweet_potato_chaat',
    name: 'Sweet Potato Chaat',
    aliases: ['sweet potato', 'shakarkandi chaat'],
    serving: '1 medium boiled sweet potato bowl',
    calories: 180,
    protein: 3,
    carbs: 40,
    fats: 1,
    costInr: 30,
    tags: ['veg', 'vegan', 'snack', 'pre_workout', 'low_gi'],
    brand: 'Local mandi',
    recipe: 'Boil/roast sweet potato; cube; add lemon, chaat masala, onion, coriander.',
    benefits: 'Vitamin A (beta-carotene) + complex carbs — excellent pre-workout fuel.',
  },
];

export function normalizeFoodKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function findFoodEntry(name: string): FoodDbEntry | undefined {
  const key = normalizeFoodKey(name);
  if (!key) return undefined;

  // Exact alias match
  for (const food of FOOD_DATABASE) {
    if (normalizeFoodKey(food.name) === key) return food;
    if (food.aliases.some((a) => normalizeFoodKey(a) === key)) return food;
  }

  // Contains match
  for (const food of FOOD_DATABASE) {
    if (key.includes(normalizeFoodKey(food.name)) || normalizeFoodKey(food.name).includes(key)) {
      return food;
    }
    if (food.aliases.some((a) => key.includes(normalizeFoodKey(a)) || normalizeFoodKey(a).includes(key))) {
      return food;
    }
  }

  return undefined;
}

export function filterFoods(
  tags?: string[],
  restrictions: string[] = [],
  conditions: string[] = []
): FoodDbEntry[] {
  const r = restrictions.map((x) => x.toLowerCase());
  const c = conditions.map((x) => x.toLowerCase());
  const avoidKeywords = [...r, ...c];

  return FOOD_DATABASE.filter((food) => {
    if (tags?.length && !tags.some((t) => food.tags.includes(t as any))) return false;

    if (r.some((x) => x.includes('vegan')) && !food.tags.includes('vegan')) return false;
    if (r.some((x) => x.includes('vegetarian')) && (food.tags.includes('nonveg') || food.tags.includes('egg')))
      return false;
    if (r.some((x) => x.includes('eggetarian') || x.includes('eggitarian'))) {
      if (food.tags.includes('nonveg') && !food.tags.includes('egg')) return false;
    }
    if (r.some((x) => x.includes('gluten')) && food.tags.includes('gluten')) return false;
    if (r.some((x) => x.includes('dairy') || x.includes('lactose')) && food.tags.includes('dairy')) return false;

    if (food.avoidIf?.some((a) => avoidKeywords.some((k) => k.includes(a) || a.includes(k)))) return false;

    // Diabetes: prefer low_gi when possible — soft filter applied by planner, not hard here
    return true;
  });
}

export function scaleFood(food: FoodDbEntry, factor: number) {
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fats: Math.round(food.fats * factor * 10) / 10,
    estimatedCost: Math.round(food.costInr * factor),
    quantity: factor === 1 ? food.serving : `${factor} × ${food.serving}`,
  };
}
