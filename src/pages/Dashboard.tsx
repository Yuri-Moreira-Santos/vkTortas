import { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useAppData } from '../hooks/useAppData';
import {
  calcTortaCost, formatCurrency, getMonthLabel,
} from '../utils/costCalculator';
import {
  exportFullBackup, exportRecipeTemplate, exportMonthlyCSV,
  importSnapshot, getAvailableMonths,
} from '../utils/exportImport';
import type { AppSnapshot } from '../utils/exportImport';

function SettingsModal({
  open,
  onClose,
  products,
  salePrices,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  products: { id: string; name: string }[];
  salePrices: Record<string, number>;
  onSave: (prices: Record<string, number>) => void;
}) {
  const [prices, setPrices] = useState({ ...salePrices });

  function handleSave() {
    onSave(prices);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Preços de Venda">
      <div className="space-y-4">
        {products.map(({ id, name }) => (
          <div key={id}>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              {name}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-stone-500 text-sm">R$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={prices[id] || ''}
                onChange={(e) =>
                  setPrices((p) => ({ ...p, [id]: parseFloat(e.target.value) || 0 }))
                }
                className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="0,00"
              />
            </div>
          </div>
        ))}
        <Button className="w-full mt-2" onClick={handleSave}>
          Salvar Preços
        </Button>
      </div>
    </Modal>
  );
}

