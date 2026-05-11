import { useLocalStorage } from './useLocalStorage';
import {
  INITIAL_INGREDIENTS,
  INITIAL_PURCHASES,
  INITIAL_RECIPES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  DATA_VERSION,
} from '../data/initialData';
import type { Ingredient, Purchase, Recipe, TortaProduct, Sale, Settings } from '../types';

const STORAGE_KEYS = [
  'vkt_ingredients', 'vkt_recipes', 'vkt_products',
  'vkt_purchases', 'vkt_sales', 'vkt_settings',
];

function migrateIfNeeded() {
  const stored = localStorage.getItem('vkt_version');
  if (stored !== DATA_VERSION) {
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('vkt_version', DATA_VERSION);
  }
}

migrateIfNeeded();

export function useAppData() {
  const [ingredients, setIngredients] = useLocalStorage<Ingredient[]>(
    'vkt_ingredients', INITIAL_INGREDIENTS
  );
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>(
    'vkt_recipes', INITIAL_RECIPES
  );
  const [products, setProducts] = useLocalStorage<TortaProduct[]>(
    'vkt_products', INITIAL_PRODUCTS
  );
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>(
    'vkt_purchases', INITIAL_PURCHASES
  );
  const [sales, setSales] = useLocalStorage<Sale[]>('vkt_sales', []);
  const [settings, setSettings] = useLocalStorage<Settings>(
    'vkt_settings', INITIAL_SETTINGS
  );

  function addPurchase(purchase: Purchase) {
    setPurchases((prev) => [...prev, purchase]);
  }

  function addSale(sale: Sale) {
    setSales((prev) => [...prev, sale]);
  }

  function deleteSale(id: string) {
    setSales((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSettings(next: Settings) {
    setSettings(next);
  }

  function updateRecipeIngredientAmount(recipeId: string, ingredientId: string, amount: number) {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? { ...r, ingredients: r.ingredients.map((ri) => ri.ingredientId === ingredientId ? { ...ri, amount } : ri) }
          : r
      )
    );
  }

  function addIngredientToRecipe(recipeId: string, ingredientId: string, amount: number) {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? { ...r, ingredients: [...r.ingredients, { ingredientId, amount }] }
          : r
      )
    );
  }

  function removeIngredientFromRecipe(recipeId: string, ingredientId: string) {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? { ...r, ingredients: r.ingredients.filter((ri) => ri.ingredientId !== ingredientId) }
          : r
      )
    );
  }

  function addRecipe(recipe: Recipe) {
    setRecipes((prev) => [...prev, recipe]);
  }

  function deleteRecipe(id: string) {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setProducts((prev) =>
      prev.map((p) => ({ ...p, recipeIds: p.recipeIds.filter((rid) => rid !== id) }))
    );
  }

  function renameRecipe(id: string, name: string) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  }

  function updateRecipeYields(id: string, yields: number) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, yields } : r)));
  }

  function addProduct(product: TortaProduct) {
    setProducts((prev) => [...prev, product]);
    setSettings((prev) => ({
      ...prev,
      salePrices: { ...prev.salePrices, [product.id]: 0 },
    }));
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSettings((prev) => {
      const { [id]: _, ...rest } = prev.salePrices;
      return { ...prev, salePrices: rest };
    });
  }

  function updateProductName(id: string, name: string) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  function updateProductColor(id: string, color: string) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
  }

  function updateProductRecipes(id: string, recipeIds: string[]) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, recipeIds } : p)));
  }

  return {
    ingredients,
    setIngredients,
    recipes,
    products,
    purchases,
    sales,
    settings,
    addPurchase,
    addSale,
    deleteSale,
    updateSettings,
    updateRecipeIngredientAmount,
    addIngredientToRecipe,
    removeIngredientFromRecipe,
    addRecipe,
    deleteRecipe,
    renameRecipe,
    updateRecipeYields,
    addProduct,
    deleteProduct,
    updateProductName,
    updateProductColor,
    updateProductRecipes,
  };
}
