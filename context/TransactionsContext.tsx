'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTools } from '@/context/ToolsContext';

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

/* ── Connected Tab projection ────────────────────────────── */

function roundSplit(v: number): number {
  return Math.round(v * 100) / 100;
}

interface ConnectedEntry {
  id: string;
  sharedId: string;
  status: string;
  entryKind: string;
  effectiveDate: string;
  note: string;
  proposedAmount: number;
  finalAmount?: number;
  proposerShare?: number;
  counterpartyShare?: number;
  createdByUserId: string;
  settlementDirection?: string;
}

interface ConnectedEntryUserData {
  entryId: string;
  userId: string;
  settlementToolId?: string;
  category?: string;
  subcategory?: string;
  label?: string;
}

function rowToEntry(row: Record<string, unknown>): ConnectedEntry {
  return {
    id:                  String(row.id),
    sharedId:            String(row.shared_id ?? ''),
    status:              String(row.status ?? ''),
    entryKind:           String(row.entry_kind ?? 'expense'),
    effectiveDate:       String(row.effective_date ?? row.created_at ?? new Date().toISOString()),
    note:                String(row.note ?? ''),
    proposedAmount:      Number(row.proposed_amount ?? 0),
    finalAmount:         row.final_amount != null ? Number(row.final_amount) : undefined,
    proposerShare:       row.proposer_share != null ? Number(row.proposer_share) : undefined,
    counterpartyShare:   row.counterparty_share != null ? Number(row.counterparty_share) : undefined,
    createdByUserId:     String(row.created_by_user_id ?? ''),
    settlementDirection: row.settlement_direction ? String(row.settlement_direction) : undefined,
  };
}

function rowToEntryUserData(row: Record<string, unknown>): ConnectedEntryUserData {
  return {
    entryId:         String(row.entry_id),
    userId:          String(row.user_id),
    settlementToolId: row.settlement_tool_id ? String(row.settlement_tool_id) : undefined,
    category:        row.category   ? String(row.category)   : undefined,
    subcategory:     row.subcategory ? String(row.subcategory) : undefined,
    label:           row.label      ? String(row.label)      : undefined,
  };
}

function buildProjectedTransactions(
  entries: ConnectedEntry[],
  userDataMap: Map<string, ConnectedEntryUserData>,
  userId: string,
  tabToolBySharedId: Map<string, string>, // sharedId -> toolId
): Transaction[] {
  const result: Transaction[] = [];

  for (const entry of entries) {
    if (entry.status !== 'approved') continue;
    const tabToolId = tabToolBySharedId.get(entry.sharedId);
    if (!tabToolId) continue;

    const localData = userDataMap.get(`${entry.id}:${userId}`);
    const isProposer = entry.createdByUserId === userId;
    const amount = roundSplit(entry.finalAmount ?? entry.proposedAmount);
    const hasExplicitSplit = entry.proposerShare != null && entry.counterpartyShare != null;

    if (entry.entryKind === 'settlement') {
      // Settlement: affects real bank account (settlementToolId) and tab tool
      if (!localData?.settlementToolId || !entry.settlementDirection) continue;

      const proposerPays = entry.settlementDirection === 'to_tab';
      const localPays = isProposer ? proposerPays : !proposerPays;

      result.push({
        id:       `proj-${entry.id}-${userId}`,
        type:     'transfer',
        amount,
        date:     entry.effectiveDate,
        note:     entry.note,
        toolId:   localPays ? localData.settlementToolId : tabToolId,
        toToolId: localPays ? tabToolId : localData.settlementToolId,
        deviceId: userId,
      });
    } else {
      // Expense entry: affects tab tool
      let entryAmount = amount;
      if (hasExplicitSplit) {
        entryAmount = isProposer
          ? roundSplit(entry.proposerShare ?? amount)
          : roundSplit(entry.counterpartyShare ?? amount);
      }

      result.push({
        id:          `proj-${entry.id}-${userId}`,
        type:        'expense',
        amount:      entryAmount,
        date:        entry.effectiveDate,
        note:        entry.note,
        toolId:      tabToolId,
        category:    localData?.category,
        subcategory: localData?.subcategory,
        label:       localData?.label,
        deviceId:    userId,
      });
    }
  }

  return result;
}

