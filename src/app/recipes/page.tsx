'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Clock,
  Flame,
  Search,
  Loader2,
  ChefHat,
  Leaf,
  Drumstick,
  Zap,
  Snowflake,
  Salad,
  CalendarPlus,
} from 'lucide-react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { toast } from 'sonner';

type RecipeCard = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timeMins: number;
  difficulty: string;
  image: string;
  summary: string;
};

type RecipeFull = RecipeCard & {
  servings: number;
  ingredients: string[];
  steps: string[];
  tips: string;
  tasteTweaks: string[];
};

const CATEGORY_CARDS = [
  {
    id: 'keto',
    label: 'Keto',
    desc: 'Low carb, higher fat plates',
    icon: Flame,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'low-calorie',
    label: 'Low calorie',
    desc: 'Light meals for a deficit',
    icon: Salad,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    desc: 'Paneer, dal, soya & more',
    icon: Leaf,
    gradient: 'from-green-500 to-lime-600',
  },
  {
    id: 'non-veg',
    label: 'Non-veg',
    desc: 'Chicken, eggs, fish, shrimp',
    icon: Drumstick,
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'quick',
    label: 'Quick',
    desc: 'Done in about 20 minutes',
    icon: Zap,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'no-cook',
    label: 'No cook',
    desc: 'Assemble — no stove needed',
    icon: Snowflake,
    gradient: 'from-cyan-500 to-sky-600',
  },
];

