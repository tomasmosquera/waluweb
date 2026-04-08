'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

/* ── Types ──────────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  subcategories: string[];
  toolIds: string[];
  sortOrder: number;
  icon: string;
  color: string;
  deviceId: string;
  createdAt: string;
}

export type CategoryFormData = {
  name: string;
  type: 'expense' | 'income';
  subcategories: string[];
  toolIds?: string[];
  sortOrder?: number;
  icon?: string;
  color?: string;
};

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  addCategory: (data: CategoryFormData) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<CategoryFormData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (type: 'expense' | 'income', orderedIds: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────── */

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

/* ── Row mapper ─────────────────────────────────────────── */

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id:             String(row.id),
    name:           String(row.name ?? ''),
    type:           (row.type === 'income' ? 'income' : 'expense') as 'expense' | 'income',
    subcategories:  Array.isArray(row.subcategories) ? (row.subcategories as string[]) : [],
    toolIds:        Array.isArray(row.tool_ids) ? (row.tool_ids as string[]) : [],
    sortOrder:      Number(row.sort_order ?? 0),
    icon:           String(row.icon ?? 'pricetag'),
    color:          String(row.color ?? '#9E9E9E'),
    deviceId:       String(row.device_id ?? ''),
    createdAt:      String(row.created_at ?? new Date().toISOString()),
  };
}

/* ── Provider ────────────────────────────────────────────── */

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchCategories = useCallback(async () => {
    if (!user || isGuest) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories((data ?? []).map(rowToCategory));
    } catch (err) {
      console.error('[categories] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, supabase]);

  /* ── Bootstrap ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    deviceIdRef.current = `web_${user.id}`;
    void fetchCategories();
  }, [user, isGuest, fetchCategories]);

  /* ── Real-time subscription ─────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) return;

    const channel = supabase
      .channel(`categories:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        void fetchCategories();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user, isGuest, supabase, fetchCategories]);

  /* ── CRUD ────────────────────────────────────────────────── */

  const addCategory = useCallback(async (data: CategoryFormData): Promise<Category> => {
    if (!user) throw new Error('Not authenticated');

    const deviceId = deviceIdRef.current ?? `web_${user.id}`;

    // Determine next sort_order for this type
    const maxOrder = categories
      .filter((c) => c.type === data.type)
      .reduce((max, c) => Math.max(max, c.sortOrder), -1);

    const id = `cat_${crypto.randomUUID()}`;

    const row = {
      id,
      device_id:      deviceId,
      name:           data.name.trim(),
      type:           data.type,
      subcategories:  data.subcategories,
      tool_ids:       data.toolIds ?? [],
      sort_order:     data.sortOrder ?? maxOrder + 1,
      icon:           data.icon ?? 'pricetag',
      color:          data.color ?? '#9E9E9E',
      created_at:     new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('categories')
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    const cat = rowToCategory(inserted as Record<string, unknown>);
    setCategories((prev) => [...prev, cat]);
    return cat;
  }, [user, supabase, categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<CategoryFormData>): Promise<void> => {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.name          !== undefined) payload.name          = updates.name.trim();
    if (updates.type          !== undefined) payload.type          = updates.type;
    if (updates.subcategories !== undefined) payload.subcategories = updates.subcategories;
    if (updates.toolIds       !== undefined) payload.tool_ids      = updates.toolIds;
    if (updates.sortOrder     !== undefined) payload.sort_order    = updates.sortOrder;
    if (updates.icon          !== undefined) payload.icon          = updates.icon;
    if (updates.color         !== undefined) payload.color         = updates.color;

    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    if (error) throw error;

    setCategories((prev) =>
      prev.map((c) =>
        c.id !== id ? c : {
          ...c,
          name:          updates.name?.trim()    ?? c.name,
          type:          updates.type            ?? c.type,
          subcategories: updates.subcategories   ?? c.subcategories,
          toolIds:       updates.toolIds         ?? c.toolIds,
          sortOrder:     updates.sortOrder       ?? c.sortOrder,
          icon:          updates.icon            ?? c.icon,
          color:         updates.color           ?? c.color,
        }
      )
    );
  }, [supabase]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, [supabase]);

  const reorderCategories = useCallback(async (
    type: 'expense' | 'income',
    orderedIds: string[]
  ): Promise<void> => {
    // Optimistic update
    setCategories((prev) => {
      const updated = [...prev];
      orderedIds.forEach((id, idx) => {
        const i = updated.findIndex((c) => c.id === id);
        if (i !== -1) updated[i] = { ...updated[i], sortOrder: idx };
      });
      return updated;
    });

    // Persist each sort_order
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase
          .from('categories')
          .update({ sort_order: idx, updated_at: new Date().toISOString() })
          .eq('id', id)
      )
    );
  }, [supabase]);

  const value = useMemo<CategoriesContextType>(() => ({
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: fetchCategories,
  }), [categories, loading, addCategory, updateCategory, deleteCategory, reorderCategories, fetchCategories]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}
