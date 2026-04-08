'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

/* ── Types ──────────────────────────────────────────────── */

export interface Budget {
  id: string;
  name: string;
  type: 'category' | 'total';
  categoryName?: string;
  subcategoryName?: string;
  toolIds: string[];
  amount: number;
  period: 'monthly';
  alertThreshold: number;
  alertEnabled: boolean;
  isActive: boolean;
  color?: string;
  icon?: string;
  deviceId: string;
  createdAt: string;
}

export type BudgetFormData = {
  name: string;
  type: 'category' | 'total';
  categoryName?: string;
  subcategoryName?: string;
  toolIds?: string[];
  amount: number;
  alertThreshold?: number;
  alertEnabled?: boolean;
  color?: string;
  icon?: string;
};

interface BudgetsContextType {
  budgets: Budget[];
  loading: boolean;
  addBudget: (data: BudgetFormData) => Promise<Budget>;
  updateBudget: (id: string, data: BudgetFormData) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────── */

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

/* ── Row mapper ─────────────────────────────────────────── */

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id:               String(row.id),
    name:             String(row.name ?? ''),
    type:             String(row.type ?? 'category') as 'category' | 'total',
    categoryName:     row.category_name    ? String(row.category_name)    : undefined,
    subcategoryName:  row.subcategory_name ? String(row.subcategory_name) : undefined,
    toolIds:          Array.isArray(row.tool_ids) ? (row.tool_ids as string[]) : [],
    amount:           Number(row.amount ?? 0),
    period:           'monthly',
    alertThreshold:   Number(row.alert_threshold ?? 80),
    alertEnabled:     Boolean(row.alert_enabled ?? true),
    isActive:         Boolean(row.is_active ?? true),
    color:            row.color ? String(row.color) : undefined,
    icon:             row.icon  ? String(row.icon)  : undefined,
    deviceId:         String(row.device_id ?? ''),
    createdAt:        String(row.created_at ?? new Date().toISOString()),
  };
}

/* ── Provider ────────────────────────────────────────────── */

export function BudgetsProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchBudgets = useCallback(async () => {
    if (!user || isGuest) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setBudgets((data ?? []).map(rowToBudget));
    } catch (err) {
      console.error('[budgets] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, supabase]);

  /* ── Bootstrap ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    deviceIdRef.current = `web_${user.id}`;
    void fetchBudgets();
  }, [user, isGuest, fetchBudgets]);

  /* ── Real-time ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) return;
    const channel = supabase
      .channel(`budgets:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
        void fetchBudgets();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, isGuest, supabase, fetchBudgets]);

  /* ── Add ────────────────────────────────────────────────── */
  const addBudget = useCallback(async (data: BudgetFormData): Promise<Budget> => {
    if (!user) throw new Error('Not authenticated');
    const deviceId = deviceIdRef.current ?? `web_${user.id}`;
    const id = `budget_${crypto.randomUUID()}`;

    const row = {
      id,
      device_id:        deviceId,
      name:             data.name.trim(),
      type:             data.type,
      category_name:    data.categoryName    ?? null,
      subcategory_name: data.subcategoryName ?? null,
      tool_ids:         data.toolIds         ?? [],
      amount:           data.amount,
      period:           'monthly',
      alert_threshold:  data.alertThreshold  ?? 80,
      alert_enabled:    data.alertEnabled    ?? true,
      is_active:        true,
      color:            data.color           ?? null,
      icon:             data.icon            ?? null,
      monthly_history:  [],
      created_at:       new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('budgets')
      .insert(row)
      .select()
      .single();
    if (error) throw error;

    const budget = rowToBudget(inserted as Record<string, unknown>);
    setBudgets((prev) => [...prev, budget]);
    return budget;
  }, [user, supabase]);

  /* ── Update ─────────────────────────────────────────────── */
  const updateBudget = useCallback(async (id: string, data: BudgetFormData): Promise<void> => {
    const payload = {
      name:             data.name.trim(),
      type:             data.type,
      category_name:    data.categoryName    ?? null,
      subcategory_name: data.subcategoryName ?? null,
      tool_ids:         data.toolIds         ?? [],
      amount:           data.amount,
      alert_threshold:  data.alertThreshold  ?? 80,
      alert_enabled:    data.alertEnabled    ?? true,
      color:            data.color           ?? null,
      icon:             data.icon            ?? null,
    };

    const { error } = await supabase.from('budgets').update(payload).eq('id', id);
    if (error) throw error;

    setBudgets((prev) =>
      prev.map((b) =>
        b.id !== id ? b : {
          ...b,
          name:            data.name.trim(),
          type:            data.type,
          categoryName:    data.categoryName,
          subcategoryName: data.subcategoryName,
          toolIds:         data.toolIds ?? [],
          amount:          data.amount,
          alertThreshold:  data.alertThreshold ?? 80,
          alertEnabled:    data.alertEnabled ?? true,
          color:           data.color,
          icon:            data.icon,
        }
      )
    );
  }, [supabase]);

  /* ── Delete ─────────────────────────────────────────────── */
  const deleteBudget = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, [supabase]);

  const value = useMemo<BudgetsContextType>(() => ({
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  }), [budgets, loading, addBudget, updateBudget, deleteBudget, fetchBudgets]);

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetsProvider');
  return ctx;
}
