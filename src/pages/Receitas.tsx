import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAppData } from '../hooks/useAppData';
import {
  calcTortaCost, calcIngredientCost, formatCurrency, getLastPurchase,
} from '../utils/costCalculator';

const TABS = [
  { id: 'frango-trad', label: 'Frango Trad.' },
  { id: 'frango-catupiry', label: 'c/ Catupiry' },
  { id: 'calabresa', label: 'Calabresa' },
] as const;

export function Receitas() {
  const { products, recipes, ingredients, purchases } = useAppData();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('frango-trad');

  const product = products.find((p) => p.id === activeTab);
  const totalCost = product
    ? calcTortaCost(product, recipes, purchases)
    : 0;

  const ingredientRows = useMemo(() => {
    if (!product) return [];

    const rows: {
      ingredientId: string;
      name: string;
      unit: string;
      amount: number;
      cost: number;
      hasPrice: boolean;
      recipeName: string;
    }[] = [];

    product.recipeIds.forEach((rid) => {
      const recipe = recipes.find((r) => r.id === rid);
      if (!recipe) return;
      recipe.ingredients.forEach((ri) => {
        const ing = ingredients.find((i) => i.id === ri.ingredientId);
        if (!ing) return;
        const last = getLastPurchase(ri.ingredientId, purchases);
        const cost = calcIngredientCost(ri, purchases);
        rows.push({
          ingredientId: ri.ingredientId,
          name: ing.name,
          unit: ing.unit,
          amount: ri.amount,
          cost,
          hasPrice: last !== undefined,
          recipeName: recipe.name,
        });
      });
    });

    return rows;
  }, [product, recipes, ingredients, purchases]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof ingredientRows>();
    ingredientRows.forEach((row) => {
      const arr = map.get(row.recipeName) ?? [];
      arr.push(row);
      map.set(row.recipeName, arr);
    });
    return Array.from(map.entries());
  }, [ingredientRows]);

  const missingPrices = ingredientRows.filter((r) => !r.hasPrice).length;

  return (
    <>
      <Header title="Receitas" />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-nav space-y-4">
        <div className="flex bg-white rounded-2xl border border-stone-100 shadow-sm p-1 gap-1">
          {TABS.map((tab) => {
            const p = products.find((pr) => pr.id === tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-stone-500 active:bg-stone-100'
                }`}
                style={isActive && p ? { backgroundColor: p.color } : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400">Custo total por torta</p>
            <p className="text-2xl font-bold text-stone-800 mt-0.5">
              {formatCurrency(totalCost)}
            </p>
          </div>
          <div className="text-right">
            {missingPrices > 0 && (
              <Badge className="bg-amber-50 text-amber-600">
                {missingPrices} sem preço
              </Badge>
            )}
          </div>
        </Card>

        {grouped.map(([sectionName, rows]) => {
          const sectionCost = rows.reduce((s, r) => s + r.cost, 0);

          return (
            <section key={sectionName}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  {sectionName}
                </h2>
                <span className="text-xs font-semibold text-stone-500">
                  {formatCurrency(sectionCost)}
                </span>
              </div>

              <Card>
                {rows.map((row, i) => (
                  <div
                    key={`${row.ingredientId}-${row.recipeName}`}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < rows.length - 1 ? 'border-b border-stone-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">{row.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {row.amount} {row.unit}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      {row.hasPrice ? (
                        <p className="text-sm font-semibold text-stone-800">
                          {formatCurrency(row.cost)}
                        </p>
                      ) : (
                        <span className="text-xs text-amber-500 font-medium">Sem preço</span>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          );
        })}
      </main>
    </>
  );
}
