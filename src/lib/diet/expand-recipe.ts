/**
 * Ensure every food has a full numbered recipe (ingredients + steps).
 */
export function expandRecipeIfShort(
  itemName: string,
  recipe?: string,
  quantity?: string
): string {
  const r = (recipe || '').trim();
  const lines = r.split(/\n+/).filter((l) => l.trim().length > 2);
  if (lines.length >= 5 && r.length >= 180) return r;

  const qty = quantity || '1 serving';
  return [
    `Ingredients for ${itemName} (${qty}):`,
    `• Main: ${itemName} — portion as listed (${qty})`,
    `• Seasoning: salt, turmeric/black pepper, lemon (as needed)`,
    `• Optional add-ons: onion, tomato, coriander, spices you already have`,
    ``,
    `Method:`,
    `1. Wash hands and prep all ingredients; measure the portion (${qty}).`,
    `2. If cooking: heat a pan with ½–1 tsp oil (or dry-roast if snack).`,
    `3. Cook/assemble ${itemName} until done — keep heat medium so protein does not toughen and veggies stay bright.`,
    `4. Season lightly; finish with lemon or herbs for micronutrients.`,
    `5. Plate with a protein side or salad if this meal is carb-heavy.`,
    `6. Eat within the planned meal window (especially if this is pre/post workout).`,
    ``,
    `Tips: Prefer homemade over packaged sauces; drink water with the meal.`,
  ].join('\n');
}
