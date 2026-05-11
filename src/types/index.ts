export type Unit = 'g' | 'ml' | 'un';

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
}

export interface Purchase {
  id: string;
  ingredientId: string;
  date: string;
  price: number;
  packageQuantity: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  yields: number;
  ingredients: RecipeIngredient[];
}

export type TortaType = string;

export interface TortaProduct {
  id: string;
  name: string;
  recipeIds: string[];
  color: string;
}

export interface Sale {
  id: string;
  date: string;
  tortaType: string;
  quantity: number;
  salePrice: number;
  costPerUnit: number;
}

export interface Settings {
  salePrices: Record<string, number>;
}

export interface AppData {
  ingredients: Ingredient[];
  recipes: Recipe[];
  products: TortaProduct[];
  purchases: Purchase[];
  sales: Sale[];
  settings: Settings;
}