/* ── Provider ────────────────────────────────────────────── */

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const { tools } = useTools();
  const supabase = useMemo(() => createClient(), []);

  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [projectedTransactions, setProjectedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);

  /* ── Derive tab tool map from tools ─────────────────────── */
  const tabToolBySharedId = useMemo(() => {
    const map = new Map<string, string>();
    for (const tool of tools) {
      if (tool.type === 'Tabs' && tool.sharedId) {
        map.set(tool.sharedId, tool.id);
      }
    }
    return map;
  }, [tools]);

  /* ── Fetch regular transactions ─────────────────────────── */
  const fetchTransactions = useCallback(async () => {
    if (!user || isGuest) {
      setLocalTransactions([]);
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

      setLocalTransactions(all);
    } catch (err) {
      console.error('[transactions] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, supabase]);

  /* ── Fetch connected tab projections ────────────────────── */
  const fetchConnectedTabProjections = useCallback(async () => {
    if (!user || isGuest || tabToolBySharedId.size === 0) {
      setProjectedTransactions([]);
      return;
    }

    try {
      const sharedIds = Array.from(tabToolBySharedId.keys());

      // Fetch all approved entries for the user's Tab tools
      const { data: entriesData, error: entriesError } = await supabase
        .from('connected_tab_entries')
        .select('*')
        .in('shared_id', sharedIds)
        .eq('status', 'approved');

      if (entriesError) throw entriesError;

      const entries = (entriesData ?? []).map(rowToEntry);
      if (entries.length === 0) {
        setProjectedTransactions([]);
        return;
      }

      const entryIds = entries.map((e) => e.id);

      // Fetch user data for current user only
      const { data: userDataRows, error: userDataError } = await supabase
        .from('connected_tab_entry_user_data')
        .select('*')
        .in('entry_id', entryIds)
        .eq('user_id', user.id);

      if (userDataError) throw userDataError;

      const userDataMap = new Map<string, ConnectedEntryUserData>();
      for (const row of (userDataRows ?? []).map(rowToEntryUserData)) {
        userDataMap.set(`${row.entryId}:${row.userId}`, row);
      }

      const projected = buildProjectedTransactions(entries, userDataMap, user.id, tabToolBySharedId);
      setProjectedTransactions(projected);
    } catch (err) {
      console.error('[connected-tabs] projection error:', err);
    }
  }, [user, isGuest, supabase, tabToolBySharedId]);

  /* ── Bootstrap ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) {
      setLocalTransactions([]);
      setProjectedTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    deviceIdRef.current = `web_${user.id}`;
    void fetchTransactions();
  }, [user, isGuest, fetchTransactions]);

  /* ── Re-fetch projections when tab tools change ─────────── */
  useEffect(() => {
    void fetchConnectedTabProjections();
  }, [fetchConnectedTabProjections]);

  /* ── Real-time: regular transactions ────────────────────── */
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

  /* ── Real-time: connected tab entries ───────────────────── */
  useEffect(() => {
    if (!user || isGuest) return;
    const channel = supabase
      .channel(`connected_tab_entries:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connected_tab_entries' }, () => {
        void fetchConnectedTabProjections();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connected_tab_entry_user_data' }, () => {
        void fetchConnectedTabProjections();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, isGuest, supabase, fetchConnectedTabProjections]);

  /* ── Merge local + projected transactions ───────────────── */
  const transactions = useMemo<Transaction[]>(() => {
    const all = [...localTransactions, ...projectedTransactions];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [localTransactions, projectedTransactions]);

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
    setLocalTransactions((prev) => [tx, ...prev]);
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

    setLocalTransactions((prev) =>
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

    setLocalTransactions((prev) => prev.filter((t) => t.id !== tx.id));
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
