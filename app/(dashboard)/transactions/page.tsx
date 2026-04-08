'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTransactions, type Transaction } from '@/context/TransactionsContext';
import { useTools } from '@/context/ToolsContext';
import { useCategories } from '@/context/CategoriesContext';
import ToolIcon from '@/components/tools/ToolIcon';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';
import type { TransactionFormData } from '@/context/TransactionsContext';

/* ── Helpers ─────────────────────────────────────────────── */

function formatAmount(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

function formatMonthYear(year: number, month: number, language: string): string {
  const d = new Date(year, month, 1);
  const parts = new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    month: 'long', year: 'numeric',
  }).formatToParts(d);
  return parts.map((p) => {
    if (p.type === 'month') return p.value.charAt(0).toUpperCase() + p.value.slice(1);
    return p.value;
  }).join('');
}

function formatDateHeader(dateStr: string, language: string, today: string, yesterday: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const todayStr  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const yestDate  = new Date(now); yestDate.setDate(yestDate.getDate() - 1);
  const yestStr   = `${yestDate.getFullYear()}-${String(yestDate.getMonth()+1).padStart(2,'0')}-${String(yestDate.getDate()).padStart(2,'0')}`;
  if (dateStr === todayStr) return today;
  if (dateStr === yestStr)  return yesterday;
  const parts = new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).formatToParts(date);
  return parts.map((p) => {
    if (p.type === 'weekday' || p.type === 'month')
      return p.value.charAt(0).toUpperCase() + p.value.slice(1);
    return p.value;
  }).join('');
}

/* ── Delete confirm ─────────────────────────────────────── */

