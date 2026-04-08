'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type Category, type CategoryFormData } from '@/context/CategoriesContext';
import ToolIcon from '@/components/tools/ToolIcon';
import { TOOL_COLORS, TOOL_ICONS } from '@/lib/toolConstants';

/* ── Modal tabs ─────────────────────────────────────────── */
type ModalTab = 'info' | 'color' | 'icon';

const DEFAULT_COLOR = '#9E9E9E';
const DEFAULT_ICON  = 'pricetag';

/* ── Category modal ─────────────────────────────────────── */
function CategoryModal({
  initial,
  categoryType,
  onSave,
  onClose,
  language,
  t,
}: {
  initial?: Category;
  categoryType: 'expense' | 'income';
  onSave: (data: CategoryFormData) => Promise<void>;
  onClose: () => void;
  language: string;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [tab, setTab] = useState<ModalTab>('info');
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [icon, setIcon] = useState(initial?.icon ?? DEFAULT_ICON);
  const [subcategories, setSubcategories] = useState<string[]>(initial?.subcategories ?? []);
  const [subInput, setSubInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  function addSub() {
    const v = subInput.trim();
    if (!v || subcategories.includes(v)) return;
    setSubcategories((p) => [...p, v]);
    setSubInput('');
  }

  function removeSub(sub: string) {
    setSubcategories((p) => p.filter((s) => s !== sub));
  }

  async function handleSave() {
    if (!name.trim()) { setError(language === 'es' ? 'El nombre es obligatorio.' : 'Name is required.'); return; }
    setSaving(true);
    try {
      await onSave({ name, type: categoryType, subcategories, icon, color });
      onClose();
    } catch {
      setError(language === 'es' ? 'Error al guardar.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'info',  label: language === 'es' ? 'Info'  : 'Info'  },
    { id: 'color', label: t.categories.color },
    { id: 'icon',  label: t.categories.icon  },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {initial ? t.categories.editCategory : t.categories.addCategory}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Preview strip */}
        <div className="flex items-center gap-3 px-5 pb-3">
          <ToolIcon icon={icon} color={color} size={20} withContainer />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {name || (language === 'es' ? 'Sin nombre' : 'Unnamed')}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: categoryType === 'expense' ? '#FFEBEE' : '#E8F5E9',
              color:      categoryType === 'expense' ? '#B71C1C' : '#1B5E20',
            }}
          >
            {categoryType === 'expense' ? t.categories.expense : t.categories.income}
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex border-b px-5" style={{ borderColor: 'var(--border)' }}>
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className="mr-4 pb-2 text-sm font-semibold border-b-2 transition-colors"
              style={{
                borderColor: tab === tb.id ? '#4CAF50' : 'transparent',
                color: tab === tb.id ? '#4CAF50' : 'var(--text-muted)',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: '50vh' }}>
          {/* ── Info ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {t.categories.name}
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.categories.namePlaceholder}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {t.categories.subcategories}
                </label>

                {/* Existing tags */}
                {subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {subcategories.map((sub) => (
                      <span
                        key={sub}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        {sub}
                        <button
                          onClick={() => removeSub(sub)}
                          className="ml-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }}
                    placeholder={t.categories.subcategoryPlaceholder}
                    className="flex-1 h-9 px-3 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={addSub}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#4CAF50', color: '#fff' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#F44336' }}>{error}</p>
              )}
            </div>
          )}

          {/* ── Color ── */}
          {tab === 'color' && (
            <div className="grid grid-cols-8 gap-2">
              {TOOL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background:   c,
                    borderColor:  color === c ? '#fff' : 'transparent',
                    outline:      color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Icon ── */}
          {tab === 'icon' && (
            <div className="grid grid-cols-8 gap-2">
              {TOOL_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
                  style={{
                    background:  icon === ic ? color : 'var(--bg-subtle)',
                    borderColor: icon === ic ? color : 'transparent',
                  }}
                >
                  <ToolIcon
                    icon={ic}
                    color={icon === ic ? '#fff' : 'var(--text-muted)'}
                    size={17}
                    withContainer={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
          >
            {saving ? '...' : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
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
      <div
        className="w-full max-w-xs rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--bg-card)' }}
      >
        <p className="text-sm font-semibold text-center mb-5" style={{ color: 'var(--text)' }}>
          {t.categories.confirmDelete}
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

/* ── Main page ──────────────────────────────────────────── */
export default function CategoriesPage() {
  const { language, t } = useLanguage();
  const { categories, loading, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = categories
    .filter((c) => c.type === activeTab)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function subCount(c: Category) {
    const n = c.subcategories.length;
    if (n === 0) return '';
    return `${n} ${n === 1 ? t.categories.subcategory : t.categories.subcategories_plural}`;
  }

  async function handleMove(id: string, dir: 'up' | 'down') {
    const idx = filtered.findIndex((c) => c.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === filtered.length - 1) return;

    const swapped = [...filtered];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    [swapped[idx], swapped[target]] = [swapped[target], swapped[idx]];
    await reorderCategories(activeTab, swapped.map((c) => c.id));
  }

  async function handleDelete(id: string) {
    await deleteCategory(id);
    setDeletingId(null);
  }

  async function handleSave(data: CategoryFormData) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await addCategory(data);
    }
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setShowModal(true);
  }

  function openAdd() {
    setEditingCategory(undefined);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCategory(undefined);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 mb-5 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {(['expense', 'income'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === tab ? {
              background: tab === 'expense' ? '#F44336' : '#4CAF50',
              color: '#fff',
            } : {
              color: 'var(--text-muted)',
            }}
          >
            {tab === 'expense' ? t.categories.expense : t.categories.income}
          </button>
        ))}
      </div>

      {/* Category list */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          {t.common.loading}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.categories.noCategories}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Icon */}
              <ToolIcon icon={cat.icon} color={cat.color} size={18} withContainer />

              {/* Name + subcategories */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {cat.name}
                </p>
                {cat.subcategories.length > 0 && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {subCount(cat)}
                  </p>
                )}
              </div>

              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(cat.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 rounded disabled:opacity-20"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(cat.id, 'down')}
                  disabled={idx === filtered.length - 1}
                  className="p-0.5 rounded disabled:opacity-20"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Edit */}
              <button
                onClick={() => openEdit(cat)}
                className="p-2 rounded-xl"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
              >
                <Pencil size={15} />
              </button>

              {/* Delete */}
              <button
                onClick={() => setDeletingId(cat.id)}
                className="p-2 rounded-xl"
                style={{ color: '#F44336', background: '#FFEBEE' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <CategoryModal
          initial={editingCategory}
          categoryType={activeTab}
          onSave={handleSave}
          onClose={closeModal}
          language={language}
          t={t}
        />
      )}

      {/* Delete confirm */}
      {deletingId && (
        <DeleteConfirm
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          t={t}
        />
      )}
    </div>
  );
}