function DataModal({
  open, onClose, appData, onImport,
}: {
  open: boolean;
  onClose: () => void;
  appData: {
    ingredients: ReturnType<typeof useAppData>['ingredients'];
    recipes: ReturnType<typeof useAppData>['recipes'];
    products: ReturnType<typeof useAppData>['products'];
    purchases: ReturnType<typeof useAppData>['purchases'];
    sales: ReturnType<typeof useAppData>['sales'];
    settings: ReturnType<typeof useAppData>['settings'];
  };
  onImport: (snapshot: AppSnapshot) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  const availableMonths = getAvailableMonths(appData.sales, appData.purchases);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const defaultMonth = availableMonths[0] ?? currentMonth;

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImporting(true);
    try {
      const snapshot = await importSnapshot(file);
      if (confirm(`Importar ${snapshot.type === 'vktortas-backup' ? 'backup completo' : 'template de receitas'}?\n\nExportado em: ${new Date(snapshot.exportedAt).toLocaleString('pt-BR')}`)) {
        onImport(snapshot);
        onClose();
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const month = selectedMonth || defaultMonth;

  return (
    <Modal open={open} onClose={onClose} title="Exportar / Importar">
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Exportar</p>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Relatório mensal (CSV — abre no Excel)</label>
              <div className="flex gap-2">
                <select
                  value={month}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {availableMonths.length === 0 && (
                    <option value={currentMonth}>{getMonthLabel(currentMonth + '-01')}</option>
                  )}
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{getMonthLabel(m + '-01')}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => exportMonthlyCSV(
                    month,
                    appData.sales,
                    appData.purchases,
                    appData.products,
                    appData.ingredients,
                    appData.recipes,
                  )}
                >
                  CSV
                </Button>
              </div>
            </div>

            <button
              onClick={() => exportFullBackup(appData)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 text-left active:bg-stone-50 transition-colors"
            >
              <span className="text-xl">💾</span>
              <div>
                <p className="text-sm font-medium text-stone-700">Backup Completo</p>
                <p className="text-xs text-stone-400">JSON com todos os dados — para restaurar ou migrar dispositivo</p>
              </div>
            </button>

            <button
              onClick={() => exportRecipeTemplate({
                ingredients: appData.ingredients,
                recipes: appData.recipes,
                products: appData.products,
                purchases: appData.purchases,
              })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 text-left active:bg-stone-50 transition-colors"
            >
              <span className="text-xl">🔗</span>
              <div>
                <p className="text-sm font-medium text-stone-700">Template de Receitas</p>
                <p className="text-xs text-stone-400">JSON com receitas e preços — para compartilhar com outra loja</p>
              </div>
            </button>
          </div>
        </section>

        <div className="border-t border-stone-100" />

        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Importar</p>
          {importError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{importError}</p>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-stone-200 text-left active:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <span className="text-xl">📥</span>
            <div>
              <p className="text-sm font-medium text-stone-700">
                {importing ? 'Carregando...' : 'Selecionar arquivo JSON'}
              </p>
              <p className="text-xs text-stone-400">Backup completo ou template de receitas</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </section>
      </div>
    </Modal>
  );
}

export function Dashboard() {
  const { products, recipes, ingredients, purchases, sales, settings, updateSettings } = useAppData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  const tortaStats = useMemo(
    () =>
      products.map((p) => {
        const cost = calcTortaCost(p, recipes, purchases);
        const salePrice = settings.salePrices[p.id] ?? 0;
        const profit = salePrice - cost;
        return { product: p, cost, salePrice, profit };
      }),
    [products, recipes, purchases, settings]
  );

  function saleRevenue(s: typeof sales[0]) {
    return s.items.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  }
  function saleCost(s: typeof sales[0]) {
    return s.items.reduce((sum, i) => sum + i.costPerUnit * i.quantity, 0);
  }
  function saleUnits(s: typeof sales[0]) {
    return s.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  const monthlyData = useMemo(() => {
    const map = new Map<string, { recebido: number; aReceber: number; cost: number }>();
    sales.forEach((s) => {
      const key = s.date.slice(0, 7);
      const entry = map.get(key) ?? { recebido: 0, aReceber: 0, cost: 0 };
      const rev = saleRevenue(s);
      const cost = saleCost(s);
      if (s.paidAt) {
        entry.recebido += rev;
      } else {
        entry.aReceber += rev;
      }
      entry.cost += cost;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: getMonthLabel(month + '-01'),
        recebido: parseFloat(data.recebido.toFixed(2)),
        aReceber: parseFloat(data.aReceber.toFixed(2)),
        custo: parseFloat(data.cost.toFixed(2)),
        lucro: parseFloat((data.recebido - data.cost).toFixed(2)),
      }));
  }, [sales]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthSales = sales.filter((s) => s.date.startsWith(currentMonth));
  const thisMonthRevenue = thisMonthSales.reduce((s, x) => s + saleRevenue(x), 0);
  const thisMonthCost = thisMonthSales.reduce((s, x) => s + saleCost(x), 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost;
  const thisMonthUnits = thisMonthSales.reduce((s, x) => s + saleUnits(x), 0);

  const totalPending = sales
    .filter((s) => !s.paidAt)
    .reduce((sum, s) => sum + saleRevenue(s), 0);
  const pendingCount = sales.filter((s) => !s.paidAt).length;

  const allPricesSet = products.every((p) => (settings.salePrices[p.id] ?? 0) > 0);

  return (
    <>
      <Header
        title="vkTortas"
        action={
          <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl text-stone-400 active:bg-stone-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={() => setDataOpen(true)}
            className="p-2 rounded-xl text-stone-400 active:bg-stone-100 transition-colors"
            title="Exportar / Importar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-nav space-y-5">
        {!allPricesSet && (
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full bg-brand-50 border border-brand-200 rounded-2xl p-4 text-left flex items-center gap-3"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="text-sm font-semibold text-brand-700">Configure os preços de venda</p>
              <p className="text-xs text-brand-600">Necessário para calcular o lucro</p>
            </div>
          </button>
        )}

        {totalPending > 0 && (
          <Card className="p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                  A Receber
                </p>
                <p className="text-2xl font-bold text-amber-800">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {pendingCount} {pendingCount === 1 ? 'pedido não pago' : 'pedidos não pagos'}
                </p>
              </div>
              <span className="text-4xl">🕐</span>
            </div>
          </Card>
        )}

        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Custo × Lucro por Torta
          </h2>
          <div className="space-y-3">
            {tortaStats.map(({ product, cost, salePrice, profit }) => (
              <Card key={product.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-stone-800">{product.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {salePrice > 0
                        ? `Venda: ${formatCurrency(salePrice)}`
                        : 'Preço de venda não configurado'}
                    </p>
                  </div>
                  {salePrice > 0 && (
                    <Badge
                      color={profit >= 0 ? '#22c55e' : '#ef4444'}
                    >
                      {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-stone-400">Custo</p>
                    <p className="text-lg font-bold text-stone-800">{formatCurrency(cost)}</p>
                  </div>
                  {salePrice > 0 && (
                    <div>
                      <p className="text-xs text-stone-400">Margem</p>
                      <p className="text-lg font-bold" style={{ color: profit >= 0 ? '#22c55e' : '#ef4444' }}>
                        {cost > 0 ? `${((profit / salePrice) * 100).toFixed(0)}%` : '—'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: product.color,
                      width: salePrice > 0 ? `${Math.min((cost / salePrice) * 100, 100)}%` : '100%',
                    }}
                  />
                </div>
                {salePrice > 0 && (
                  <p className="text-xs text-stone-400 mt-1">
                    Custo = {cost > 0 ? `${((cost / salePrice) * 100).toFixed(0)}%` : '0%'} do preço de venda
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Este Mês
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-stone-400 mb-1">Tortas</p>
              <p className="text-xl font-bold text-stone-800">{thisMonthUnits}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-stone-400 mb-1">Vendido</p>
              <p className="text-lg font-bold text-stone-800">{formatCurrency(thisMonthRevenue)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-stone-400 mb-1">Lucro</p>
              <p
                className="text-lg font-bold"
                style={{ color: thisMonthProfit >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {formatCurrency(thisMonthProfit)}
              </p>
            </Card>
          </div>
        </section>

        {monthlyData.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Balanço Mensal
            </h2>
            <Card className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#78716c' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="recebido" name="Recebido" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aReceber" name="A Receber" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" name="Custo" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" name="Lucro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </section>
        )}

        {monthlyData.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm font-medium text-stone-600">Sem dados de vendas ainda</p>
            <p className="text-xs text-stone-400 mt-1">Registre vendas para ver o balanço mensal</p>
          </Card>
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        products={products}
        salePrices={settings.salePrices}
        onSave={(prices) =>
          updateSettings({ ...settings, salePrices: prices })
        }
      />
      <DataModal
        open={dataOpen}
        onClose={() => setDataOpen(false)}
        appData={{ ingredients, recipes, products, purchases, sales, settings }}
        onImport={(snapshot) => {
          const isFullBackup = snapshot.type === 'vktortas-backup';
          localStorage.setItem('vkt_ingredients', JSON.stringify(snapshot.ingredients));
          localStorage.setItem('vkt_recipes', JSON.stringify(snapshot.recipes));
          localStorage.setItem('vkt_products', JSON.stringify(snapshot.products));
          localStorage.setItem('vkt_purchases', JSON.stringify(snapshot.purchases));
          if (isFullBackup && snapshot.sales) {
            localStorage.setItem('vkt_sales', JSON.stringify(snapshot.sales));
          }
          if (isFullBackup && snapshot.settings) {
            localStorage.setItem('vkt_settings', JSON.stringify(snapshot.settings));
          }
          window.location.reload();
        }}
      />
    </>
  );
}
