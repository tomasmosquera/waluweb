'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLanguage } from '@/context/LanguageContext';

function usePageTitle() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname === '/') return t.nav.home;
  if (pathname.startsWith('/transactions')) return t.nav.transactions;
  if (pathname.startsWith('/reports')) return t.nav.reports;
  if (pathname.startsWith('/budgets')) return t.nav.budgets;
  if (pathname === '/settings/categories') return t.categories.title;
  if (pathname === '/settings/labels')     return t.labels.title;
  if (pathname === '/settings/profile')    return t.settings.profile;
  if (pathname === '/settings/security')   return t.settings.security;
  if (pathname === '/settings/appearance') return t.settings.appearance;
  if (pathname.startsWith('/settings'))    return t.nav.settings;
  return 'Walu';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          title={title}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
