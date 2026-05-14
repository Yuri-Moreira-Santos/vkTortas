import type { Ingredient, Purchase, Recipe, RecipeIngredient, TortaProduct } from '../types';

export function getLastPurchase(ingredientId: string, purchases: Purchase[]): Purchase | undefined {
  return purchases
    .filter((p) => p.ingredientId === ingredientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function calcIngredientCost(
  ri: RecipeIngredient,
  purchases: Purchase[]
): number {
  const last = getLastPurchase(ri.ingredientId, purchases);
  if (!last || last.packageQuantity === 0) return 0;
  return (last.price / last.packageQuantity) * ri.amount;
}

export function calcIngredientCostPerTorta(
  ri: RecipeIngredient,
  purchases: Purchase[],
  yields: number
): number {
  return calcIngredientCost(ri, purchases) / (yields || 1);
}

export function calcRecipeCost(recipe: Recipe, purchases: Purchase[]): number {
  const total = recipe.ingredients.reduce((sum, ri) => sum + calcIngredientCost(ri, purchases), 0);
  return total / (recipe.yields ?? 1);
}

export function calcTortaCost(
  product: TortaProduct,
  recipes: Recipe[],
  purchases: Purchase[]
): number {
  return product.recipeIds.reduce((sum, rid) => {
    const recipe = recipes.find((r) => r.id === rid);
    return recipe ? sum + calcRecipeCost(recipe, purchases) : sum;
  }, 0);
}

export function calcProfit(
  product: TortaProduct,
  recipes: Recipe[],
  purchases: Purchase[],
  salePrice: number
): number {
  return salePrice - calcTortaCost(product, recipes, purchases);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month, 10) - 1]}/${year?.slice(2)}`;
}

export function getIngredientUnitLabel(ingredient: Ingredient): string {
  const map: Record<string, string> = { g: 'g', ml: 'ml', un: 'un' };
  return map[ingredient.unit] ?? ingredient.unit;
}

export function calcDueDate(saleDate: string): string {
  const [y, m, d] = saleDate.split('-').map(Number);
  if (d < 5) {
    return `${y}-${String(m).padStart(2, '0')}-05`;
  } else if (d < 20) {
    return `${y}-${String(m).padStart(2, '0')}-20`;
  } else {
    const next = new Date(y, m, 5);
    return next.toISOString().slice(0, 10);
  }
}

export function getUpcomingDueDates(): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 3; i++) {
    const t = new Date(today.getFullYear(), today.getMonth() + Math.floor(i / 2), i % 2 === 0 ? 5 : 20);
    dates.push(t.toISOString().slice(0, 10));
  }
  const result: string[] = [];
  const y = today.getFullYear();
  const m = today.getMonth();
  const candidates = [
    `${y}-${String(m + 1).padStart(2, '0')}-05`,
    `${y}-${String(m + 1).padStart(2, '0')}-20`,
    new Date(y, m + 1, 5).toISOString().slice(0, 10),
    new Date(y, m + 1, 20).toISOString().slice(0, 10),
  ];
  const todayStr = today.toISOString().slice(0, 10);
  candidates.forEach((d) => { if (d >= todayStr) result.push(d); });
  return [...new Set(result)].sort().slice(0, 3);
}
