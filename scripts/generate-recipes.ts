/**
 * Generates 600 quality recipes across 6 categories.
 * Run: npx tsx scripts/generate-recipes.ts
 */
import fs from 'fs';
import path from 'path';

type Category = 'keto' | 'low-calorie' | 'vegetarian' | 'non-veg' | 'quick' | 'no-cook';

interface RecipeFull {
  id: string;
  title: string;
  category: Category;
  tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timeMins: number;
  difficulty: 'easy' | 'medium';
  image: string;
  summary: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tips: string;
  tasteTweaks: string[];
}

const IMAGES: Record<string, string[]> = {
  paneer: [
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80',
  ],
  chicken: [
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
  ],
  egg: [
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  ],
  salad: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  ],
  fish: [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
  ],
  yogurt: [
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
  ],
  dal: [
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  ],
  bowl: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  ],
};

type Protein = {
  key: string;
  name: string;
  p: number;
  c: number;
  f: number;
  veg: boolean;
  img: keyof typeof IMAGES;
};

const PROTEINS: Protein[] = [
  { key: 'paneer', name: 'Paneer', p: 18, c: 4, f: 20, veg: true, img: 'paneer' },
  { key: 'chicken', name: 'Chicken breast', p: 31, c: 0, f: 4, veg: false, img: 'chicken' },
  { key: 'eggs', name: 'Eggs', p: 13, c: 1, f: 11, veg: false, img: 'egg' },
  { key: 'tofu', name: 'Tofu', p: 12, c: 3, f: 8, veg: true, img: 'bowl' },
  { key: 'moong', name: 'Moong dal', p: 12, c: 20, f: 1, veg: true, img: 'dal' },
  { key: 'soya', name: 'Soya chunks', p: 26, c: 15, f: 1, veg: true, img: 'bowl' },
  { key: 'yogurt', name: 'Greek yogurt', p: 17, c: 6, f: 4, veg: true, img: 'yogurt' },
  { key: 'fish', name: 'Fish fillet', p: 20, c: 0, f: 5, veg: false, img: 'fish' },
  { key: 'chana', name: 'Chickpeas', p: 9, c: 27, f: 3, veg: true, img: 'salad' },
  { key: 'shrimp', name: 'Shrimp', p: 24, c: 0, f: 1, veg: false, img: 'fish' },
  { key: 'cottage', name: 'Low-fat cottage cheese', p: 22, c: 4, f: 2, veg: true, img: 'yogurt' },
  { key: 'turkey', name: 'Turkey mince', p: 27, c: 0, f: 7, veg: false, img: 'chicken' },
];

const METHODS = [
  { id: 'tawa', label: 'tawa sauté', cook: true },
  { id: 'grill', label: 'grill', cook: true },
  { id: 'bake', label: 'oven bake', cook: true },
  { id: 'steam', label: 'steam', cook: true },
  { id: 'bowl', label: 'protein bowl', cook: true },
  { id: 'curry', label: 'light curry', cook: true },
  { id: 'salad', label: 'chopped salad', cook: false },
  { id: 'wrap', label: 'wrap / roll', cook: false },
  { id: 'shake', label: 'blend bowl', cook: false },
  { id: 'plate', label: 'assembled plate', cook: false },
];

const SIDES = [
  'cucumber + onion',
  'spinach',
  'broccoli florets',
  'bell peppers',
  'zucchini',
  'mushroom',
  'tomato + coriander',
  'cabbage slaw',
  'mixed greens',
  'carrot ribbons',
];

const SPICES = [
  'jeera-dhania',
  'lemon-pepper',
  'tandoori',
  'garlic-herb',
  'chaat masala',
  'ginger-garlic',
  'smoky paprika',
  'curry leaf temper',
  'oregano-chili',
  'kasuri methi',
];

const CATEGORIES: Category[] = ['keto', 'low-calorie', 'vegetarian', 'non-veg', 'quick', 'no-cook'];

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function pickImage(protein: Protein, i: number) {
  const arr = IMAGES[protein.img] || IMAGES.bowl;
  return arr[i % arr.length];
}

