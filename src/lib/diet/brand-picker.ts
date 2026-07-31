/**
 * Budget-aware grocery brand picks based on common Indian community consensus
 * (Reddit r/india, r/IndianFood, Quora grocery threads, price-comparison blogs 2024–25).
 * Prefer widely available, repeatedly recommended options — not paid placements.
 */

export type BudgetTier = 'lower' | 'middle' | 'upper';

export type BrandCategory =
  | 'atta'
  | 'rice'
  | 'oil'
  | 'dairy_milk'
  | 'dairy_curd'
  | 'paneer'
  | 'bread'
  | 'oats'
  | 'peanuts'
  | 'eggs'
  | 'protein_powder'
  | 'besan'
  | 'dal'
  | 'spices'
  | 'soya'
  | 'general'
  | 'mess';

interface BrandPick {
  name: string;
  why: string;
}

const PICKS: Record<BrandCategory, Record<BudgetTier, BrandPick>> = {
  atta: {
    lower: { name: 'Local chakki / Fortune Chakki Fresh', why: 'Often cheapest per kg; Reddit/local threads favor nearby chakki over packaged for daily rotis.' },
    middle: { name: 'Aashirvaad / Pillsbury', why: 'Most cited mass-market atta for consistency vs price in grocery roundups.' },
    upper: { name: '24 Mantra / organic chakki', why: 'Preferred when budget allows cleaner sourcing; not required for macros.' },
  },
  rice: {
    lower: { name: 'Local sona masoori / Kolam', why: 'Daily rice — local loose grain beats branded basmati on cost (common India grocery advice).' },
    middle: { name: 'India Gate Classic / Daawat Rozana', why: 'Frequently listed mid-range staples in 2025 grocery guides.' },
    upper: { name: 'India Gate / Daawat biryani grade', why: 'Reserve basmati for occasional meals; not needed every day.' },
  },
  oil: {
    lower: { name: 'Fortune / Gemini refined (limited use)', why: 'Budget cooking oil; keep portions small for health.' },
    middle: { name: 'Fortune Rice Bran / Saffola Gold', why: 'Common middle-class picks in Indian household discussions.' },
    upper: { name: 'Cold-pressed groundnut / mustard (local mill)', why: 'Quora/Reddit often prefer mill oil over fancy labels when quality is verified.' },
  },
  dairy_milk: {
    lower: {
      name: 'Amul Toned (~3% fat) / local dairy',
      why: 'Amul toned: ~3% fat, ~3.1% protein; often Vit A/D fortified. Double-toned (~1.5% fat) if cutting calories.',
    },
    middle: {
      name: 'Amul / Mother Dairy Toned (~3% fat)',
      why: 'Trusted nationwide; check pack for fat % and fortification. ~3.1–3.3% protein.',
    },
    upper: {
      name: 'Amul Gold (~6% fat) or Double Toned (~1.5% fat)',
      why: 'Upgrade/downgrade fat % intentionally — same trusted dairies, not brand hype.',
    },
  },
  dairy_curd: {
    lower: { name: 'Homemade from Amul milk', why: 'Cheapest high-quality curd — nearly universal India tip.' },
    middle: { name: 'Amul / Mother Dairy dahi', why: 'Trusted packaged option when homemade isn’t practical.' },
    upper: { name: 'Epigamia / Amul Greek-style', why: 'Higher protein cups when budget allows.' },
  },
  paneer: {
    lower: { name: 'Local dairy / Mother Dairy', why: 'Fresh local paneer often beats packaged on price; check hygiene.' },
    middle: { name: 'Amul Paneer', why: 'Default recommendation in budget fitness/veg protein threads.' },
    upper: { name: 'Amul / Milky Mist', why: 'Consistent texture; still not “premium marketing” brands.' },
  },
  bread: {
    lower: { name: 'Local bakery whole wheat', why: 'Cheaper than packaged; ask for atta bread.' },
    middle: { name: 'Britannia Whole Wheat / Modern', why: 'Easy supermarket picks commonly mentioned.' },
    upper: { name: 'The Health Factory / local sourdough', why: 'Only if you already shop specialty bread.' },
  },
  oats: {
    lower: { name: 'Local rolled oats / Yoga Bar (sale)', why: 'Loose oats or sale packs; avoid flavored sachets.' },
    middle: { name: 'Quaker / Saffola Oats', why: 'Most named mid-range oats in Indian fitness grocery lists.' },
    upper: { name: 'True Elements / Yoga Bar rolled', why: 'Cleaner ingredient lists when paying more.' },
  },
  peanuts: {
    lower: { name: 'Loose roasted / Pintola natural PB (sale)', why: 'Loose peanuts cheapest; Pintola often cited for clean PB without sugar first.' },
    middle: { name: 'Pintola / Sundrop natural peanut butter', why: 'Common mid-range natural PB picks in Indian fitness grocery threads.' },
    upper: { name: 'Happilo / Farmley unsalted or premium natural PB', why: 'Only if you want sealed quality control.' },
  },
  eggs: {
    lower: { name: 'Local farm / market eggs', why: 'Brand rarely matters; freshness does (universal advice).' },
    middle: { name: 'Local / Suguna', why: 'Any fresh eggs; Suguna if supermarket only.' },
    upper: { name: 'Cage-free local when available', why: 'Ethics/freshness upgrade, not a protein upgrade.' },
  },
  protein_powder: {
    lower: { name: 'Nakpro / MuscleBlaze (on discount)', why: 'r/Fitness_India / Indian supplement threads often cite these for ₹/g protein.' },
    middle: { name: 'MuscleBlaze / ON (deal price)', why: 'Buy on sale; ignore influencer SKUs. Check Informed-Choice when possible.' },
    upper: { name: 'Optimum Nutrition / MyProtein', why: 'Trusted labels when budget is comfortable — still buy on deals.' },
  },
  besan: {
    lower: { name: 'Local loose besan', why: 'Kirana besan is standard and cheapest.' },
    middle: { name: 'Rajdhani / Fortune Besan', why: 'Common packaged picks in grocery lists.' },
    upper: { name: 'Organic / 24 Mantra besan', why: 'Optional purity upgrade.' },
  },
  dal: {
    lower: { name: 'Kirana loose toor / moong', why: 'Loose dals are cheapest per kg for daily dal-rice.' },
    middle: { name: 'Tata Sampann / Fortune dal', why: 'Common packaged dals in Indian grocery roundups.' },
    upper: { name: 'Organic / unpolished dal', why: 'Optional purity upgrade for frequent dal eaters.' },
  },
  spices: {
    lower: { name: 'Local loose / Everest small packs', why: 'Loose masala or small packs to avoid waste.' },
    middle: { name: 'MDH / Everest', why: 'Most named household spice brands in India guides.' },
    upper: { name: 'Whole spices, fresh ground', why: 'Better flavor than premium powder brands.' },
  },
  soya: {
    lower: { name: 'Nutrela / local soya chunks', why: 'Default cheap veg protein in Indian student diets.' },
    middle: { name: 'Nutrela Soya Chunks', why: 'Widely available and repeatedly recommended for ₹/protein.' },
    upper: { name: 'Nutrela / organic soya', why: 'Same product class; branding premium rarely needed.' },
  },
  general: {
    lower: { name: 'Kirana / local market', why: 'Buy staples loose; brands add cost without changing macros.' },
    middle: { name: 'Local supermarket house brand', why: 'Balance convenience and price.' },
    upper: { name: 'Trusted national brand on sale', why: 'Pay for freshness/safety, not packaging.' },
  },
  mess: {
    lower: { name: 'Hostel Mess', why: 'Use mess portions as planned.' },
    middle: { name: 'Hostel Mess', why: 'Use mess portions as planned.' },
    upper: { name: 'Hostel Mess', why: 'Use mess portions as planned.' },
  },
};

