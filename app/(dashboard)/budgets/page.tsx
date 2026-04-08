'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useBudgets, type Budget, type BudgetFormData } from '@/context/BudgetsContext';
import { useTransactions } from '@/context/TransactionsContext';
import { useCategories } from '@/context/CategoriesContext';
import ToolIcon from '@/components/tools/ToolIcon';
import { TOOL_COLORS } from '@/lib/toolConstants';

/* ── Helpers ─────────────────────────────────────────────── */

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtFull(n: number): string {
  return `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n))}`;
}

function parseCurrencyInput(raw: string): number {
  let s = raw.replace(/[^0-9.,]/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/[,.]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatAmountDisplay(n: number): string {
  if (!n) return '';
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function statusColor(pct: number): string {
  if (pct >= 100) return '#F44336';
  if (pct >= 80)  return '#FF9800';
  return '#4CAF50';
}

/* ── Budget form modal ───────────────────────────────────── */

function BudgetFormModal({
  initial,
  onSave,
  onClose,
  language,
  t,
  categories,
}: {
  initial?: Budget;
  onSave: (data: BudgetFormData) => Promise<void>;
  onClose: () => void;
  language: string;
  t: ReturnType<typeof useLanguage>['t'];
  categories: ReturnType<typeof useCategories>['categories'];
}) {
  const [budgetType, setBudgetType] = useState<'category' | 'total'>(initial?.type ?? 'category');
  const [name, setName]           = useState(initial?.name ?? '');
  const [amountRaw, setAmountRaw] = useState(initial ? formatAmountDisplay(initial.amount) : '');
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? '');
  const [color, setColor]         = useState(initial?.color ?? '#4CAF50');
  const [alertThreshold, setAlertThreshold] = useState(String(initial?.alertThreshold ?? 80));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const expenseCategories = categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const selectedCat = expenseCategories.find((c) => c.name === categoryName);

  async function handleSave() {
    const amount = parseCurrencyInput(amountRaw);
    if (!name.trim()) {
      setError(language === 'es' ? 'El nombre es obligatorio.' : 'Name is required.');
      return;
    }
    if (amount <= 0) {
      setError(language === 'es' ? 'Ingresa un monto válido.' : 'Enter a valid amount.');
      return;
    }
    if (budgetType === 'category' && !categoryName) {
      setError(language === 'es' ? 'Selecciona una categoría.' : 'Select a category.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type: budgetType,
        categoryName: budgetType === 'category' ? categoryName : undefined,
        amount,
        alertThreshold: Number(alertThreshold) || 80,
        alertEnabled: true,
        color,
      });
      onClose();
    } catch {
      setError(language === 'es' ? 'Error al guardar.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {initial ? t.budgets.editBudget : t.budgets.addBudget}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
            {(['category', 'total'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setBudgetType(tp)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={budgetType === tp ? { background: '#4CAF50', color: '#fff' } : { color: 'var(--text-muted)' }}
              >
                {tp === 'category' ? t.budgets.categoryBudget : t.budgets.totalBudget}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{t.budgets.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.budgets.namePlaceholder}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{t.budgets.amount}</label>
            <div className="flex items-center gap-2 h-11 px-3 rounded-xl border" style={{ background: 'var(--bg-subtle)', borderColor: '#4CAF50' }}>
              <span className="font-bold" style={{ color: '#4CAF50' }}>$</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                onBlur={(e) => {
                  const n = parseCurrencyInput(e.target.value);
                  setAmountRaw(n > 0 ? formatAmountDisplay(n) : '');
                }}
                placeholder="0"
                className="flex-1 bg-transparent text-sm outline-none font-semibold"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* Category picker (category type only) */}
          {budgetType === 'category' && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{t.budgets.category}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {expenseCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategoryName(cat.name); if (!name) setName(cat.name); if (cat.color) setColor(cat.color); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                    style={{
                      borderColor: categoryName === cat.name ? cat.color : 'var(--border)',
                      background:  categoryName === cat.name ? cat.color + '18' : 'var(--bg-subtle)',
                    }}
                  >
                    <ToolIcon icon={cat.icon} color={cat.color} size={14} withContainer />
                    <span className="text-center leading-tight line-clamp-2" style={{ color: 'var(--text)', fontSize: '10px' }}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{language === 'es' ? 'Color' : 'Color'}</label>
            <div className="flex flex-wrap gap-2">
              {TOOL_COLORS.slice(0, 24).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background:   c,
                    borderColor:  color === c ? '#fff' : 'transparent',
                    outline:      color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Alert threshold */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              {t.budgets.alertThreshold}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="flex-1 accent-[#4CAF50]"
              />
              <span className="text-sm font-bold w-10 text-right" style={{ color: '#4CAF50' }}>{alertThreshold}%</span>
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: '#F44336' }}>{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
          >
            {saving ? '...' : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirm ─────────────────────────────────────── */

function DeleteConfirm({ onConfirm, onCancel, t }: {
  onConfirm: () => void; onCancel: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-xs rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--bg-card)' }}>
        <p className="text-sm font-semibold text-center mb-5" style={{ color: 'var(--text)' }}>
          {t.budgets.confirmDelete}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-10 rounded-xl border text-sm font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            {t.common.cancel}
          </button>
          <button onClick={onConfirm} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white" style={{ background: '#F44336' }}>
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Budget card ─────────────────────────────────────────── */

function BudgetCard({
  budget,
  spent,
  onEdit,
  onDelete,
  t,
}: {
  budget: Budget;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const pct      = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const color    = budget.color ?? statusColor(pct);
  const barColor = statusColor(pct);
  const remaining = budget.amount - spent;

  return (
    <div
      className="px-4 py-4 rounded-2xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text)' }}>
          {budget.name}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: barColor + '18',
            color: barColor,
          }}
        >
          {pct.toFixed(0)}%
        </span>
        <button onClick={onEdit}   className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}><Pencil size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: '#F44336', background: '#FFEBEE' }}><Trash2 size={13} /></button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-subtle)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
        />
      </div>

      {/* Numbers */}
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--text-muted)' }}>
          {t.budgets.spent}: <span style={{ color: barColor, fontWeight: 600 }}>{fmtFull(spent)}</span>
          {' '}{t.budgets.of}{' '}
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtFull(budget.amount)}</span>
        </span>
        <span style={{ color: remaining >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
          {remaining >= 0 ? t.budgets.remaining : t.budgets.over}: {fmtFull(remaining)}
        </span>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function BudgetsPage() {
  const { language, t } = useLanguage();
  const { budgets, loading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showForm,    setShowForm]    = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const MONTHS = language === 'es' ? MONTHS_ES : MONTHS_EN;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  /* ── Compute spent per budget ───────────────────────────── */
  const periodTx = useMemo(() =>
    transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }),
    [transactions, month, year]
  );

  function computeSpent(budget: Budget): number {
    return periodTx
      .filter((tx) => {
        if (budget.type === 'total') return true;
        if (budget.categoryName) return tx.category === budget.categoryName;
        return true;
      })
      .reduce((s, tx) => s + tx.amount, 0);
  }

  const activeBudgets = budgets.filter((b) => b.isActive);
  const totalBudgeted = activeBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent    = activeBudgets.reduce((s, b) => s + computeSpent(b), 0);
  const totalPct      = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  async function handleSave(data: BudgetFormData) {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await addBudget(data);
    }
  }

  function openEdit(b: Budget) { setEditingBudget(b); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditingBudget(undefined); }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Month navigation */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <button onClick={prevMonth} className="p-2 rounded-xl hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary strip */}
      {activeBudgets.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.budgets.totalBudgeted}</p>
              <p className="text-base font-extrabold" style={{ color: 'var(--text)' }}>{fmtFull(totalBudgeted)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.budgets.totalSpent}</p>
              <p className="text-base font-extrabold" style={{ color: statusColor(totalPct) }}>{fmtFull(totalSpent)}</p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(totalPct, 100)}%`, background: statusColor(totalPct) }}
            />
          </div>
          <p className="text-xs mt-1.5 text-right font-semibold" style={{ color: statusColor(totalPct) }}>
            {totalPct.toFixed(0)}%
          </p>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>{t.common.loading}</div>
      ) : activeBudgets.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t.budgets.noBudgets}</div>
      ) : (
        <div className="space-y-3">
          {activeBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={computeSpent(budget)}
              onEdit={() => openEdit(budget)}
              onDelete={() => setDeletingId(budget.id)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditingBudget(undefined); setShowForm(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
      >
        <Plus size={24} />
      </button>

      {/* Form */}
      {showForm && (
        <BudgetFormModal
          initial={editingBudget}
          onSave={handleSave}
          onClose={closeForm}
          language={language}
          t={t}
          categories={categories}
        />
      )}

      {/* Delete confirm */}
      {deletingId && (
        <DeleteConfirm
          onConfirm={async () => { await deleteBudget(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
          t={t}
        />
      )}
    </div>
  );
}
