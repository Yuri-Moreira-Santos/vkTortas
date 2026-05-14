import type { Ingredient, Purchase, Recipe, TortaProduct, Settings } from '../types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ovo', name: 'Ovo', unit: 'un' },
  { id: 'farinha', name: 'Farinha de Trigo', unit: 'g' },
  { id: 'oleo', name: 'Óleo', unit: 'ml' },
  { id: 'leite', name: 'Leite Integral', unit: 'ml' },
  { id: 'sal', name: 'Sal', unit: 'g' },
  { id: 'queijo-parmesao', name: 'Queijo Parmesão', unit: 'g' },
  { id: 'catupiry', name: 'Catupiry', unit: 'g' },
  { id: 'fermento', name: 'Fermento Químico', unit: 'g' },
  { id: 'embalagem', name: 'Embalagem 250ml', unit: 'un' },
  { id: 'sacola', name: 'Sacola', unit: 'un' },
  { id: 'frango', name: 'Frango', unit: 'g' },
  { id: 'molho-tomate', name: 'Molho de Tomate', unit: 'g' },
  { id: 'azeitona', name: 'Azeitona', unit: 'g' },
  { id: 'cebola', name: 'Cebola', unit: 'g' },
  { id: 'alho', name: 'Alho', unit: 'un' },
  { id: 'milho', name: 'Milho', unit: 'g' },
  { id: 'paprica', name: 'Páprica Defumada', unit: 'g' },
  { id: 'sazon', name: 'Sazon', unit: 'g' },
  { id: 'tempero-pronto', name: 'Tempero Pronto', unit: 'g' },
  { id: 'pimenta-reino', name: 'Pimenta do Reino', unit: 'g' },
  { id: 'cheiro-verde', name: 'Cheiro Verde', unit: 'g' },
  { id: 'calabresa', name: 'Calabresa', unit: 'g' },
];

const INITIAL_DATE = '2026-05-01';

