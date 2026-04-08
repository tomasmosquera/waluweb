'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/* ── Types ──────────────────────────────────────────────── */

interface LabelsContextType {
  labels: string[];
  addLabel: (label: string) => void;
  updateLabel: (oldLabel: string, newLabel: string) => void;
  deleteLabel: (label: string) => void;
  reorderLabels: (orderedLabels: string[]) => void;
}

/* ── Context ─────────────────────────────────────────────── */

const LabelsContext = createContext<LabelsContextType | undefined>(undefined);

/* ── Provider ────────────────────────────────────────────── */

export function LabelsProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();

  const storageKey = useMemo(
    () => (user && !isGuest ? `labels_${user.id}` : 'labels_guest'),
    [user, isGuest]
  );

  const [labels, setLabels] = useState<string[]>([]);

  // Load from localStorage on mount / when user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setLabels(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setLabels([]);
    }
  }, [storageKey]);

  // Persist whenever labels change
  const save = useCallback((next: string[]) => {
    setLabels(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  const addLabel = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setLabels((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  const updateLabel = useCallback((oldLabel: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setLabels((prev) => {
      const next = prev.map((l) => (l === oldLabel ? trimmed : l));
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  const deleteLabel = useCallback((label: string) => {
    setLabels((prev) => {
      const next = prev.filter((l) => l !== label);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  const reorderLabels = useCallback((orderedLabels: string[]) => {
    save(orderedLabels);
  }, [save]);

  const value = useMemo<LabelsContextType>(() => ({
    labels,
    addLabel,
    updateLabel,
    deleteLabel,
    reorderLabels,
  }), [labels, addLabel, updateLabel, deleteLabel, reorderLabels]);

  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

export function useLabels() {
  const ctx = useContext(LabelsContext);
  if (!ctx) throw new Error('useLabels must be used within LabelsProvider');
  return ctx;
}