/** Map food name → brand category */
export function inferBrandCategory(foodName: string): BrandCategory {
  const n = foodName.toLowerCase();
  if (/mess|hostel/.test(n)) return 'mess';
  if (/peanut|moongphali|pintola|peanut butter/.test(n)) return 'peanuts';
  if (/atta|roti|chapati|paratha|bread|pav/.test(n)) return /bread|pav/.test(n) ? 'bread' : 'atta';
  if (/rice|chawal|biryani|khichdi|poha|idli|dosa|upma/.test(n)) return /poha|idli|dosa|upma/.test(n) ? 'general' : 'rice';
  if (/oil|ghee/.test(n) || (/\bbutter\b/.test(n) && !/peanut/.test(n))) return 'oil';
  if (/paneer/.test(n)) return 'paneer';
  if (/curd|dahi|yogurt|yoghurt|raita/.test(n)) return 'dairy_curd';
  if (/milk|shake/.test(n) && !/protein/.test(n)) return 'dairy_milk';
  if (/oat/.test(n)) return 'oats';
  if (/egg|omelette|anda/.test(n)) return 'eggs';
  if (/whey|protein powder|protein shake/.test(n)) return 'protein_powder';
  if (/besan|chilla|cheela/.test(n)) return 'besan';
  if (/\bdal\b|lentil|moong|masoor|toor|arhar|chana dal|rajma|chole|chickpea/.test(n)) return 'dal';
  if (/soya|nutrela/.test(n)) return 'soya';
  if (/spice|masala|cinnamon|jeera|haldi/.test(n)) return 'spices';
  if (/pasta|pesto|barilla|chia|honey/.test(n)) return 'general';
  return 'general';
}

export function pickBrand(
  foodName: string,
  budget: string = 'middle',
  opts?: { livesInHostel?: boolean; fromMess?: boolean }
): BrandPick {
  if (opts?.fromMess || (opts?.livesInHostel && /mess/i.test(foodName))) {
    return PICKS.mess.middle;
  }
  const tier: BudgetTier =
    budget === 'lower' || budget === 'upper' ? budget : 'middle';
  const category = inferBrandCategory(foodName);
  return PICKS[category][tier];
}

export function brandLabel(
  foodName: string,
  budget: string = 'middle',
  opts?: { livesInHostel?: boolean; fromMess?: boolean }
): string {
  return pickBrand(foodName, budget, opts).name;
}
