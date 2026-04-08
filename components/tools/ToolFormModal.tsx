'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import type { Tool, ToolFormData } from '@/context/ToolsContext';
import { useTools } from '@/context/ToolsContext';
import { useLanguage } from '@/context/LanguageContext';
import ToolIcon from './ToolIcon';
import {
  ALL_TOOL_TYPES, TOOL_COLORS, TOOL_ICONS, TOOL_TYPE_META,
  DEFAULT_TOOL_COLOR, DEFAULT_TOOL_ICON, DEFAULT_CURRENCY,
  type ToolType,
} from '@/lib/toolConstants';
import { CURRENCIES, parseBalanceInput, formatAmount } from '@/lib/currencies';

interface Props {
  open: boolean;
  onClose: () => void;
  /** If provided, we're editing an existing tool */
  tool?: Tool;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function ToolFormModal({ open, onClose, tool }: Props) {
  const { addTool, updateTool } = useTools();
  const { language } = useLanguage();
  const isEditing = !!tool;
  const es = language === 'es';

  /* ── Form state ─────────────────────────────────────────── */
  const [name,          setName]          = useState('');
  const [type,          setType]          = useState<ToolType>('Banks');
  const [balanceRaw,    setBalanceRaw]    = useState('');
  const [color,         setColor]         = useState(DEFAULT_TOOL_COLOR);
  const [icon,          setIcon]          = useState(DEFAULT_TOOL_ICON);
  const [currency,      setCurrency]      = useState(DEFAULT_CURRENCY);
  const [statementDate, setStatementDate] = useState<number | undefined>();
  const [dueDate,       setDueDate]       = useState<number | undefined>();
  const [reminders,     setReminders]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [tab,           setTab]           = useState<'info' | 'color' | 'icon'>('info');

  /* ── Seed form when editing ─────────────────────────────── */
  useEffect(() => {
    if (open) {
      if (tool) {
        setName(tool.name);
        setType(tool.type as ToolType);
        setBalanceRaw(String(tool.initialBalance ?? tool.balance));
        setColor(tool.color);
        setIcon(tool.icon);
        setCurrency(tool.currency ?? DEFAULT_CURRENCY);
        setStatementDate(tool.statementDate);
        setDueDate(tool.dueDate);
        setReminders(tool.reminders ?? false);
      } else {
        setName(''); setType('Banks');
        setBalanceRaw('0'); setColor(DEFAULT_TOOL_COLOR);
        setIcon(DEFAULT_TOOL_ICON); setCurrency(DEFAULT_CURRENCY);
        setStatementDate(undefined); setDueDate(undefined);
        setReminders(false);
      }
      setError(''); setTab('info');
    }
  }, [open, tool]);

  /* ── Apply type defaults when type changes (create mode) ── */
  useEffect(() => {
    if (!isEditing) {
      const meta = TOOL_TYPE_META[type];
      setColor(meta.defaultColor);
      setIcon(meta.defaultIcon);
    }
  }, [type, isEditing]);

  if (!open) return null;

  const isCreditCard = type === 'Credit Cards';
  const isLiability  = type === 'Liabilities';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(es ? 'El nombre es obligatorio.' : 'Name is required.');
      setTab('info');
      return;
    }

    const balance = parseBalanceInput(balanceRaw);
    if (!isFinite(balance)) {
      setError(es ? 'El saldo no es válido.' : 'Invalid balance.');
      setTab('info');
      return;
    }

    const data: ToolFormData = {
      name, type, balance, color, icon, currency,
      statementDate: isCreditCard ? statementDate : undefined,
      dueDate: (isCreditCard || isLiability) ? dueDate : undefined,
      reminders,
    };