function macros(cat: Category, base: Protein) {
  let protein = base.p;
  let carbs = base.c + 6;
  let fats = base.f + 2;
  if (cat === 'keto') {
    carbs = Math.min(8, Math.round(base.c + 1));
    fats = Math.round(base.f + 10);
    protein = Math.round(base.p + 2);
  } else if (cat === 'low-calorie') {
    fats = Math.max(2, Math.round(base.f * 0.35));
    carbs = Math.round(base.c + 4);
    protein = Math.round(base.p + 4);
  } else if (cat === 'no-cook') {
    fats = Math.round(base.f + 3);
    carbs = Math.round(base.c + 8);
  } else if (cat === 'quick') {
    protein = Math.round(base.p + 3);
  } else if (cat === 'non-veg') {
    protein = Math.round(base.p + 6);
  } else {
    protein = Math.round(base.p + 4);
    carbs = Math.round(base.c + 10);
  }
  return {
    calories: Math.round(protein * 4 + carbs * 4 + fats * 9),
    protein,
    carbs,
    fats,
  };
}

function tasteTweaks(cat: Category, spice: string): string[] {
  return [
    `Want more flavour? Finish with lemon and a pinch of ${spice}.`,
    'If you like spicy: add ½ green chilli or red chilli flakes while cooking.',
    'If you do NOT like spicy: skip chilli; use black pepper + lemon only.',
    cat === 'keto'
      ? 'Optional richness: 1 tsp ghee or 15g cheese — skip if cutting calories.'
      : 'Optional boost: 1 tsp hung curd or a few roasted peanuts for crunch.',
    'Meal-prep: keep spice temper / dressing separate; mix just before eating.',
  ];
}

function ingredients(protein: string, side: string, spice: string, cat: Category, noCook: boolean) {
  const list = [
    `${protein} — 120–150g`,
    `${side} — 1 heaped cup, chopped`,
    `Seasoning: ${spice}, salt`,
    'Lemon — ½ wedge',
  ];
  if (noCook) {
    list.push('Optional: 2 tbsp hung curd for binding');
    list.push('Fresh coriander or mint — handful');
  } else if (cat === 'keto') {
    list.push('Oil/ghee — 1 tsp');
  } else if (cat === 'low-calorie') {
    list.push('Oil spray or ½ tsp oil only');
  } else {
    list.push('Cooking oil — 1 tsp');
  }
  return list;
}

function steps(
  methodLabel: string,
  protein: string,
  side: string,
  spice: string,
  cat: Category,
  noCook: boolean
) {
  if (noCook) {
    return [
      `Wash hands. Chop ${side} into bite-size pieces.`,
      `Prepare ${protein} (drain paneer/tofu, open yogurt/cottage, or use leftover cooked protein).`,
      `Mix protein + veggies in a bowl. Add ${spice} and salt.`,
      'Squeeze lemon and toss gently until coated.',
      cat === 'keto'
        ? 'Serve as-is. Do not add bread, rice, or sweet sauces.'
        : 'Taste and adjust salt/lemon. Eat soon for best crunch.',
      'Store leftovers airtight up to 12 hours (keep lemon separate if possible).',
    ];
  }
  return [
    `Prep: Pat ${protein} dry. Chop ${side}. Mix ${spice} with a pinch of salt.`,
    'Heat pan on medium. Add the listed oil.',
    `Cook ${protein} (${methodLabel}) until done — about 5–8 mins.`,
    `Add ${side}. Toss 2–3 mins so veggies stay bright.`,
    `Off heat, add lemon. ${
      cat === 'keto' ? 'Skip rice/roti.' : 'Optional: 1 phulka or ½ cup rice if it fits your day.'
    }`,
    'Plate and eat within 20–30 mins. Reheat leftovers only once.',
  ];
}

