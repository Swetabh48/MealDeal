import { NextRequest, NextResponse } from 'next/server';
import { getRecipeList, getRecipeMeta, type RecipeCategory } from '@/lib/recipes/load';

export const dynamic = 'force-dynamic';

const VALID: RecipeCategory[] = [
  'keto',
  'low-calorie',
  'vegetarian',
  'non-veg',
  'quick',
  'no-cook',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const metaOnly = searchParams.get('meta') === '1';
  const meta = getRecipeMeta();

  if (metaOnly) {
    return NextResponse.json(meta);
  }

  const category = searchParams.get('category') as RecipeCategory | null;
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(48, Math.max(12, Number(searchParams.get('limit') || 24)));

  if (!category || !VALID.includes(category)) {
    return NextResponse.json(
      { error: 'Pick a category', categories: VALID, ...meta },
      { status: 400 }
    );
  }

  let items = [...getRecipeList(category)];
  if (q) {
    items = items.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.tags?.some((t: string) => t.includes(q))
    );
  }

  const total = items.length;
  const start = (page - 1) * limit;

  return NextResponse.json({
    recipes: items.slice(start, start + limit),
    total,
    page,
    limit,
    category,
    counts: Object.fromEntries(meta.categories.map((c: any) => [c.id, c.count])),
    categories: VALID,
  });
}
