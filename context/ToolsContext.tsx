'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { ToolType } from '@/lib/toolConstants';
import { DEFAULT_CURRENCY } from '@/lib/toolConstants';

/* ── Types ──────────────────────────────────────────────── */

export interface Tool {
  id: string;
  name: string;
  type: ToolType;
  balance: number;
  initialBalance: number;
  color: string;
  icon: string;
  currency: string;
  statementDate?: number;
  dueDate?: number;
  reminders?: boolean;
  archived?: boolean;
  fullyArchived?: boolean;
  sharedId?: string;
  connectionStatus?: string;
  peerId?: string;
  deviceId: string;
  createdAt: string;
}

export type ToolFormData = {
  name: string;
  type: ToolType;
  balance: number;
  color: string;
  icon: string;
  currency: string;
  statementDate?: number;
  dueDate?: number;
  reminders?: boolean;
};

interface ToolsContextType {
  tools: Tool[];
  loading: boolean;
  addTool: (data: ToolFormData) => Promise<Tool>;
  updateTool: (id: string, updates: Partial<ToolFormData>) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
  archiveTool: (id: string) => Promise<void>;
  unarchiveTool: (id: string) => Promise<void>;
  fullyArchiveTool: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────── */

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

/* ── Row mapper ─────────────────────────────────────────── */

function rowToTool(row: Record<string, unknown>): Tool {
  return {
    id:             String(row.id),
    name:           String(row.name ?? ''),
    type:           String(row.type ?? 'Others') as ToolType,
    balance:        Number(row.balance ?? 0),
    initialBalance: row.initial_balance != null ? Number(row.initial_balance) : Number(row.balance ?? 0),
    color:          String(row.color ?? '#2196F3'),
    icon:           String(row.icon ?? 'wallet'),
    currency:       String(row.currency ?? DEFAULT_CURRENCY),
    statementDate:  row.statement_date != null ? Number(row.statement_date) : undefined,
    dueDate:        row.due_date != null ? Number(row.due_date) : undefined,
    reminders:      row.reminders != null ? Boolean(row.reminders) : undefined,
    archived:       Boolean(row.archived),
    fullyArchived:  Boolean(row.fully_archived),
    sharedId:       row.shared_id != null ? String(row.shared_id) : undefined,
    connectionStatus: row.connection_status != null ? String(row.connection_status) : undefined,
    peerId:         row.peer_id != null ? String(row.peer_id) : undefined,
    deviceId:       String(row.device_id ?? ''),
    createdAt:      String(row.created_at ?? new Date().toISOString()),
  };
}

/* ── Device registration ─────────────────────────────────── */

async function ensureWebDevice(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  const deviceId = `web_${userId}`;

  const { data } = await supabase
    .from('devices')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (!data) {
    await supabase.from('devices').insert({
      device_id:    deviceId,
      user_id:      userId,
      device_name:  'Walu Web',
      os_version:   typeof window !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'web',
      last_seen_at: new Date().toISOString(),
    });
  } else {
    await supabase
      .from('devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('device_id', deviceId);
  }

  return deviceId;
}

/* ── Provider ────────────────────────────────────────────── */

export function ToolsProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);

  /* ── Fetch all tools for this user ─────────────────────── */
  const fetchTools = useCallback(async () => {
    if (!user || isGuest) {
      setTools([]);
      setLoading(false);
      return;
    }

    try {
      // RLS automatically scopes to the current user's devices
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTools((data ?? []).map(rowToTool));
    } catch (err) {
      console.error('[tools] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, supabase]);

  /* ── Bootstrap: device + initial fetch ─────────────────── */
  useEffect(() => {
    if (!user || isGuest) {
      setTools([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    ensureWebDevice(supabase, user.id)
      .then((deviceId) => { deviceIdRef.current = deviceId; })
      .catch((err) => console.error('[tools] device registration error:', err))
      .finally(() => fetchTools());
  }, [user, isGuest, supabase, fetchTools]);

  /* ── Real-time subscription ─────────────────────────────── */
  useEffect(() => {
    if (!user || isGuest) return;

    const channel = supabase
      .channel(`tools:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tools' }, () => {
        void fetchTools();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user, isGuest, supabase, fetchTools]);

  /* ── CRUD ────────────────────────────────────────────────── */

  const addTool = useCallback(async (data: ToolFormData): Promise<Tool> => {
    if (!user) throw new Error('Not authenticated');

    const deviceId = deviceIdRef.current ?? `web_${user.id}`;
    const id = `tool_${crypto.randomUUID()}`;

    const row = {
      id,
      device_id:       deviceId,
      name:            data.name.trim(),
      type:            data.type,
      balance:         data.balance,
      initial_balance: data.balance,
      color:           data.color,
      icon:            data.icon,
      currency:        data.currency,
      statement_date:  data.statementDate ?? null,
      due_date:        data.dueDate ?? null,
      reminders:       data.reminders ?? false,
      archived:        false,
      fully_archived:  false,
      connection_status: 'none',
      created_at:      new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('tools')
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    const tool = rowToTool(inserted as Record<string, unknown>);
    setTools((prev) => [...prev, tool]);
    return tool;
  }, [user, supabase]);

  const updateTool = useCallback(async (id: string, updates: Partial<ToolFormData>): Promise<void> => {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.name        !== undefined) payload.name            = updates.name.trim();
    if (updates.type        !== undefined) payload.type            = updates.type;
    if (updates.balance     !== undefined) { payload.initial_balance = updates.balance; }
    if (updates.color       !== undefined) payload.color           = updates.color;
    if (updates.icon        !== undefined) payload.icon            = updates.icon;
    if (updates.currency    !== undefined) payload.currency        = updates.currency;
    if (updates.statementDate !== undefined) payload.statement_date = updates.statementDate ?? null;
    if (updates.dueDate     !== undefined) payload.due_date        = updates.dueDate ?? null;
    if (updates.reminders   !== undefined) payload.reminders       = updates.reminders;

    const { error } = await supabase.from('tools').update(payload).eq('id', id);
    if (error) throw error;

    setTools((prev) =>
      prev.map((t) =>
        t.id !== id ? t : {
          ...t,
          ...updates,
          initialBalance: updates.balance ?? t.initialBalance,
          balance: updates.balance ?? t.balance,
        }
      )
    );
  }, [supabase]);

  const archiveTool = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('tools')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setTools((prev) => prev.map((t) => t.id === id ? { ...t, archived: true } : t));
  }, [supabase]);

  const unarchiveTool = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('tools')
      .update({ archived: false, fully_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setTools((prev) => prev.map((t) => t.id === id ? { ...t, archived: false, fullyArchived: false } : t));
  }, [supabase]);

  const fullyArchiveTool = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('tools')
      .update({ archived: true, fully_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setTools((prev) => prev.map((t) => t.id === id ? { ...t, archived: true, fullyArchived: true } : t));
  }, [supabase]);

  const deleteTool = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('tools').delete().eq('id', id);
    if (error) throw error;
    setTools((prev) => prev.filter((t) => t.id !== id));
  }, [supabase]);

  const value = useMemo<ToolsContextType>(() => ({
    tools,
    loading,
    addTool,
    updateTool,
    deleteTool,
    archiveTool,
    unarchiveTool,
    fullyArchiveTool,
    refetch: fetchTools,
  }), [tools, loading, addTool, updateTool, deleteTool, archiveTool, unarchiveTool, fullyArchiveTool, fetchTools]);

  return <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>;
}

export function useTools() {
  const ctx = useContext(ToolsContext);
  if (!ctx) throw new Error('useTools must be used within ToolsProvider');
  return ctx;
}