function tips(cat: Category) {
  const map: Record<Category, string> = {
    keto: 'Keep net carbs low — avoid sugary sauces and large fruit sides with this plate.',
    'low-calorie': 'Measure oil. Add extra cucumber for volume without many calories.',
    vegetarian: 'Rotate paneer/dal/soya across the day for complete amino acids.',
    'non-veg': 'Cook poultry/fish fully. Rest meat 2 mins before slicing.',
    quick: 'Keep frozen chicken/paneer/soya ready for sub-20-minute nights.',
    'no-cook': 'Use leftover grilled protein from yesterday to build this even faster.',
  };
  return map[cat];
}

const recipes: RecipeFull[] = [];
const PER = 100;

for (const cat of CATEGORIES) {
  let pool = PROTEINS;
  if (cat === 'vegetarian' || cat === 'no-cook') {
    pool = PROTEINS.filter((p) => p.veg);
  }
  if (cat === 'non-veg') pool = PROTEINS.filter((p) => !p.veg);
  if (cat === 'keto') pool = PROTEINS.filter((p) => p.c <= 15);

  for (let i = 0; i < PER; i++) {
    const protein = pool[i % pool.length];
    const methodPool =
      cat === 'no-cook' ? METHODS.filter((m) => !m.cook) : cat === 'quick' ? METHODS.filter((m) => m.cook) : METHODS;
    const method = methodPool[i % methodPool.length];
    const side = SIDES[(i * 3) % SIDES.length];
    const spice = SPICES[(i * 5) % SPICES.length];
    const m = macros(cat, protein);
    const noCook = !method.cook || cat === 'no-cook';
    const title =
      cat === 'no-cook'
        ? `No-cook ${protein.name} ${method.label}`
        : `${protein.name} ${method.label} with ${side.split(' + ')[0]}`;

    recipes.push({
      id: `${cat}-${i}-${slug(protein.key)}-${method.id}`,
      title,
      category: cat,
      tags: [cat, protein.veg ? 'veg' : 'non-veg', method.id],
      ...m,
      timeMins: noCook ? 8 + (i % 7) : cat === 'quick' ? 12 + (i % 8) : 18 + (i % 15),
      difficulty: 'easy',
      image: pickImage(protein, i),
      summary: `${cat.replace('-', ' ')} · ${m.protein}g protein · ${m.calories} kcal`,
      servings: 1,
      ingredients: ingredients(protein.name, side, spice, cat, noCook),
      steps: steps(method.label, protein.name, side, spice, cat, noCook),
      tips: tips(cat),
      tasteTweaks: tasteTweaks(cat, spice),
    });
  }
}

const outDir = path.join(process.cwd(), 'src', 'data', 'recipes');
fs.mkdirSync(outDir, { recursive: true });

for (const cat of CATEGORIES) {
  const subset = recipes.filter((r) => r.category === cat);
  const list = subset.map(({ ingredients, steps, tips, tasteTweaks, ...card }) => card);
  const full: Record<string, RecipeFull> = {};
  for (const r of subset) full[r.id] = r;
  fs.writeFileSync(path.join(outDir, `${cat}-list.json`), JSON.stringify(list));
  fs.writeFileSync(path.join(outDir, `${cat}-full.json`), JSON.stringify(full));
}

fs.writeFileSync(
  path.join(outDir, 'meta.json'),
  JSON.stringify({
    total: recipes.length,
    categories: CATEGORIES.map((c) => ({
      id: c,
      count: recipes.filter((r) => r.category === c).length,
      label: c.replace('-', ' '),
    })),
  })
);

const index: Record<string, Category> = {};
for (const r of recipes) index[r.id] = r.category;
fs.writeFileSync(path.join(outDir, 'id-index.json'), JSON.stringify(index));

console.log(`Wrote ${recipes.length}`);
console.log(CATEGORIES.map((c) => `${c}:${recipes.filter((r) => r.category === c).length}`).join(', '));