export default function RecipesPage() {
  const [view, setView] = useState<'hub' | 'list'>('hub');
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [recipes, setRecipes] = useState<RecipeCard[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [detail, setDetail] = useState<RecipeFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pickSlot, setPickSlot] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const cached = cacheGet<{ categories?: { id: string; count: number }[] }>('yelediet:recipes:meta');
    if (cached?.categories) {
      const map: Record<string, number> = {};
      cached.categories.forEach((c) => {
        map[c.id] = c.count;
      });
      setCounts(map);
      setMetaLoading(false);
    }

    fetch('/api/recipes?meta=1')
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, number> = {};
        data.categories?.forEach((c: any) => {
          map[c.id] = c.count;
        });
        setCounts(map);
        cacheSet('yelediet:recipes:meta', data, 60 * 60 * 1000);
      })
      .finally(() => setMetaLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (view !== 'list' || !category) return;
    let cancelled = false;
    const cacheKey = `yelediet:recipes:list:${category}:${page}:${search}`;
    const cached = cacheGet<{ recipes: RecipeCard[]; total: number }>(cacheKey);
    if (cached) {
      setRecipes(cached.recipes || []);
      setTotal(cached.total || 0);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const params = new URLSearchParams({
      category,
      page: String(page),
      limit: '24',
    });
    if (search) params.set('q', search);
    fetch(`/api/recipes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRecipes(data.recipes || []);
        setTotal(data.total || 0);
        cacheSet(cacheKey, { recipes: data.recipes || [], total: data.total || 0 }, 30 * 60 * 1000);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, category, page, search]);

  const openCategory = (id: string) => {
    setCategory(id);
    setPage(1);
    setQ('');
    setSearch('');
    setView('list');
  };

  const openRecipe = (id: string) => {
    setDetailLoading(true);
    const cacheKey = `yelediet:recipes:detail:${id}`;
    const cached = cacheGet<RecipeFull>(cacheKey);
    if (cached) {
      setDetail(cached);
      setDetailLoading(false);
      return;
    }
    setDetail(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.recipe) {
          cacheSet(cacheKey, data.recipe, 60 * 60 * 1000);
        }
        setDetail(data.recipe || null);
      } finally {
        setDetailLoading(false);
      }
    });
  };

  const addToToday = async (
    recipe: RecipeFull,
    slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => {
    setAdding(true);
    try {
      const res = await fetch('/api/meals/add-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fats: recipe.fats,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          slot,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add recipe');
      try {
        localStorage.removeItem('yelediet:dietPlan');
      } catch {
        /* ignore */
      }
      const label = slot.charAt(0).toUpperCase() + slot.slice(1);
      toast.success(`Replaced today’s ${label} with ${recipe.title}`);
      setPickSlot(false);
      setDetail(null);
    } catch (e: any) {
      toast.error(e.message || 'Could not add recipe');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {view === 'list' ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 shrink-0"
                onClick={() => {
                  setView('hub');
                  setCategory(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" /> Categories
              </Button>
            ) : (
              <a href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1 shrink-0">
                  <ArrowLeft className="h-4 w-4" /> Dashboard
                </Button>
              </a>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500 shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-rose-500 bg-clip-text text-transparent truncate">
                {view === 'list' && category
                  ? CATEGORY_CARDS.find((c) => c.id === category)?.label || 'Recipes'
                  : 'Recipes'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8">
        {view === 'hub' && (
          <>
            <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-900 p-6 sm:p-8 text-white shadow-xl">
              <h2 className="text-xl sm:text-3xl font-bold">Pick a style</h2>
              <p className="mt-2 text-sm sm:text-base text-purple-100 max-w-xl">
                Tap a category to browse recipes. Open any dish for full ingredients, steps, and taste
                tweaks.
              </p>
            </div>

            {metaLoading ? (
              <div className="flex justify-center py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {CATEGORY_CARDS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      onClick={() => openCategory(c.id)}
                      className="group text-left rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition overflow-hidden"
                    >
                      <div className={`bg-gradient-to-r ${c.gradient} p-5 sm:p-6 text-white`}>
                        <Icon className="h-8 w-8 mb-3 opacity-95" />
                        <h3 className="text-xl font-bold">{c.label}</h3>
                        <p className="text-sm text-white/90 mt-1">{c.desc}</p>
                      </div>
                      <div className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                        <span>{counts[c.id] || 100} recipes</span>
                        <span className="text-blue-600 group-hover:underline">Open →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === 'list' && category && (
          <>
            <div className="mb-4 sm:mb-6 relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={`Search ${category} recipes`}
                className="bg-white dark:bg-gray-900 pl-9"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recipes…
              </div>
            ) : recipes.length === 0 ? (
              <p className="text-center text-gray-500 py-16">No recipes match that search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openRecipe(r.id)}
                    className="group overflow-hidden rounded-2xl bg-white dark:bg-gray-900 text-left shadow-lg border border-gray-100 dark:border-gray-800 transition hover:-translate-y-0.5"
                  >
                    <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gray-100">
                      <Image
                        src={r.image}
                        alt={r.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                      <Badge className="absolute left-3 top-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                        {r.category}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{r.summary}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-orange-500" /> {r.calories} kcal
                        </span>
                        <span>{r.protein}g protein</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {r.timeMins}m
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-gray-500">
                Page {page} · {total}
              </span>
              <Button
                variant="outline"
                disabled={page * 24 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </main>

      <Dialog
        open={!!detail || detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setDetailLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
          {detailLoading || pending || !detail ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading full recipe…
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl pr-6">{detail.title}</DialogTitle>
              </DialogHeader>
              <div className="relative mb-4 h-44 sm:h-52 w-full overflow-hidden rounded-xl bg-gray-100">
                <Image src={detail.image} alt={detail.title} fill className="object-cover" />
              </div>
              <div className="mb-4 flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">{detail.calories} kcal</Badge>
                <Badge variant="secondary">P {detail.protein}g</Badge>
                <Badge variant="secondary">C {detail.carbs}g</Badge>
                <Badge variant="secondary">F {detail.fats}g</Badge>
                <Badge variant="secondary">{detail.timeMins} min</Badge>
              </div>

              <div className="mb-5">
                <h4 className="mb-2 font-semibold flex items-center gap-2">
                  <ChefHat className="h-4 w-4" /> Ingredients
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                  {detail.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-5">
                <h4 className="mb-2 font-semibold">Method</h4>
                <ol className="space-y-3">
                  {detail.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4">
                <h4 className="font-semibold text-amber-950 dark:text-amber-100 mb-2">Taste tweaks</h4>
                <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                  {(detail.tasteTweaks || []).map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>

              <p className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-4 text-sm text-blue-900 dark:text-blue-100">
                {detail.tips}
              </p>

              <Button
                className="mt-4 w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                disabled={adding}
                onClick={() => {
                  setSelectedSlot('lunch');
                  setPickSlot(true);
                }}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add to today&apos;s plan
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pickSlot} onOpenChange={setPickSlot}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Replace which meal?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This swaps that meal on today&apos;s plan with{' '}
            <span className="font-medium text-gray-900">{detail?.title}</span>.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSlot(s)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium capitalize transition ${
                  selectedSlot === s
                    ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPickSlot(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
              disabled={!detail || adding}
              onClick={() => detail && void addToToday(detail, selectedSlot)}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Replace {selectedSlot}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