function DeleteConfirm({
  onConfirm,
  onCancel,
  t,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-xs rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--bg-card)' }}>
        <p className="text-sm font-semibold text-center mb-5" style={{ color: 'var(--text)' }}>
          {t.transactions.confirmDelete}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#F44336' }}
          >
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Transaction card ────────────────────────────────────── */

function TxCard({
  tx,
  toolName,
  toolIcon,
  toolColor,
  catIcon,
  catColor,
  onEdit,
  onDelete,
  t,
}: {
  tx: Transaction;
  toolName: string;
  toolIcon: string;
  toolColor: string;
  catIcon?: string;
  catColor?: string;
  onEdit: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const isExpense  = tx.type === 'expense';
  const isTransfer = tx.type === 'transfer';
  const amountColor = isTransfer ? '#2196F3' : isExpense ? '#F44336' : '#4CAF50';
  const prefix      = isExpense ? '-' : isTransfer ? '' : '+';
  const icon   = catIcon   ?? (isTransfer ? 'swap-horizontal' : isExpense ? 'trending-down' : 'trending-up');
  const color  = catColor  ?? (isTransfer ? '#2196F3'         : isExpense ? '#F44336'       : '#4CAF50');
  const title  = tx.note || tx.category || (isTransfer ? t.transactions.transfer : tx.type);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <ToolIcon icon={icon} color={color} size={18} withContainer />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
          {title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {toolName}
          {tx.subcategory ? ` · ${tx.subcategory}` : ''}
          {tx.label ? ` · ${tx.label}` : ''}
        </p>
      </div>

      <span className="text-sm font-bold flex-shrink-0" style={{ color: amountColor }}>
        {prefix}${formatAmount(tx.amount)}
      </span>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg"
          style={{ color: '#F44336', background: '#FFEBEE' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

type FilterType = 'all' | 'expense' | 'income' | 'transfer';

export default function TransactionsPage() {
  const { language, t } = useLanguage();
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { tools } = useTools();
  const { categories } = useCategories();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm,   setShowForm]   = useState(false);
  const [editingTx,  setEditingTx]  = useState<Transaction | undefined>(undefined);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  /* ── Filter to current month ────────────────────────────── */
  const monthTx = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [transactions, month, year]);

  const filtered = useMemo(() => {
    if (filter === 'all') return monthTx;
    return monthTx.filter((tx) => tx.type === filter);
  }, [monthTx, filter]);

  /* ── Summary ────────────────────────────────────────────── */
  const totalIncome   = useMemo(() => monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalExpense  = useMemo(() => monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const netBalance    = totalIncome - totalExpense;

  /* ── Group by date ──────────────────────────────────────── */
  const grouped = useMemo(() => {
    const g: Record<string, Transaction[]> = {};
    [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((tx) => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!g[key]) g[key] = [];
        g[key].push(tx);
      });
    return g;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  /* ── Lookup helpers ─────────────────────────────────────── */
  function getTool(id: string) { return tools.find((t) => t.id === id); }
  function getCat(name?: string, type?: string) {
    if (!name) return undefined;
    return categories.find((c) => c.name === name && c.type === type);
  }

  /* ── Handlers ───────────────────────────────────────────── */
  async function handleSave(data: TransactionFormData) {
    if (editingTx) {
      await updateTransaction(editingTx.id, editingTx, data);
    } else {
      await addTransaction(data);
    }
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTx(undefined);
  }

  const FILTER_OPTIONS: Array<{ id: FilterType; label: string; color: string }> = [
    { id: 'all',      label: t.transactions.all,      color: '#607D8B' },
    { id: 'expense',  label: t.transactions.expense,  color: '#F44336' },
    { id: 'income',   label: t.transactions.income,   color: '#4CAF50' },
    { id: 'transfer', label: t.transactions.transfer, color: '#2196F3' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Month navigation */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {formatMonthYear(year, month, language)}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.transactions.totalIncome,  value: totalIncome,  color: '#4CAF50', prefix: '+' },
          { label: t.transactions.totalExpense, value: totalExpense, color: '#F44336', prefix: '-' },
          { label: t.transactions.balance,      value: netBalance,   color: netBalance >= 0 ? '#4CAF50' : '#F44336', prefix: netBalance >= 0 ? '+' : '-' },
        ].map(({ label, value, color, prefix }) => (
          <div
            key={label}
            className="rounded-2xl p-3 border text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>
              {prefix}${formatAmount(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {FILTER_OPTIONS.map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={filter === id ? {
              background: color,
              borderColor: color,
              color: '#fff',
            } : {
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>{t.common.loading}</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.transactions.noTransactions}
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((dateStr) => {
            const dayTxs = grouped[dateStr];
            const dayTotal = dayTxs.reduce((s, tx) => {
              if (tx.type === 'income')   return s + tx.amount;
              if (tx.type === 'expense')  return s - tx.amount;
              return s;
            }, 0);

            return (
              <div key={dateStr}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatDateHeader(dateStr, language, t.transactions.today, t.transactions.yesterday)}
                  </span>
                  {filter === 'all' && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: dayTotal >= 0 ? '#4CAF50' : '#F44336' }}
                    >
                      {dayTotal >= 0 ? '+' : '-'}${formatAmount(dayTotal)}
                    </span>
                  )}
                </div>

                {/* Transactions */}
                <div className="space-y-2">
                  {dayTxs.map((tx) => {
                    const tool = getTool(tx.toolId);
                    const cat  = getCat(tx.category, tx.type);
                    return (
                      <TxCard
                        key={tx.id}
                        tx={tx}
                        toolName={tool?.name ?? tx.toolId}
                        toolIcon={tool?.icon ?? 'wallet'}
                        toolColor={tool?.color ?? '#607D8B'}
                        catIcon={cat?.icon}
                        catColor={cat?.color}
                        onEdit={() => openEdit(tx)}
                        onDelete={() => setDeletingTx(tx)}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditingTx(undefined); setShowForm(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
      >
        <Plus size={24} />
      </button>

      {/* Form modal */}
      {showForm && (
        <TransactionFormModal
          initial={editingTx}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {/* Delete confirm */}
      {deletingTx && (
        <DeleteConfirm
          onConfirm={async () => {
            await deleteTransaction(deletingTx);
            setDeletingTx(null);
          }}
          onCancel={() => setDeletingTx(null)}
          t={t}
        />
      )}
    </div>
  );
}
