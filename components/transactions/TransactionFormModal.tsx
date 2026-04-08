'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTools, type Tool } from '@/context/ToolsContext';
import { useCategories, type Category } from '@/context/CategoriesContext';
import { useLabels } from '@/context/LabelsContext';
import { type Transaction, type TransactionFormData } from '@/context/TransactionsContext';
import ToolIcon from '@/components/tools/ToolIcon';

/* ── Helpers ─────────────────────────────────────────────── */

function parseCurrencyInput(raw: string): number {
  let s = raw.replace(/[^0-9.,]/g, '');
  // If comma is the decimal separator (Colombian: e.g. "34,50")
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/[,.]/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatAmountDisplay(n: number): string {
  if (!n) return '';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── Account dropdown ────────────────────────────────────── */

function AccountDropdown({
  label,
  tools,
  value,
  onChange,
  exclude,
  t,
}: {
  label: string;
  tools: Tool[];
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = tools.find((t) => t.id === value);
  const options = tools.filter((t) => !t.fullyArchived && t.id !== exclude);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-11 flex items-center gap-2 px-3 rounded-xl border text-sm font-medium"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        {selected ? (
          <>
            <ToolIcon icon={selected.icon} color={selected.color} size={14} withContainer={false} />
            <span className="flex-1 text-left truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
            {t.transactions.account}...
          </span>
        )}
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-auto"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', maxHeight: '220px' }}
        >
          {options.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => { onChange(tool.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:opacity-80 transition-opacity"
              style={{
                background: tool.id === value ? '#4CAF5012' : 'transparent',
                color: 'var(--text)',
              }}
            >
              <ToolIcon icon={tool.icon} color={tool.color} size={14} withContainer={false} />
              <span className="flex-1 text-left truncate">{tool.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tool.balance)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Category picker ─────────────────────────────────────── */

function CategoryPicker({
  categories,
  type,
  value,
  onChange,
  t,
}: {
  categories: Category[];
  type: 'expense' | 'income';
  value: string;
  onChange: (name: string) => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const filtered = categories.filter((c) => c.type === type).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
        {t.transactions.category}
      </label>
      <div className="grid grid-cols-4 gap-1.5">
        {/* No category option */}
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
          style={{
            borderColor: !value ? '#4CAF50' : 'var(--border)',
            background: !value ? '#E8F5E9' : 'var(--bg-subtle)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="text-xs leading-tight text-center" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            {t.transactions.noCategory}
          </span>
        </button>

        {filtered.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.name)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
            style={{
              borderColor: value === cat.name ? cat.color : 'var(--border)',
              background: value === cat.name ? cat.color + '18' : 'var(--bg-subtle)',
            }}
          >
            <ToolIcon icon={cat.icon} color={cat.color} size={14} withContainer />
            <span
              className="text-xs leading-tight text-center line-clamp-2"
              style={{ color: 'var(--text)', fontSize: '10px' }}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main modal ──────────────────────────────────────────── */

interface Props {
  initial?: Transaction;
  defaultType?: 'expense' | 'income' | 'transfer';
  onSave: (data: TransactionFormData) => Promise<void>;
  onClose: () => void;
}

const TYPE_OPTIONS: Array<{ id: 'expense' | 'income' | 'transfer'; color: string }> = [
  { id: 'expense',  color: '#F44336' },
  { id: 'income',   color: '#4CAF50' },
  { id: 'transfer', color: '#2196F3' },
];

export default function TransactionFormModal({ initial, defaultType = 'expense', onSave, onClose }: Props) {
  const { language, t } = useLanguage();
  const { tools } = useTools();
  const { categories } = useCategories();
  const { labels } = useLabels();

  const activeTool = tools.filter((t) => !t.fullyArchived);

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(initial?.type ?? defaultType);
  const [amountRaw, setAmountRaw] = useState(initial ? formatAmountDisplay(initial.amount) : '');
  const [toolId, setToolId] = useState(initial?.toolId ?? activeTool[0]?.id ?? '');
  const [toToolId, setToToolId] = useState(initial?.toToolId ?? '');
  const [tabShareRaw, setTabShareRaw] = useState(initial?.tabShare ? formatAmountDisplay(initial.tabShare) : '');
  const [sameAmount, setSameAmount] = useState(!initial?.tabShare);
  const [category, setCategory] = useState(initial?.category ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(
    initial ? initial.date.slice(0, 10) : todayISO()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 100);
  }, []);

  // Reset category/subcategory when type changes
  useEffect(() => {
    if (type === 'transfer') {
      setCategory('');
      setSubcategory('');
    }
  }, [type]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategory('');
  }, [category]);

  const selectedCategory = categories.find((c) => c.name === category && c.type === (type as 'expense' | 'income'));
  const hasSubs = (selectedCategory?.subcategories.length ?? 0) > 0;

  const fromTool = tools.find((t) => t.id === toolId);
  const toTool   = tools.find((t) => t.id === toToolId);
  const showExchangeRate = type === 'transfer' && fromTool && toTool && fromTool.currency !== toTool.currency;

  const accentColor = TYPE_OPTIONS.find((o) => o.id === type)?.color ?? '#4CAF50';

  async function handleSave() {
    setError('');
    const amount = parseCurrencyInput(amountRaw);
    if (amount <= 0) {
      setError(language === 'es' ? 'Ingresa un monto válido.' : 'Enter a valid amount.');
      return;
    }
    if (!toolId) {
      setError(language === 'es' ? 'Selecciona una cuenta.' : 'Select an account.');
      return;
    }
    if (type === 'transfer' && !toToolId) {
      setError(language === 'es' ? 'Selecciona la cuenta destino.' : 'Select destination account.');
      return;
    }

    const tabShare = (type === 'transfer' && !sameAmount && tabShareRaw)
      ? parseCurrencyInput(tabShareRaw)
      : undefined;

    setSaving(true);
    try {
      await onSave({
        type,
        amount,
        toolId,
        toToolId:    type === 'transfer' ? toToolId : undefined,
        tabShare,
        category:    type !== 'transfer' ? (category || undefined) : undefined,
        subcategory: type !== 'transfer' ? (subcategory || undefined) : undefined,
        label:       label || undefined,
        note,
        date,
      });
      onClose();
    } catch {
      setError(language === 'es' ? 'Error al guardar.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = (id: string) => {
    if (id === 'expense')  return t.transactions.expense;
    if (id === 'income')   return t.transactions.income;
    return t.transactions.transfer;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)', maxHeight: '95vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {initial ? t.transactions.editTransaction : t.transactions.addTransaction}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
          {TYPE_OPTIONS.map(({ id, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
              style={type === id ? {
                background: color,
                borderColor: color,
                color: '#fff',
              } : {
                background: 'var(--bg-subtle)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {typeLabel(id)}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div
            className="flex items-center gap-2 h-16 px-4 rounded-2xl border"
            style={{ borderColor: accentColor, background: `${accentColor}0A` }}
          >
            <span className="text-2xl font-bold" style={{ color: accentColor }}>$</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
              onBlur={(e) => {
                const n = parseCurrencyInput(e.target.value);
                setAmountRaw(n > 0 ? formatAmountDisplay(n) : '');
              }}
              placeholder="0"
              className="flex-1 bg-transparent text-2xl font-bold outline-none"
              style={{ color: accentColor }}
            />
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* From account */}
          <AccountDropdown
            label={type === 'transfer' ? t.transactions.fromAccount : t.transactions.account}
            tools={activeTool}
            value={toolId}
            onChange={setToolId}
            exclude={type === 'transfer' ? toToolId : undefined}
            t={t}
          />

          {/* To account (transfer only) */}
          {type === 'transfer' && (
            <>
              <AccountDropdown
                label={t.transactions.toAccount}
                tools={activeTool}
                value={toToolId}
                onChange={setToToolId}
                exclude={toolId}
                t={t}
              />

              {/* Destination amount (different currencies) */}
              {showExchangeRate && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    {t.transactions.destinationAmount}
                  </label>
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setSameAmount((v) => !v)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border font-medium"
                      style={{
                        background: sameAmount ? '#2196F318' : 'var(--bg-subtle)',
                        borderColor: sameAmount ? '#2196F3' : 'var(--border)',
                        color: sameAmount ? '#2196F3' : 'var(--text-muted)',
                      }}
                    >
                      {t.transactions.sameAsSent}
                    </button>
                    {!sameAmount && (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tabShareRaw}
                        onChange={(e) => setTabShareRaw(e.target.value)}
                        onBlur={(e) => {
                          const n = parseCurrencyInput(e.target.value);
                          setTabShareRaw(n > 0 ? formatAmountDisplay(n) : '');
                        }}
                        placeholder="0"
                        className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Category (expense/income only) */}
          {type !== 'transfer' && (
            <CategoryPicker
              categories={categories}
              type={type}
              value={category}
              onChange={setCategory}
              t={t}
            />
          )}

          {/* Subcategory */}
          {type !== 'transfer' && hasSubs && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                {t.transactions.subcategory}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSubcategory('')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    background: !subcategory ? '#4CAF5018' : 'var(--bg-subtle)',
                    borderColor: !subcategory ? '#4CAF50' : 'var(--border)',
                    color: !subcategory ? '#4CAF50' : 'var(--text-muted)',
                  }}
                >
                  {t.transactions.noCategory}
                </button>
                {selectedCategory?.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategory(sub)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{
                      background: subcategory === sub ? (selectedCategory.color + '18') : 'var(--bg-subtle)',
                      borderColor: subcategory === sub ? selectedCategory.color : 'var(--border)',
                      color: subcategory === sub ? selectedCategory.color : 'var(--text-muted)',
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Label */}
          {labels.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                {t.transactions.label}
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value="">{t.transactions.noLabel}</option>
                {labels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              {t.transactions.note}
              <span className="ml-1 font-normal">({t.transactions.optional})</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'es' ? 'Descripción...' : 'Description...'}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              {t.transactions.date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          {error && (
            <p className="text-xs font-medium" style={{ color: '#F44336' }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
          >
            {saving ? '...' : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
