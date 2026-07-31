import { NextRequest, NextResponse } from 'next/server';
import { getRecipeById } from '@/lib/recipes/load';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const recipe = getRecipeById(decodeURIComponent(id));

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  return NextResponse.json({ recipe });
}
