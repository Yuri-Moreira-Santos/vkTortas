import { useState, useMemo } from 'react';
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
import type { TortaType } from '../types';

function SettingsModal({
  open,
  onClose,
  salePrices,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  salePrices: Record<TortaType, number>;
  onSave: (prices: Record<TortaType, number>) => void;
}) {
  const [prices, setPrices] = useState({ ...salePrices });

  function handleSave() {
    onSave(prices);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Preços de Venda">
      <div className="space-y-4">
        {(
          [
            { id: 'frango-trad' as TortaType, label: 'Frango Tradicional' },
            { id: 'frango-catupiry' as TortaType, label: 'Frango c/ Catupiry' },
            { id: 'calabresa' as TortaType, label: 'Calabresa' },
          ] as { id: TortaType; label: string }[]
        ).map(({ id, label }) => (
          <div key={id}>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              {label}
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

export function Dashboard() {
  const { products, recipes, purchases, sales, settings, updateSettings } = useAppData();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const monthlyData = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number }>();
    sales.forEach((s) => {
      const key = s.date.slice(0, 7);
      const entry = map.get(key) ?? { revenue: 0, cost: 0 };
      entry.revenue += s.salePrice * s.quantity;
      entry.cost += s.costPerUnit * s.quantity;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: getMonthLabel(month + '-01'),
        receita: parseFloat(data.revenue.toFixed(2)),
        custo: parseFloat(data.cost.toFixed(2)),
        lucro: parseFloat((data.revenue - data.cost).toFixed(2)),
      }));
  }, [sales]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthSales = sales.filter((s) => s.date.startsWith(currentMonth));
  const thisMonthRevenue = thisMonthSales.reduce((s, x) => s + x.salePrice * x.quantity, 0);
  const thisMonthCost = thisMonthSales.reduce((s, x) => s + x.costPerUnit * x.quantity, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost;
  const thisMonthUnits = thisMonthSales.reduce((s, x) => s + x.quantity, 0);

  const allPricesSet = products.every((p) => (settings.salePrices[p.id] ?? 0) > 0);

  return (
    <>
      <Header
        title="vkTortas"
        action={
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl text-stone-400 active:bg-stone-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
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
              <p className="text-xs text-stone-400 mb-1">Receita</p>
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
                  <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" name="Custo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
        salePrices={settings.salePrices}
        onSave={(prices) =>
          updateSettings({ ...settings, salePrices: prices })
        }
      />
    </>
  );
}
