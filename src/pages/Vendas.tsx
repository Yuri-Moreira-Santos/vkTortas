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
import type { Sale, SaleItem } from '../types';

interface DraftItem {
  uid: string;
  tortaType: string;
  quantity: string;
  salePrice: string;
}

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

  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(today);
  const [isPaid, setIsPaid] = useState(false);
  const [paidAt, setPaidAt] = useState(today);
  const [items, setItems] = useState<DraftItem[]>(() => [{
    uid: '1',
    tortaType: products[0]?.id ?? '',
    quantity: '1',
    salePrice: String(defaultSalePrices[products[0]?.id ?? ''] ?? ''),
  }]);

  function addItem() {
    const firstId = products[0]?.id ?? '';
    setItems((prev) => [...prev, {
      uid: String(Date.now()),
      tortaType: firstId,
      quantity: '1',
      salePrice: String(defaultSalePrices[firstId] ?? ''),
    }]);
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }

  function updateItem(uid: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((i) => {
      if (i.uid !== uid) return i;
      const next = { ...i, ...patch };
      if (patch.tortaType) {
        next.salePrice = String(defaultSalePrices[patch.tortaType] ?? '');
      }
      return next;
    }));
  }

  const totalValue = items.reduce((sum, i) => {
    const qty = parseInt(i.quantity, 10) || 0;
    const price = parseFloat(i.salePrice) || 0;
    return sum + qty * price;
  }, 0);

  const isValid = items.length > 0 &&
    items.every((i) => i.tortaType && parseInt(i.quantity, 10) > 0 && parseFloat(i.salePrice) > 0);

  function handleSave() {
    if (!isValid) return;
    const saleItems: SaleItem[] = items.map((i) => {
      const product = products.find((p) => p.id === i.tortaType);
      const cost = product ? calcTortaCost(product, recipes, purchases) : 0;
      return {
        tortaType: i.tortaType,
        quantity: parseInt(i.quantity, 10),
        salePrice: parseFloat(i.salePrice),
        costPerUnit: cost,
      };
    });
    onSave({
      id: `s-${Date.now()}`,
      date,
      customerName: customerName.trim(),
      items: saleItems,
      paidAt: isPaid ? paidAt : undefined,
    });
    setCustomerName('');
    setDate(today);
    setIsPaid(false);
    setPaidAt(today);
    setItems([{
      uid: '1',
      tortaType: products[0]?.id ?? '',
      quantity: '1',
      salePrice: String(defaultSalePrices[products[0]?.id ?? ''] ?? ''),
    }]);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar Venda">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Cliente <span className="text-stone-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome do cliente"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Data da venda</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-stone-600">Itens do pedido</label>
            <button
              onClick={addItem}
              className="text-xs text-brand-600 font-semibold active:opacity-60"
            >
              + Adicionar torta
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.uid} className="bg-stone-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.uid)}
                      className="text-stone-300 active:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={item.tortaType}
                    onChange={(e) => updateItem(item.uid, { tortaType: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Qtd</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.uid, { quantity: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Preço/un (R$)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={item.salePrice}
                        onChange={(e) => updateItem(item.uid, { salePrice: e.target.value })}
                        placeholder="0,00"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalValue > 0 && (
          <div className="bg-brand-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-brand-700">Total do pedido</span>
            <span className="text-lg font-bold text-brand-800">{formatCurrency(totalValue)}</span>
          </div>
        )}

        <div className="border border-stone-100 rounded-xl p-3 space-y-3">
          <button
            onClick={() => setIsPaid((v) => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              isPaid ? 'bg-green-500 border-green-500' : 'border-stone-300'
            }`}>
              {isPaid && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-stone-700">Já recebi o pagamento</span>
          </button>
          {isPaid && (
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Data do pagamento</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          )}
        </div>

        <Button className="w-full" disabled={!isValid} onClick={handleSave}>
          Registrar Venda
        </Button>
      </div>
    </Modal>
  );
}

function MarkPaidModal({
  sale,
  onClose,
  onConfirm,
}: {
  sale: Sale;
  onClose: () => void;
  onConfirm: (paidAt: string) => void;
}) {
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  return (
    <Modal open onClose={onClose} title="Confirmar Pagamento">
      <div className="space-y-4">
        <p className="text-sm text-stone-600">
          {sale.customerName ? `Marcar pedido de ${sale.customerName}` : 'Marcar pedido'} como pago?
        </p>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Data do pagamento</label>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={() => onConfirm(paidAt)}>Confirmar</Button>
        </div>
      </div>
    </Modal>
  );
}

export function Vendas() {
  const { sales, deleteSale, addSale, markSaleAsPaid, settings, products } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [saleToMark, setSaleToMark] = useState<Sale | null>(null);

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

  function saleTotal(s: Sale) {
    return s.items.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  }

  function saleProfit(s: Sale) {
    return s.items.reduce((sum, i) => sum + (i.salePrice - i.costPerUnit) * i.quantity, 0);
  }

  function saleTotalUnits(s: Sale) {
    return s.items.reduce((sum, i) => sum + i.quantity, 0);
  }

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
            const totalRev = monthSales.reduce((s, x) => s + saleTotal(x), 0);
            const totalUnits = monthSales.reduce((s, x) => s + saleTotalUnits(x), 0);
            const totalReceived = monthSales
              .filter((x) => x.paidAt)
              .reduce((s, x) => s + saleTotal(x), 0);
            const totalPending = totalRev - totalReceived;

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
                    {totalPending > 0 && (
                      <span className="font-semibold text-amber-600">
                        ({formatCurrency(totalPending)} a receber)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {monthSales.map((sale) => {
                    const total = saleTotal(sale);
                    const profit = saleProfit(sale);

                    return (
                      <Card key={sale.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-stone-800">
                                {sale.customerName || 'Sem nome'}
                              </p>
                              {sale.paidAt ? (
                                <Badge color="#22c55e">Pago</Badge>
                              ) : (
                                <Badge color="#f59e0b">A receber</Badge>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5 mb-2">
                              {formatDate(sale.date)}
                              {sale.paidAt && sale.paidAt !== sale.date && ` · pago em ${formatDate(sale.paidAt)}`}
                            </p>
                            <div className="space-y-0.5">
                              {sale.items.map((item, idx) => {
                                const product = products.find((p) => p.id === item.tortaType);
                                return (
                                  <div key={idx} className="flex items-center gap-1.5 text-xs text-stone-600">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: product?.color ?? '#ccc' }}
                                    />
                                    <span>{item.quantity}x {product?.name ?? item.tortaType}</span>
                                    <span className="text-stone-400">
                                      · {formatCurrency(item.salePrice)}/un
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {!sale.paidAt && (
                              <button
                                onClick={() => setSaleToMark(sale)}
                                className="mt-2 text-xs font-semibold text-green-600 active:opacity-60"
                              >
                                ✓ Marcar como pago
                              </button>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-stone-800">
                              {formatCurrency(total)}
                            </p>
                            <p className="text-xs" style={{ color: profit >= 0 ? '#22c55e' : '#ef4444' }}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
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

      {saleToMark && (
        <MarkPaidModal
          sale={saleToMark}
          onClose={() => setSaleToMark(null)}
          onConfirm={(paidAt) => {
            markSaleAsPaid(saleToMark.id, paidAt);
            setSaleToMark(null);
          }}
        />
      )}
    </>
  );
}
