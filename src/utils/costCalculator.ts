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

export function calcRecipeCost(recipe: Recipe, purchases: Purchase[]): number {
  return recipe.ingredients.reduce((sum, ri) => sum + calcIngredientCost(ri, purchases), 0);
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
