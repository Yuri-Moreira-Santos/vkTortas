import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency, formatDate, getLastPurchase } from '../utils/costCalculator';
import type { Purchase, Ingredient } from '../types';

function NovaPurchaseModal({
  open,
  onClose,
  ingredients,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSave: (p: Purchase) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [date, setDate] = useState(today);

  function handleSave() {
    if (!ingredientId || !price || !packageQuantity) return;
    onSave({
      id: `p-${Date.now()}`,
      ingredientId,
      date,
      price: parseFloat(price),
      packageQuantity: parseFloat(packageQuantity),
    });
    setPrice('');
    setPackageQuantity('');
    setDate(today);
    onClose();
  }

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  return (
    <Modal open={open} onClose={onClose} title="Registrar Compra">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Ingrediente</label>
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Quantidade do pacote ({selectedIngredient?.unit ?? 'un'})
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={packageQuantity}
            onChange={(e) => setPackageQuantity(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder={`Ex: 1000 (para 1kg em g)`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Preço pago (R$)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-sm">R$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Data da compra</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <Button
          className="w-full"
          disabled={!ingredientId || !price || !packageQuantity}
          onClick={handleSave}
        >
          Salvar Compra
        </Button>
      </div>
    </Modal>
  );
}

function HistoricoModal({
  open,
  onClose,
  ingredient,
  purchases,
}: {
  open: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  purchases: Purchase[];
}) {
  if (!ingredient) return null;

  const history = purchases
    .filter((p) => p.ingredientId === ingredient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Modal open={open} onClose={onClose} title={`Histórico — ${ingredient.name}`}>
      {history.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-4">Nenhuma compra registrada</p>
      ) : (
        <div className="space-y-3">
          {history.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between py-2 ${
                i < history.length - 1 ? 'border-b border-stone-100' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-stone-700">{formatDate(p.date)}</p>
                <p className="text-xs text-stone-400">
                  {p.packageQuantity} {ingredient.unit} →{' '}
                  {formatCurrency(p.price / p.packageQuantity)}/{ingredient.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-800">{formatCurrency(p.price)}</p>
                {i === 0 && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                    atual
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function Compras() {
  const { ingredients, purchases, addPurchase } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [histIngredient, setHistIngredient] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      ingredients.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      ),
    [ingredients, search]
  );

  return (
    <>
      <Header
        title="Compras"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Nova
          </Button>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-nav space-y-3">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((ingredient) => {
            const last = getLastPurchase(ingredient.id, purchases);
            const pricePerUnit = last
              ? last.price / last.packageQuantity
              : null;

            return (
              <Card
                key={ingredient.id}
                className="p-4"
                onClick={() => setHistIngredient(ingredient)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm">{ingredient.name}</p>
                    {last ? (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {formatDate(last.date)} · {last.packageQuantity}
                        {ingredient.unit} por {formatCurrency(last.price)}
                      </p>
                    ) : (
                      <p className="text-xs text-red-400 mt-0.5">Sem preço cadastrado</p>
                    )}
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    {pricePerUnit !== null ? (
                      <>
                        <p className="text-sm font-semibold text-stone-800">
                          {formatCurrency(pricePerUnit)}
                        </p>
                        <p className="text-xs text-stone-400">por {ingredient.unit}</p>
                      </>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <NovaPurchaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ingredients={ingredients}
        onSave={addPurchase}
      />
      <HistoricoModal
        open={histIngredient !== null}
        onClose={() => setHistIngredient(null)}
        ingredient={histIngredient}
        purchases={purchases}
      />
    </>
  );
}
