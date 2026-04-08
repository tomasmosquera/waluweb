'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function ComingSoon({ phase }: { phase: number }) {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-5xl">🚧</div>
      <div className="text-center">
        <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
          {language === 'es' ? `Disponible en Fase ${phase}` : `Available in Phase ${phase}`}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {language === 'es' ? 'Esta sección está en construcción.' : 'This section is under construction.'}
        </p>
      </div>
    </div>
  );
}
