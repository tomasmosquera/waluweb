'use client';

import React from 'react';
import { Menu, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const THEME_CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  function cycleTheme() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
    setTheme(next);
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 h-14 border-b flex-shrink-0"
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Mobile menu button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
          title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          {language === 'es' ? 'ESP' : 'ENG'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-xl border transition-colors"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={16} />
        </button>
      </div>
    </header>
  );
}