    setSaving(true);
    try {
      if (isEditing && tool) {
        await updateTool(tool.id, data);
      } else {
        await addTool(data);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (es ? 'Ocurrió un error.' : 'An error occurred.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <ToolIcon icon={icon} color={color} size={18} containerSize={40} />
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  {isEditing
                    ? (es ? 'Editar cuenta' : 'Edit account')
                    : (es ? 'Nueva cuenta' : 'New account')}
                </h2>
                {name && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{name}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {(['info', 'color', 'icon'] as const).map((t) => {
              const labels = {
                info:  es ? 'Info'   : 'Info',
                color: es ? 'Color'  : 'Color',
                icon:  es ? 'Ícono'  : 'Icon',
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-3 text-sm font-semibold transition-colors"
                  style={{
                    color: tab === t ? '#4CAF50' : 'var(--text-muted)',
                    borderBottom: tab === t ? '2px solid #4CAF50' : '2px solid transparent',
                  }}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* ── INFO TAB ── */}
              {tab === 'info' && (
                <>
                  {/* Name */}
                  <Field label={es ? 'Nombre' : 'Name'} required>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={es ? 'Ej: Bancolombia Ahorros' : 'E.g. Savings Account'}
                      className="w-full px-3 h-11 rounded-xl text-sm border outline-none"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </Field>

                  {/* Type */}
                  <Field label={es ? 'Tipo' : 'Type'} required>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ToolType)}
                        className="w-full px-3 h-11 rounded-xl text-sm border outline-none appearance-none pr-10"
                        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        {ALL_TOOL_TYPES.filter((t) => t !== 'Tabs').map((t) => (
                          <option key={t} value={t}>{translateType(t, es)}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Field>

                  {/* Balance */}
                  <Field label={es ? 'Saldo inicial' : 'Initial balance'} required>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="h-11 px-3 rounded-xl text-sm border outline-none appearance-none pr-7"
                          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={balanceRaw}
                        onChange={(e) => setBalanceRaw(e.target.value)}
                        placeholder="0"
                        className="flex-1 px-3 h-11 rounded-xl text-sm border outline-none"
                        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    {balanceRaw && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        = {formatAmount(parseBalanceInput(balanceRaw), currency)}
                      </p>
                    )}
                  </Field>

                  {/* Credit Card fields */}
                  {isCreditCard && (
                    <>
                      <Field label={es ? 'Día de corte (1–31)' : 'Statement day (1–31)'}>
                        <DaySelect value={statementDate} onChange={setStatementDate} es={es} />
                      </Field>
                      <Field label={es ? 'Día de pago (1–31)' : 'Due day (1–31)'}>
                        <DaySelect value={dueDate} onChange={setDueDate} es={es} />
                      </Field>
                    </>
                  )}

                  {/* Liability due day */}
                  {isLiability && (
                    <Field label={es ? 'Día de vencimiento (1–31)' : 'Due day (1–31)'}>
                      <DaySelect value={dueDate} onChange={setDueDate} es={es} />
                    </Field>
                  )}

                  {/* Reminders */}
                  {(isCreditCard || isLiability) && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setReminders((v) => !v)}
                        className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                        style={{ background: reminders ? '#4CAF50' : 'var(--bg-subtle)', border: `1px solid ${reminders ? '#4CAF50' : 'var(--border)'}` }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                          style={{ left: reminders ? '18px' : '2px' }}
                        />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {es ? 'Activar recordatorios' : 'Enable reminders'}
                      </span>
                    </label>
                  )}
                </>
              )}

              {/* ── COLOR TAB ── */}
              {tab === 'color' && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                    {es ? 'Selecciona un color' : 'Select a color'}
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {TOOL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                        style={{
                          background: c,
                          outline: color === c ? `3px solid #4CAF50` : '3px solid transparent',
                          outlineOffset: 1,
                          border: c === '#FFFFFF' ? '1px solid var(--border)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── ICON TAB ── */}
              {tab === 'icon' && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                    {es ? 'Selecciona un ícono' : 'Select an icon'}
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {TOOL_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: icon === ic ? color : 'var(--bg-subtle)',
                          outline: icon === ic ? `2px solid ${color}` : '2px solid transparent',
                        }}
                        title={ic}
                      >
                        <ToolIcon
                          icon={ic}
                          color={icon === ic ? color : 'var(--text-muted)'}
                          size={18}
                          withContainer={false}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mb-2 p-3 rounded-xl text-sm border" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl text-sm font-semibold border transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
              >
                {es ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
              >
                {saving
                  ? <Loader2 size={16} className="animate-spin" />
                  : isEditing
                    ? (es ? 'Guardar cambios' : 'Save changes')
                    : (es ? 'Crear cuenta' : 'Create account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
        {required && <span style={{ color: '#F44336' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function DaySelect({ value, onChange, es }: { value: number | undefined; onChange: (v: number | undefined) => void; es: boolean }) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="w-full px-3 h-11 rounded-xl text-sm border outline-none appearance-none"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <option value="">{es ? 'Sin establecer' : 'Not set'}</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}

function translateType(type: ToolType, es: boolean): string {
  const map: Record<ToolType, [string, string]> = {
    Banks:          ['Bancos',          'Banks'],
    Cash:           ['Efectivo',        'Cash'],
    'Credit Cards': ['Tarjetas de crédito', 'Credit Cards'],
    Tabs:           ['Tabs compartidos', 'Shared Tabs'],
    Investments:    ['Inversiones',     'Investments'],
    Savings:        ['Ahorros',         'Savings'],
    Assets:         ['Activos',         'Assets'],
    Liabilities:    ['Pasivos',         'Liabilities'],
    Others:         ['Otros',           'Others'],
  };
  return es ? map[type][0] : map[type][1];
}
