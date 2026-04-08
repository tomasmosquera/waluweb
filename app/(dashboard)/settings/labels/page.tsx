'use client';

import React, { useState, useRef } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useLabels } from '@/context/LabelsContext';

export default function LabelsPage() {
  const { language, t } = useLanguage();
  const { labels, addLabel, updateLabel, deleteLabel, reorderLabels } = useLabels();

  const [newInput, setNewInput] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const v = newInput.trim();
    if (!v) return;
    addLabel(v);
    setNewInput('');
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(labels[idx]);
    setTimeout(() => editRef.current?.focus(), 50);
  }

  function commitEdit() {
    if (editingIdx === null) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== labels[editingIdx]) {
      updateLabel(labels[editingIdx], trimmed);
    }
    setEditingIdx(null);
    setEditValue('');
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditValue('');
  }

  function handleMove(idx: number, dir: 'up' | 'down') {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === labels.length - 1) return;
    const next = [...labels];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorderLabels(next);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Add new label */}
      <div
        className="flex gap-2 p-3 rounded-2xl border mb-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder={t.labels.placeholder}
          className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newInput.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Label list */}
      {labels.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.labels.noLabels}
        </div>
      ) : (
        <div className="space-y-2">
          {labels.map((label, idx) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Label tag indicator */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#4CAF50' }}
              />

              {/* Label text or edit input */}
              {editingIdx === idx ? (
                <input
                  ref={editRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 h-8 px-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-subtle)', borderColor: '#4CAF50', color: 'var(--text)' }}
                />
              ) : (
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {label}
                </span>
              )}

              {/* Edit actions */}
              {editingIdx === idx ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={commitEdit}
                    className="p-1.5 rounded-lg"
                    style={{ color: '#4CAF50', background: '#E8F5E9' }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 rounded-lg"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 rounded disabled:opacity-20"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === labels.length - 1}
                      className="p-0.5 rounded disabled:opacity-20"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Edit */}
                  <button
                    onClick={() => startEdit(idx)}
                    className="p-2 rounded-xl"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
                  >
                    <Pencil size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteLabel(label)}
                    className="p-2 rounded-xl"
                    style={{ color: '#F44336', background: '#FFEBEE' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
