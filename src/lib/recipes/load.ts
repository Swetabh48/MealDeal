import fs from 'fs';
import path from 'path';

export type RecipeCategory =
  | 'keto'
  | 'low-calorie'
  | 'vegetarian'
  | 'non-veg'
  | 'quick'
  | 'no-cook';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'recipes');

const listCache = new Map<string, any[]>();
const fullCache = new Map<string, Record<string, any>>();
let metaCache: any = null;
let indexCache: Record<string, RecipeCategory> | null = null;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as T;
}

export function getRecipeMeta() {
  if (!metaCache) metaCache = readJson('meta.json');
  return metaCache;
}

export function getRecipeList(category: RecipeCategory) {
  if (!listCache.has(category)) {
    listCache.set(category, readJson(`${category}-list.json`));
  }
  return listCache.get(category)!;
}

export function getRecipeById(id: string) {
  if (!indexCache) indexCache = readJson('id-index.json');
  const category = indexCache![id];
  if (!category) return null;
  if (!fullCache.has(category)) {
    fullCache.set(category, readJson(`${category}-full.json`));
  }
  return fullCache.get(category)![id] || null;
}
