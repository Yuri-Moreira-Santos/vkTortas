import { useState, useMemo, useRef, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../hooks/useAppData';
import {
  calcTortaCost, calcIngredientCostPerTorta, formatCurrency, getLastPurchase,
} from '../utils/costCalculator';
import type { Recipe, TortaProduct, Ingredient } from '../types';

const PRESET_COLORS = [
  '#f59e0b', '#fb923c', '#ef4444', '#ec4899',
  '#8b5cf6', '#3b82f6', '#10b981', '#64748b',
];

function AddIngredientModal({
  open, onClose, recipeId, ingredients, usedIds, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  ingredients: Ingredient[];
  usedIds: string[];
  onAdd: (recipeId: string, ingredientId: string, amount: number) => void;
}) {
  const available = ingredients.filter((i) => !usedIds.includes(i.id));
  const [ingredientId, setIngredientId] = useState(available[0]?.id ?? '');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) setIngredientId(available[0]?.id ?? '');
  }, [open]);// eslint-disable-line

  function handleSave() {
    if (!ingredientId || !amount) return;
    onAdd(recipeId, ingredientId, parseFloat(amount));
    setAmount('');
    onClose();
  }

  const selected = ingredients.find((i) => i.id === ingredientId);

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Ingrediente">
      <div className="space-y-4">
        {available.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">
            Todos os ingredientes já estão na receita
          </p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Ingrediente</label>
              <select
                value={ingredientId}
                onChange={(e) => setIngredientId(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                {available.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Quantidade ({selected?.unit ?? 'un'})
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="0"
              />
            </div>
            <Button className="w-full" disabled={!ingredientId || !amount} onClick={handleSave}>
              Adicionar
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

function NewRecipeModal({
  open, onClose, onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}) {
  const [name, setName] = useState('');
  const [yields, setYields] = useState('1');

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: `recipe-${Date.now()}`, name: name.trim(), yields: parseInt(yields) || 1, ingredients: [] });
    setName('');
    setYields('1');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Receita">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Nome da receita</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="Ex: Recheio de Atum"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Quantas tortas essa receita rende?
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={yields}
            onChange={(e) => setYields(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-stone-400 mt-1">
            Use 1 se os ingredientes já são por torta individual
          </p>
        </div>
        <Button className="w-full" disabled={!name.trim()} onClick={handleSave}>
          Criar Receita
        </Button>
      </div>
    </Modal>
  );
}

function NewProductModal({
  open, onClose, recipes, onSave,
}: {
  open: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onSave: (product: TortaProduct) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

  function toggleRecipe(id: string) {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: `product-${Date.now()}`,
      name: name.trim(),
      color,
      recipeIds: selectedRecipes,
    });
    setName('');
    setColor(PRESET_COLORS[0]);
    setSelectedRecipes([]);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Produto">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Nome do produto</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="Ex: Torta de Atum"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">Cor</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform active:scale-90"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            Receitas utilizadas
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recipes.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleRecipe(r.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                  selectedRecipes.includes(r.id)
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-stone-200'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  selectedRecipes.includes(r.id) ? 'bg-brand-500' : 'border-2 border-stone-300'
                }`}>
                  {selectedRecipes.includes(r.id) && (
                    <svg viewBox="0 0 12 12" fill="white" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{r.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" disabled={!name.trim()} onClick={handleSave}>
          Criar Produto
        </Button>
      </div>
    </Modal>
  );
}

function ManageRecipesModal({
  open, onClose, product, recipes, onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  product: TortaProduct | null;
  recipes: Recipe[];
  onUpdate: (productId: string, recipeIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (product) setSelected([...product.recipeIds]);
  }, [product]);

  if (!product) return null;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function handleSave() {
    onUpdate(product!.id, selected);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Receitas — ${product.name}`}>
      <div className="space-y-3">
        {recipes.map((r) => (
          <button
            key={r.id}
            onClick={() => toggle(r.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
              selected.includes(r.id) ? 'border-brand-400 bg-brand-50' : 'border-stone-200'
            }`}
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
              selected.includes(r.id) ? 'bg-brand-500' : 'border-2 border-stone-300'
            }`}>
              {selected.includes(r.id) && (
                <svg viewBox="0 0 12 12" className="w-3 h-3">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">{r.name}</span>
          </button>
        ))}
        <Button className="w-full mt-2" onClick={handleSave}>Salvar</Button>
      </div>
    </Modal>
  );
}

function InlineAmountInput({
  value, unit, onSave,
}: {
  value: number;
  unit: string;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const num = parseFloat(draft);
    if (!isNaN(num) && num > 0) onSave(num);
    else setDraft(String(value));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 border border-brand-400 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg active:bg-stone-100 transition-colors"
    >
      <span className="text-sm font-semibold text-brand-600 underline decoration-dashed underline-offset-2">
        {value}
      </span>
      <span className="text-xs text-stone-400">{unit}</span>
    </button>
  );
}

export function Receitas() {
  const {
    products, recipes, ingredients, purchases,
    updateRecipeIngredientAmount, addIngredientToRecipe,
    removeIngredientFromRecipe, addRecipe, deleteRecipe,
    renameRecipe, updateRecipeYields, addProduct, deleteProduct,
    updateProductName, updateProductRecipes,
  } = useAppData();

  const [activeProductId, setActiveProductId] = useState<string>(
    () => products[0]?.id ?? ''
  );
  const [addIngModal, setAddIngModal] = useState<{ recipeId: string } | null>(null);
  const [newRecipeModal, setNewRecipeModal] = useState(false);
  const [newProductModal, setNewProductModal] = useState(false);
  const [manageRecipesOpen, setManageRecipesOpen] = useState(false);
  const [renamingProduct, setRenamingProduct] = useState(false);
  const [productNameDraft, setProductNameDraft] = useState('');
  const [renamingRecipe, setRenamingRecipe] = useState<string | null>(null);
  const [recipeNameDraft, setRecipeNameDraft] = useState('');

  const activeProduct = products.find((p) => p.id === activeProductId) ?? products[0];

  const totalCost = activeProduct
    ? calcTortaCost(activeProduct, recipes, purchases)
    : 0;

  const sections = useMemo(() => {
    if (!activeProduct) return [];
    return activeProduct.recipeIds
      .map((rid) => recipes.find((r) => r.id === rid))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);
  }, [activeProduct, recipes]);

  const missingPrices = useMemo(() => {
    if (!activeProduct) return 0;
    let count = 0;
    activeProduct.recipeIds.forEach((rid) => {
      const r = recipes.find((rec) => rec.id === rid);
      r?.ingredients.forEach((ri) => {
        if (!getLastPurchase(ri.ingredientId, purchases)) count++;
      });
    });
    return count;
  }, [activeProduct, recipes, purchases]);

  function startRenameProduct() {
    setProductNameDraft(activeProduct?.name ?? '');
    setRenamingProduct(true);
  }

  function commitRenameProduct() {
    if (activeProduct && productNameDraft.trim()) {
      updateProductName(activeProduct.id, productNameDraft.trim());
    }
    setRenamingProduct(false);
  }

  function startRenameRecipe(id: string, currentName: string) {
    setRenamingRecipe(id);
    setRecipeNameDraft(currentName);
  }

  function commitRenameRecipe() {
    if (renamingRecipe && recipeNameDraft.trim()) {
      renameRecipe(renamingRecipe, recipeNameDraft.trim());
    }
    setRenamingRecipe(null);
  }

  return (
    <>
      <Header
        title="Receitas"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setNewRecipeModal(true)}>
              + Receita
            </Button>
            <Button size="sm" onClick={() => setNewProductModal(true)}>
              + Produto
            </Button>
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-nav space-y-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProductId(p.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeProductId === p.id ? 'text-white shadow-sm' : 'bg-white text-stone-500 border border-stone-200'
              }`}
              style={activeProductId === p.id ? { backgroundColor: p.color } : undefined}
            >
              {p.name}
            </button>
          ))}
        </div>

        {activeProduct && (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {renamingProduct ? (
                    <input
                      type="text"
                      value={productNameDraft}
                      onChange={(e) => setProductNameDraft(e.target.value)}
                      onBlur={commitRenameProduct}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRenameProduct(); }}
                      className="text-lg font-bold border-b-2 border-brand-400 bg-transparent focus:outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <button onClick={startRenameProduct} className="text-left">
                      <p className="text-xs text-stone-400">Custo total por torta</p>
                      <p className="text-2xl font-bold text-stone-800 mt-0.5">
                        {formatCurrency(totalCost)}
                      </p>
                      <p className="text-xs text-brand-600 underline decoration-dashed mt-0.5">
                        {activeProduct.name} ✏️
                      </p>
                    </button>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {missingPrices > 0 && (
                    <Badge className="bg-amber-50 text-amber-600">{missingPrices} sem preço</Badge>
                  )}
                  <button
                    onClick={() => setManageRecipesOpen(true)}
                    className="text-xs text-stone-400 underline decoration-dashed"
                  >
                    Receitas usadas
                  </button>
                  {products.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${activeProduct.name}"?`)) {
                          deleteProduct(activeProduct.id);
                          setActiveProductId(products.find((p) => p.id !== activeProduct.id)?.id ?? '');
                        }
                      }}
                      className="text-xs text-red-400"
                    >
                      Excluir produto
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {sections.map((recipe) => {
              const sectionCost = recipe.ingredients.reduce(
                (s, ri) => s + calcIngredientCostPerTorta(ri, purchases, recipe.yields), 0
              );

              return (
                <section key={recipe.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      {renamingRecipe === recipe.id ? (
                        <input
                          type="text"
                          value={recipeNameDraft}
                          onChange={(e) => setRecipeNameDraft(e.target.value)}
                          onBlur={commitRenameRecipe}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitRenameRecipe(); }}
                          className="text-xs font-semibold uppercase tracking-wider border-b border-brand-400 bg-transparent focus:outline-none w-full"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startRenameRecipe(recipe.id, recipe.name)}
                          className="text-xs font-semibold text-stone-400 uppercase tracking-wider"
                        >
                          {recipe.name} ✏️
                        </button>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-stone-300">Rende</span>
                        <InlineAmountInput
                          value={recipe.yields}
                          unit="tortas"
                          onSave={(v) => updateRecipeYields(recipe.id, Math.max(1, Math.round(v)))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-stone-500">
                        {formatCurrency(sectionCost)}/torta
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir receita "${recipe.name}"? Isso remove de todos os produtos.`)) {
                            deleteRecipe(recipe.id);
                          }
                        }}
                        className="text-stone-300 active:text-red-400 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <Card>
                    {recipe.ingredients.length === 0 && (
                      <p className="px-4 py-3 text-sm text-stone-400 italic">
                        Nenhum ingrediente ainda
                      </p>
                    )}
                    {recipe.ingredients.map((ri, i) => {
                      const ing = ingredients.find((x) => x.id === ri.ingredientId);
                      if (!ing) return null;
                      const cost = calcIngredientCostPerTorta(ri, purchases, recipe.yields);
                      const hasPrice = !!getLastPurchase(ri.ingredientId, purchases);

                      return (
                        <div
                          key={ri.ingredientId}
                          className={`flex items-center gap-2 px-4 py-2.5 ${
                            i < recipe.ingredients.length - 1 ? 'border-b border-stone-50' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-700 truncate">{ing.name}</p>
                          </div>
                          <InlineAmountInput
                            value={ri.amount}
                            unit={ing.unit}
                            onSave={(v) => updateRecipeIngredientAmount(recipe.id, ri.ingredientId, v)}
                          />
                          <div className="w-16 text-right shrink-0">
                            {hasPrice ? (
                              <p className="text-xs font-semibold text-stone-600">{formatCurrency(cost)}</p>
                            ) : (
                              <span className="text-xs text-amber-500">sem preço</span>
                            )}
                          </div>
                          <button
                            onClick={() => removeIngredientFromRecipe(recipe.id, ri.ingredientId)}
                            className="text-stone-300 active:text-red-400 transition-colors shrink-0"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setAddIngModal({ recipeId: recipe.id })}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-brand-600 font-medium border-t border-stone-50 active:bg-stone-50 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Adicionar ingrediente
                    </button>
                  </Card>
                </section>
              );
            })}

            {sections.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-sm text-stone-400">Nenhuma receita vinculada</p>
                <button
                  onClick={() => setManageRecipesOpen(true)}
                  className="text-sm text-brand-600 font-medium mt-2"
                >
                  Vincular receitas
                </button>
              </Card>
            )}
          </>
        )}
      </main>

      <AddIngredientModal
        open={addIngModal !== null}
        onClose={() => setAddIngModal(null)}
        recipeId={addIngModal?.recipeId ?? ''}
        ingredients={ingredients}
        usedIds={
          addIngModal
            ? (recipes.find((r) => r.id === addIngModal.recipeId)?.ingredients.map((ri) => ri.ingredientId) ?? [])
            : []
        }
        onAdd={addIngredientToRecipe}
      />
      <NewRecipeModal
        open={newRecipeModal}
        onClose={() => setNewRecipeModal(false)}
        onSave={addRecipe}
      />
      <NewProductModal
        open={newProductModal}
        onClose={() => setNewProductModal(false)}
        recipes={recipes}
        onSave={addProduct}
      />
      <ManageRecipesModal
        open={manageRecipesOpen}
        onClose={() => setManageRecipesOpen(false)}
        product={activeProduct ?? null}
        recipes={recipes}
        onUpdate={updateProductRecipes}
      />
    </>
  );
}
