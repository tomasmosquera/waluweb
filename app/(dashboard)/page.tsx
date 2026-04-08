'use client';

import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw, Archive, Trash2, Pencil, ArchiveRestore, EyeOff, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { useTools, type Tool } from '@/context/ToolsContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ToolIcon from '@/components/tools/ToolIcon';
import ToolFormModal from '@/components/tools/ToolFormModal';
import { formatAmount } from '@/lib/currencies';
import { ALL_TOOL_TYPES, OUT_OF_MONTRACKER, type ToolType } from '@/lib/toolConstants';

/* ── Translations ────────────────────────────────────────── */
const TYPE_LABEL: Record<ToolType, [string, string]> = {
  Banks:          ['Bancos',               'Banks'],
  Cash:           ['Efectivo',             'Cash'],
  'Credit Cards': ['Tarjetas de crédito',  'Credit Cards'],
  Tabs:           ['Tabs compartidos',     'Shared Tabs'],
  Investments:    ['Inversiones',          'Investments'],
  Savings:        ['Ahorros',              'Savings'],
  Assets:         ['Activos',              'Assets'],
  Liabilities:    ['Pasivos',              'Liabilities'],
  Others:         ['Otros',                'Others'],
};

/* ── Balance helpers ─────────────────────────────────────── */
function formatBalance(amount: number, currency: string): string {
  return formatAmount(amount, currency, false);
}

function balanceColor(amount: number): string {
  return amount >= 0 ? '#2E7D32' : '#C62828';
}

