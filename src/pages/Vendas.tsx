import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../hooks/useAppData';
import {
  calcTortaCost, formatCurrency, formatDate, getMonthLabel,
} from '../utils/costCalculator';
import type { Sale } from '../types';

function NovaVendaModal({
  open,
  onClose,
  onSave,
  defaultSalePrices,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (s: Sale) => void;
  defaultSalePrices: Record<string, number>;
}) {
  const { products, recipes, purchases } = useAppData();
  const today = new Date().toISOString().split('T')[0];
  const [tortaType, setTortaType] = useState<string>(() => products[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [date, setDate] = useState(today);

  function handleTortaChange(id: string) {
    setTortaType(id);
    const defPrice = defaultSalePrices[id];
    if (defPrice) setSalePrice(String(defPrice));
  }

  function handleSave() {
    if (!quantity || !salePrice) return;
    const product = products.find((p) => p.id === tortaType);
    const cost = product ? calcTortaCost(product, recipes, purchases) : 0;
    onSave({
      id: `s-${Date.now()}`,
      date,
      tortaType,
      quantity: parseInt(quantity, 10),
      salePrice: parseFloat(salePrice),
      costPerUnit: cost,
    });
    setQuantity('1');
    setSalePrice('');
    setDate(today);
    onClose();
  }

  const selected = products.find((p) => p.id === tortaType);

  return (
    <Modal open={open} onClose={onClose} title="Registrar Venda">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">Tipo de Torta</label>
          <div className="grid grid-cols-1 gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => handleTortaChange(p.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  tortaType === p.id
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Quantidade</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              Preço unit. (R$)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0,00"
            />
          </div>
        </div>

        {salePrice && quantity && (
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-xs text-stone-400">Total da venda</p>
            <p className="text-lg font-bold text-stone-800">
              {formatCurrency(parseFloat(salePrice) * parseInt(quantity, 10))}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <Button
          className="w-full"
          disabled={!quantity || !salePrice}
          onClick={handleSave}
        >
          Registrar {parseInt(quantity || '1', 10)}x {selected?.name}
        </Button>
      </div>
    </Modal>
  );
}

export function Vendas() {
  const { sales, deleteSale, addSale, settings, products } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Sale[]>();
    [...sales]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((s) => {
        const key = s.date.slice(0, 7);
        const arr = map.get(key) ?? [];
        arr.push(s);
        map.set(key, arr);
      });
    return Array.from(map.entries());
  }, [sales]);

  return (
    <>
      <Header
        title="Vendas"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Nova
          </Button>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-nav space-y-5">
        {sales.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-3xl mb-3">💰</p>
            <p className="text-sm font-medium text-stone-600">Nenhuma venda registrada</p>
            <p className="text-xs text-stone-400 mt-1">
              Toque em "+ Nova" para registrar sua primeira venda
            </p>
          </Card>
        ) : (
          grouped.map(([month, monthSales]) => {
            const totalRev = monthSales.reduce((s, x) => s + x.salePrice * x.quantity, 0);
            const totalCost = monthSales.reduce((s, x) => s + x.costPerUnit * x.quantity, 0);
            const totalProfit = totalRev - totalCost;
            const totalUnits = monthSales.reduce((s, x) => s + x.quantity, 0);

            return (
              <section key={month}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    {getMonthLabel(month + '-01')}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>{totalUnits} tortas</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-semibold text-stone-700">{formatCurrency(totalRev)}</span>
                    <span
                      className="font-semibold"
                      style={{ color: totalProfit >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      ({totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {monthSales.map((sale) => {
                    const product = products.find((p) => p.id === sale.tortaType);
                    const totalVal = sale.salePrice * sale.quantity;
                    const totalCostVal = sale.costPerUnit * sale.quantity;
                    const profit = totalVal - totalCostVal;

                    return (
                      <Card key={sale.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: product?.color ?? '#ccc' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-stone-800">
                                {sale.quantity}x {product?.name ?? sale.tortaType}
                              </p>
                              <Badge color={profit >= 0 ? '#22c55e' : '#ef4444'}>
                                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                              </Badge>
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">
                              {formatDate(sale.date)} · {formatCurrency(sale.salePrice)}/un ·
                              custo {formatCurrency(sale.costPerUnit)}/un
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-stone-800">
                              {formatCurrency(totalVal)}
                            </p>
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="text-stone-300 active:text-red-400 transition-colors mt-1"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      <NovaVendaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addSale}
        defaultSalePrices={settings.salePrices}
      />
    </>
  );
}
