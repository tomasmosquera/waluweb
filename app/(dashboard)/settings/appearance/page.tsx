'use client';

import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { Theme } from '@/lib/types';
import type { Language } from '@/lib/types';

export default function AppearancePage() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const THEMES: Array<{ id: Theme; label: string; icon: React.ReactNode }> = [
    { id: 'light',  label: t.settings.themeLight,  icon: <Sun  size={18} /> },
    { id: 'dark',   label: t.settings.themeDark,   icon: <Moon size={18} /> },
    { id: 'system', label: t.settings.themeSystem, icon: <Monitor size={18} /> },
  ];

  const LANGUAGES: Array<{ id: Language; label: string; sub: string }> = [
    { id: 'es', label: 'Español', sub: 'ESP' },
    { id: 'en', label: 'English', sub: 'ENG' },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Theme */}
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {t.settings.theme}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ id, label, icon }) => {
            const active = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: active ? '#4CAF50' : 'var(--border)',
                  background:  active ? '#E8F5E9' : 'var(--bg-subtle)',
                  color:       active ? '#4CAF50' : 'var(--text-muted)',
                }}
              >
                {icon}
                <span className="text-xs font-semibold">{label}</span>
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {t.settings.language}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(({ id, label, sub }) => {
            const active = language === id;
            return (
              <button
                key={id}
                onClick={() => setLanguage(id)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: active ? '#4CAF50' : 'var(--border)',
                  background:  active ? '#E8F5E9' : 'var(--bg-subtle)',
                }}
              >
                <span
                  className="text-sm font-extrabold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: active ? '#4CAF50' : 'var(--bg-card)',
                    color:      active ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {sub}
                </span>
                <span className="text-sm font-semibold" style={{ color: active ? '#2E7D32' : 'var(--text)' }}>
                  {label}
                </span>
                {active && <Check size={14} style={{ color: '#4CAF50', marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
