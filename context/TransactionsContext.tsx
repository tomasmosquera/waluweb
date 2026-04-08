'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

/* ── Types ──────────────────────────────────────────────── */

export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  date: string;
  note: string;
  toolId: string;
  toToolId?: string;
  category?: string;
  subcategory?: string;
  label?: string;
  tabShare?: number; // destination amount for cross-currency transfers
  deviceId: string;
}

export type TransactionFormData = {
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  toolId: string;
  toToolId?: string;
  tabShare?: number;
  category?: string;
  subcategory?: string;
  label?: string;
  note: string;
  date: string;
};

interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (data: TransactionFormData) => Promise<Transaction>;
  updateTransaction: (id: string, old: Transaction, data: TransactionFormData) => Promise<void>;
  deleteTransaction: (tx: Transaction) => Promise<void>;
  refetch: () => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────── */

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

/* ── Row mapper ─────────────────────────────────────────── */

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id:          String(row.id),
    type:        String(row.type ?? 'expense') as Transaction['type'],
    amount:      Number(row.amount ?? 0),
    date:        String(row.date ?? new Date().toISOString()),
    note:        String(row.note ?? ''),
    toolId:      String(row.tool_id ?? ''),
    toToolId:    row.to_tool_id   ? String(row.to_tool_id)   : undefined,
    category:    row.category     ? String(row.category)     : undefined,
    subcategory: row.subcategory  ? String(row.subcategory)  : undefined,
    label:       row.label        ? String(row.label)        : undefined,
    tabShare:    row.tab_share != null ? Number(row.tab_share) : undefined,
    deviceId:    String(row.device_id ?? ''),
  };
}

/* ── Balance is computed client-side from initialBalance + transactions ── */
/* No Supabase balance column mutations needed from the web ─────────────── */

/* ── Provider ────────────────────────────────────────────── */

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchTransactions = useCallback(async () => {
    if (!user || isGuest) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    try {
      const PAGE = 1000;
      let from = 0;
      let all: Transaction[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .range(from, from + PAGE - 1);

        if (error) throw error;

        const rows = (data ?? []).map(rowToTransaction);
        all = [...all, ...rows];

        if (rows.length < PAGE) break; // no more pages
        from += PAGE;
      }

      setTransactions(all);
    } catch (err) {
      console.error('[transactions] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, supabase]);

  /* ── Bootstrap ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    deviceIdRef.current = `web_${user.id}`;
    void fetchTransactions();
  }, [user, isGuest, fetchTransactions]);

  /* ── Real-time ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) return;
    const channel = supabase
      .channel(`transactions:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        void fetchTransactions();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, isGuest, supabase, fetchTransactions]);

  /* ── Add ────────────────────────────────────────────────── */
  const addTransaction = useCallback(async (data: TransactionFormData): Promise<Transaction> => {
    if (!user) throw new Error('Not authenticated');
    const deviceId = deviceIdRef.current ?? `web_${user.id}`;
    const id = `tx_${crypto.randomUUID()}`;

    const row = {
      id,
      device_id:    deviceId,
      type:         data.type,
      amount:       data.amount,
      date:         data.date,
      note:         data.note ?? '',
      tool_id:      data.toolId,
      to_tool_id:   data.toToolId   ?? null,
      tab_share:    data.tabShare   ?? null,
      category:     data.category   ?? null,
      subcategory:  data.subcategory ?? null,
      label:        data.label      ?? null,
      installments: 1,
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert(row)
      .select()
      .single();
    if (error) throw error;

    const tx = rowToTransaction(inserted as Record<string, unknown>);
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }, [user, supabase]);

  /* ── Update ─────────────────────────────────────────────── */
  const updateTransaction = useCallback(async (
    id: string,
    old: Transaction,
    data: TransactionFormData
  ): Promise<void> => {
    const payload = {
      type:        data.type,
      amount:      data.amount,
      date:        data.date,
      note:        data.note ?? '',
      tool_id:     data.toolId,
      to_tool_id:  data.toToolId   ?? null,
      tab_share:   data.tabShare   ?? null,
      category:    data.category   ?? null,
      subcategory: data.subcategory ?? null,
      label:       data.label      ?? null,
      updated_at:  new Date().toISOString(),
    };

    const { error } = await supabase.from('transactions').update(payload).eq('id', id);
    if (error) throw error;

    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id !== id ? tx : {
          ...tx,
          type:        data.type,
          amount:      data.amount,
          date:        data.date,
          note:        data.note ?? '',
          toolId:      data.toolId,
          toToolId:    data.toToolId,
          tabShare:    data.tabShare,
          category:    data.category,
          subcategory: data.subcategory,
          label:       data.label,
        }
      )
    );
  }, [supabase]);

  /* ── Delete ─────────────────────────────────────────────── */
  const deleteTransaction = useCallback(async (tx: Transaction): Promise<void> => {
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (error) throw error;

    setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
  }, [supabase]);

  const value = useMemo<TransactionsContextType>(() => ({
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }), [transactions, loading, addTransaction, updateTransaction, deleteTransaction, fetchTransactions]);

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider');
  return ctx;
}
