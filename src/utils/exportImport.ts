import type { Ingredient, Purchase, Recipe, TortaProduct, Sale, Settings } from '../types';
import { formatCurrency, getMonthLabel } from './costCalculator';

export interface AppSnapshot {
  type: 'vktortas-backup' | 'vktortas-template';
  version: string;
  exportedAt: string;
  ingredients: Ingredient[];
  recipes: Recipe[];
  products: TortaProduct[];
  purchases: Purchase[];
  sales?: Sale[];
  settings?: Settings;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dateLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportFullBackup(data: {
  ingredients: Ingredient[];
  recipes: Recipe[];
  products: TortaProduct[];
  purchases: Purchase[];
  sales: Sale[];
  settings: Settings;
}) {
  const snapshot: AppSnapshot = {
    type: 'vktortas-backup',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `vktortas-backup-${dateLabel()}.json`);
}

export function exportRecipeTemplate(data: {
  ingredients: Ingredient[];
  recipes: Recipe[];
  products: TortaProduct[];
  purchases: Purchase[];
}) {
  const snapshot: AppSnapshot = {
    type: 'vktortas-template',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `vktortas-template-${dateLabel()}.json`);
}

export function importSnapshot(file: File): Promise<AppSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppSnapshot;
        if (!parsed.type?.startsWith('vktortas')) {
          reject(new Error('Arquivo não é um backup vkTortas válido'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('Arquivo inválido ou corrompido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

function csvRow(cells: string[]): string {
  return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';');
}

function br(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function exportMonthlyCSV(
  month: string,
  sales: Sale[],
  purchases: Purchase[],
  products: TortaProduct[],
  ingredients: Ingredient[],
  recipes: Recipe[],
) {
  const monthSales = sales.filter((s) => s.date.startsWith(month));
  const monthPurchases = purchases.filter((p) => p.date.startsWith(month));

  const rows: string[] = [];
  const BOM = '\uFEFF';

  const monthLabel = getMonthLabel(month + '-01');

  rows.push(csvRow([`vkTortas — Relatório Mensal — ${monthLabel}`]));
  rows.push(csvRow([`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`]));
  rows.push('');

  rows.push(csvRow(['=== VENDAS ===']));
  rows.push(csvRow(['Data', 'Produto', 'Quantidade', 'Preço/un (R$)', 'Total (R$)', 'Custo/un (R$)', 'Lucro (R$)']));
  monthSales
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      const product = products.find((p) => p.id === s.tortaType);
      const [y, m, d] = s.date.split('-');
      rows.push(csvRow([
        `${d}/${m}/${y}`,
        product?.name ?? s.tortaType,
        String(s.quantity),
        br(s.salePrice),
        br(s.salePrice * s.quantity),
        br(s.costPerUnit),
        br((s.salePrice - s.costPerUnit) * s.quantity),
      ]));
    });
  rows.push('');

  const totalRev = monthSales.reduce((t, s) => t + s.salePrice * s.quantity, 0);
  const totalCost = monthSales.reduce((t, s) => t + s.costPerUnit * s.quantity, 0);
  const totalUnits = monthSales.reduce((t, s) => t + s.quantity, 0);
  rows.push(csvRow(['=== RESUMO DO MÊS ===']));
  rows.push(csvRow(['Total de Tortas', 'Receita Total (R$)', 'Custo Total (R$)', 'Lucro Líquido (R$)']));
  rows.push(csvRow([String(totalUnits), br(totalRev), br(totalCost), br(totalRev - totalCost)]));
  rows.push('');

  rows.push(csvRow(['=== COMPRAS DO MÊS ===']));
  rows.push(csvRow(['Data', 'Ingrediente', 'Preço Pago (R$)', 'Qtd Pacote', 'Unidade', 'Preço por Unidade (R$)']));
  monthPurchases
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((p) => {
      const ing = ingredients.find((i) => i.id === p.ingredientId);
      const [y, m, d] = p.date.split('-');
      rows.push(csvRow([
        `${d}/${m}/${y}`,
        ing?.name ?? p.ingredientId,
        br(p.price),
        br(p.packageQuantity),
        ing?.unit ?? '',
        br(p.price / p.packageQuantity),
      ]));
    });
  rows.push('');

  rows.push(csvRow(['=== CUSTO ATUAL POR TORTA ===']));
  rows.push(csvRow(['Produto', 'Custo (R$)', 'Preço Venda (R$)', 'Lucro/un (R$)', 'Margem (%)']));
  products.forEach((prod) => {
    const cost = prod.recipeIds.reduce((total, rid) => {
      const recipe = recipes.find((r) => r.id === rid);
      if (!recipe) return total;
      const recipeCost = recipe.ingredients.reduce((s, ri) => {
        const lastPurchase = [...purchases]
          .filter((p) => p.ingredientId === ri.ingredientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (!lastPurchase) return s;
        return s + (lastPurchase.price / lastPurchase.packageQuantity) * ri.amount;
      }, 0);
      return total + recipeCost / (recipe.yields || 1);
    }, 0);
    rows.push(csvRow([
      prod.name,
      br(cost),
      '',
      '',
      '',
    ]));
  });

  const csv = BOM + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `vktortas-${month}.csv`);
}

export function getAvailableMonths(sales: Sale[], purchases: Purchase[]): string[] {
  const months = new Set<string>();
  sales.forEach((s) => months.add(s.date.slice(0, 7)));
  purchases.forEach((p) => months.add(p.date.slice(0, 7)));
  return Array.from(months).sort().reverse();
}