/* ── Main page ───────────────────────────────────────────── */
export default function HomePage() {
  const { profile, isGuest } = useAuth();
  const { tools, loading, refetch, deleteTool, archiveTool, unarchiveTool, fullyArchiveTool } = useTools();
  const { language } = useLanguage();
  const es = language === 'es';

  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTool,   setEditingTool]   = useState<Tool | undefined>();
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showArchived,  setShowArchived]  = useState(false);
  const [showHidden,    setShowHidden]    = useState(false);

  /* ── Derived data ─────────────────────────────────────────── */
  const { activeTools, archivedTools, hiddenTools, totalBalance } = useMemo(() => {
    const active   = tools.filter((t) => t.id !== OUT_OF_MONTRACKER && !t.archived && !t.fullyArchived);
    const archived = tools.filter((t) => t.archived && !t.fullyArchived);
    const hidden   = tools.filter((t) => t.fullyArchived);

    const totalBalance = active.reduce((acc, t) => {
      return t.currency === 'COP' ? acc + t.balance : acc;
    }, 0);

    return { activeTools: active, archivedTools: archived, hiddenTools: hidden, totalBalance };
  }, [tools]);

  const groupedTools = useMemo(() => {
    const groups: Partial<Record<ToolType, Tool[]>> = {};
    for (const tool of activeTools) {
      const key = tool.type as ToolType;
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(tool);
    }
    return groups;
  }, [activeTools]);

  const orderedTypes = ALL_TOOL_TYPES.filter((t) => groupedTools[t]?.length);

  /* ── Handlers ─────────────────────────────────────────────── */
  function openCreate() { setEditingTool(undefined); setModalOpen(true); }
  function openEdit(tool: Tool) { setEditingTool(tool); setModalOpen(true); }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deleteTool(id); }
    catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  function toggleGroup(type: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin" style={{ color: '#4CAF50' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Balance header ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: '#4CAF50' }}
      >
        <p className="text-base font-semibold opacity-80 mb-1">
          {es ? 'Patrimonio neto (COP)' : 'Net worth (COP)'}
        </p>
        <p className="text-4xl font-extrabold tracking-tight">
          {formatBalance(totalBalance, 'COP')}
        </p>

        {/* CTA */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            <Plus size={16} />
            {es ? 'Nueva cuenta' : 'New account'}
          </button>
          <button
            onClick={refetch}
            className="p-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            title={es ? 'Actualizar' : 'Refresh'}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Guest mode notice ──────────────────────────────── */}
      {isGuest && (
        <div className="rounded-xl p-4 text-sm border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          {es
            ? 'Estás en modo invitado. Tus datos no se guardan en la nube.'
            : 'You\'re in guest mode. Data is not saved to the cloud.'}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────── */}
      {activeTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#E8F5E9' }}>
            <span className="text-3xl">🏦</span>
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              {es ? 'No hay cuentas aún' : 'No accounts yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {es ? 'Crea tu primera cuenta para empezar.' : 'Create your first account to get started.'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
          >
            <Plus size={16} />
            {es ? 'Crear cuenta' : 'Create account'}
          </button>
        </div>
      )}

      {/* ── Account groups ─────────────────────────────────── */}
      {orderedTypes.map((type) => {
        const groupTools = groupedTools[type] ?? [];
        const isCollapsed = collapsedGroups.has(type);
        const groupBalance = groupTools.reduce((acc, t) => t.currency === 'COP' ? acc + t.balance : acc, 0);
        const typeLabel = es ? TYPE_LABEL[type][0] : TYPE_LABEL[type][1];

        return (
          <section key={type}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(type)}
              className="flex items-center justify-between w-full mb-2 group"
            >
              <div className="flex items-center gap-2">
                {isCollapsed
                  ? <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown  size={14} style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {typeLabel}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  {groupTools.length}
                </span>
              </div>
              <span className="text-base font-bold" style={{ color: balanceColor(groupBalance) }}>
                {formatBalance(groupBalance, 'COP')}
              </span>
            </button>

            {/* Tool cards */}
            {!isCollapsed && (
              <div className="space-y-2">
                {groupTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    es={es}
                    onEdit={() => openEdit(tool)}
                    onDelete={() => handleDelete(tool.id)}
                    onArchive={() => archiveTool(tool.id)}
                    onHide={() => fullyArchiveTool(tool.id)}
                    deleting={deletingId === tool.id}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* ── Archivadas (archived=true, fullyArchived=false) ─── */}
      {archivedTools.length > 0 && (
        <section>
          <button onClick={() => setShowArchived((v) => !v)} className="flex items-center gap-2 mb-2">
            {showArchived ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {es ? 'Archivadas' : 'Archived'} ({archivedTools.length})
            </span>
          </button>
          {showArchived && (
            <div className="space-y-2">
              {archivedTools.map((tool) => (
                <SecondaryToolCard
                  key={tool.id}
                  tool={tool}
                  es={es}
                  actionIcon={<ArchiveRestore size={15} />}
                  actionLabel={es ? 'Desarchivar' : 'Unarchive'}
                  actionColor="#4CAF50"
                  onAction={() => unarchiveTool(tool.id)}
                  onDelete={() => handleDelete(tool.id)}
                  deleting={deletingId === tool.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Ocultas (fullyArchived=true) ────────────────────── */}
      {hiddenTools.length > 0 && (
        <section>
          <button onClick={() => setShowHidden((v) => !v)} className="flex items-center gap-2 mb-2">
            {showHidden ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {es ? 'Ocultas' : 'Hidden'} ({hiddenTools.length})
            </span>
          </button>
          {showHidden && (
            <div className="space-y-2">
              {hiddenTools.map((tool) => (
                <SecondaryToolCard
                  key={tool.id}
                  tool={tool}
                  es={es}
                  actionIcon={<Eye size={15} />}
                  actionLabel={es ? 'Mostrar' : 'Unhide'}
                  actionColor="#1976D2"
                  onAction={() => unarchiveTool(tool.id)}
                  onDelete={() => handleDelete(tool.id)}
                  deleting={deletingId === tool.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── FAB ────────────────────────────────────────────── */}
      {activeTools.length > 0 && (
        <button
          onClick={openCreate}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-30 transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
          title={es ? 'Nueva cuenta' : 'New account'}
        >
          <Plus size={24} />
        </button>
      )}

      {/* ── Modal ──────────────────────────────────────────── */}
      <ToolFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTool(undefined); }}
        tool={editingTool}
      />
    </div>
  );
}

/* ── Tool Card ───────────────────────────────────────────── */
function ToolCard({
  tool, es, onEdit, onDelete, onArchive, onHide, deleting,
}: {
  tool: Tool;
  es: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onHide: () => void;
  deleting: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [confirming,  setConfirming]  = useState(false);

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border transition-all"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <ToolIcon icon={tool.icon} color={tool.color} size={20} containerSize={44} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{tool.name}</p>
        {tool.currency !== 'COP' && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tool.currency}</p>
        )}
      </div>

      <div className="text-right mr-2">
        <p className="font-bold text-sm" style={{ color: balanceColor(tool.balance) }}>
          {formatBalance(tool.balance, tool.currency)}
        </p>
        {tool.currency !== 'COP' && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatBalance(tool.balance, tool.currency)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={() => setShowActions((v) => !v)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)', background: showActions ? 'var(--bg-subtle)' : 'transparent' }}
        >
          <span className="text-lg leading-none">···</span>
        </button>

        {showActions && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => { setShowActions(false); setConfirming(false); }} />
            <div
              className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg py-1 min-w-36"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <ActionBtn icon={<Pencil size={14} />} label={es ? 'Editar' : 'Edit'} onClick={() => { onEdit(); setShowActions(false); }} />
              <ActionBtn icon={<Archive size={14} />} label={es ? 'Archivar' : 'Archive'} onClick={() => { onArchive(); setShowActions(false); }} />
              <ActionBtn icon={<EyeOff size={14} />} label={es ? 'Ocultar' : 'Hide'} onClick={() => { onHide(); setShowActions(false); }} />
              {!confirming ? (
                <ActionBtn
                  icon={<Trash2 size={14} />}
                  label={es ? 'Eliminar' : 'Delete'}
                  danger
                  onClick={() => setConfirming(true)}
                />
              ) : (
                <button
                  onClick={() => { onDelete(); setShowActions(false); setConfirming(false); }}
                  disabled={deleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold"
                  style={{ color: '#C62828' }}
                >
                  {deleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {es ? '¿Confirmar?' : 'Confirm?'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Secondary Tool Card (Archivadas / Ocultas) ──────────── */
function SecondaryToolCard({
  tool, es, actionIcon, actionLabel, actionColor, onAction, onDelete, deleting,
}: {
  tool: Tool;
  es: boolean;
  actionIcon: React.ReactNode;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border opacity-60"
      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
    >
      <ToolIcon icon={tool.icon} color={tool.color} size={16} containerSize={34} />
      <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{tool.name}</p>
      <button onClick={onAction} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ color: actionColor, background: `${actionColor}18` }} title={actionLabel}>
        {actionIcon}
        {actionLabel}
      </button>
      <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg" style={{ color: '#C62828' }} title={es ? 'Eliminar' : 'Delete'}>
        {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

/* ── Action Button ───────────────────────────────────────── */
function ActionBtn({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-subtle)]"
      style={{ color: danger ? '#C62828' : 'var(--text)' }}
    >
      {icon}
      {label}
    </button>
  );
}