export const INITIAL_PURCHASES: Purchase[] = [
  { id: 'p-ovo', ingredientId: 'ovo', date: INITIAL_DATE, price: 14.00, packageQuantity: 20 },
  { id: 'p-farinha', ingredientId: 'farinha', date: INITIAL_DATE, price: 4.79, packageQuantity: 1000 },
  { id: 'p-oleo', ingredientId: 'oleo', date: INITIAL_DATE, price: 6.45, packageQuantity: 900 },
  { id: 'p-leite', ingredientId: 'leite', date: INITIAL_DATE, price: 4.79, packageQuantity: 1000 },
  { id: 'p-sal', ingredientId: 'sal', date: INITIAL_DATE, price: 2.50, packageQuantity: 1000 },
  { id: 'p-queijo', ingredientId: 'queijo-parmesao', date: INITIAL_DATE, price: 3.39, packageQuantity: 40 },
  { id: 'p-catupiry', ingredientId: 'catupiry', date: INITIAL_DATE, price: 43.45, packageQuantity: 1500 },
  { id: 'p-fermento', ingredientId: 'fermento', date: INITIAL_DATE, price: 3.79, packageQuantity: 150 },
  { id: 'p-embalagem', ingredientId: 'embalagem', date: INITIAL_DATE, price: 45.00, packageQuantity: 100 },
  { id: 'p-sacola', ingredientId: 'sacola', date: INITIAL_DATE, price: 5.00, packageQuantity: 50 },
  { id: 'p-frango', ingredientId: 'frango', date: INITIAL_DATE, price: 11.99, packageQuantity: 1000 },
  { id: 'p-molho', ingredientId: 'molho-tomate', date: INITIAL_DATE, price: 4.00, packageQuantity: 340 },
  { id: 'p-azeitona', ingredientId: 'azeitona', date: INITIAL_DATE, price: 5.99, packageQuantity: 185 },
  { id: 'p-cebola', ingredientId: 'cebola', date: INITIAL_DATE, price: 2.99, packageQuantity: 750 },
  { id: 'p-alho', ingredientId: 'alho', date: INITIAL_DATE, price: 3.00, packageQuantity: 15 },
  { id: 'p-milho', ingredientId: 'milho', date: INITIAL_DATE, price: 2.59, packageQuantity: 285 },
  { id: 'p-paprica', ingredientId: 'paprica', date: INITIAL_DATE, price: 10.00, packageQuantity: 200 },
  { id: 'p-sazon', ingredientId: 'sazon', date: INITIAL_DATE, price: 6.00, packageQuantity: 120 },
  { id: 'p-tempero', ingredientId: 'tempero-pronto', date: INITIAL_DATE, price: 6.15, packageQuantity: 136 },
  { id: 'p-pimenta', ingredientId: 'pimenta-reino', date: INITIAL_DATE, price: 4.00, packageQuantity: 40 },
  { id: 'p-cheiro-verde', ingredientId: 'cheiro-verde', date: INITIAL_DATE, price: 5.39, packageQuantity: 60 },
  { id: 'p-calabresa', ingredientId: 'calabresa', date: INITIAL_DATE, price: 24.22, packageQuantity: 800 },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'massa',
    name: 'Massa',
    yields: 30,
    ingredients: [
      { ingredientId: 'ovo', amount: 3 },
      { ingredientId: 'farinha', amount: 384 },
      { ingredientId: 'oleo', amount: 250 },
      { ingredientId: 'leite', amount: 500 },
      { ingredientId: 'sal', amount: 5 },
      { ingredientId: 'queijo-parmesao', amount: 10 },
      { ingredientId: 'catupiry', amount: 15 },
      { ingredientId: 'fermento', amount: 10 },
      { ingredientId: 'embalagem', amount: 1 },
      { ingredientId: 'sacola', amount: 1 },
    ],
  },
  {
    id: 'recheio-frango',
    name: 'Recheio de Frango',
    yields: 33,
    ingredients: [
      { ingredientId: 'frango', amount: 1500 },
      { ingredientId: 'molho-tomate', amount: 200 },
      { ingredientId: 'azeitona', amount: 150 },
      { ingredientId: 'cebola', amount: 40 },
      { ingredientId: 'alho', amount: 4 },
      { ingredientId: 'milho', amount: 170 },
      { ingredientId: 'paprica', amount: 10 },
      { ingredientId: 'sazon', amount: 5 },
      { ingredientId: 'tempero-pronto', amount: 5 },
      { ingredientId: 'pimenta-reino', amount: 5 },
      { ingredientId: 'cheiro-verde', amount: 15 },
      { ingredientId: 'sal', amount: 5 },
    ],
  },
  {
    id: 'recheio-frango-catupiry',
    name: 'Recheio de Frango c/ Catupiry',
    yields: 33,
    ingredients: [
      { ingredientId: 'frango', amount: 1500 },
      { ingredientId: 'molho-tomate', amount: 200 },
      { ingredientId: 'azeitona', amount: 150 },
      { ingredientId: 'cebola', amount: 40 },
      { ingredientId: 'alho', amount: 4 },
      { ingredientId: 'milho', amount: 170 },
      { ingredientId: 'paprica', amount: 10 },
      { ingredientId: 'sazon', amount: 5 },
      { ingredientId: 'tempero-pronto', amount: 5 },
      { ingredientId: 'pimenta-reino', amount: 5 },
      { ingredientId: 'cheiro-verde', amount: 15 },
      { ingredientId: 'sal', amount: 5 },
      { ingredientId: 'catupiry', amount: 30 },
    ],
  },
  {
    id: 'recheio-calabresa',
    name: 'Recheio de Calabresa',
    yields: 25,
    ingredients: [
      { ingredientId: 'calabresa', amount: 800 },
      { ingredientId: 'cebola', amount: 40 },
      { ingredientId: 'cheiro-verde', amount: 30 },
    ],
  },
];

export const INITIAL_PRODUCTS: TortaProduct[] = [
  {
    id: 'frango-trad',
    name: 'Frango Tradicional',
    recipeIds: ['massa', 'recheio-frango'],
    color: '#f59e0b',
  },
  {
    id: 'frango-catupiry',
    name: 'Frango c/ Catupiry',
    recipeIds: ['massa', 'recheio-frango-catupiry'],
    color: '#fb923c',
  },
  {
    id: 'calabresa',
    name: 'Calabresa',
    recipeIds: ['massa', 'recheio-calabresa'],
    color: '#ef4444',
  },
];

export const INITIAL_SETTINGS: Settings = {
  salePrices: {
    'frango-trad': 8,
    'frango-catupiry': 9,
    'calabresa': 9,
  },
};

export const DATA_VERSION = '1.0';
