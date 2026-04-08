'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  ArrowLeftRight,
  BarChart2,
  PiggyBank,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',              icon: Home,            key: 'home' as const },
  { href: '/transactions',  icon: ArrowLeftRight,  key: 'transactions' as const },
  { href: '/reports',       icon: BarChart2,        key: 'reports' as const },
  { href: '/budgets',       icon: PiggyBank,        key: 'budgets' as const },
  { href: '/settings',      icon: Settings,         key: 'settings' as const },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut, isGuest } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navLabels: Record<typeof NAV_ITEMS[number]['key'], string> = {
    home: t.nav.home,
    transactions: t.nav.transactions,
    reports: t.nav.reports,
    budgets: t.nav.budgets,
    settings: t.nav.settings,
  };

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : isGuest ? 'Guest' : '';

  const SidebarContent = (
    <div className="flex flex-col h-full" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo / Header */}
      <div
        className="flex items-center px-4 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <Image
          src="/icon.png"
          alt="Walu"
          width={36}
          height={36}
          className="rounded-xl shadow-sm flex-shrink-0"
        />
        {!collapsed && (
          <span className="ml-3 text-xl font-extrabold" style={{ color: 'var(--text)' }}>
            Walu
          </span>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="ml-auto lg:hidden p-1 rounded-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto hidden lg:flex p-1 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={active ? {
                background: '#4CAF50',
                color: '#fff',
              } : {
                color: 'var(--text-muted)',
              }}
              title={collapsed ? navLabels[key] : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{navLabels[key]}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile + sign out */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'var(--bg-subtle)' }}
            >
              {profile?.avatar_url || '👤'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                {displayName}
              </p>
              {!isGuest && (
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {profile?.email}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
          title={collapsed ? t.auth.signOut : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t.auth.signOut}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 border-r transition-all duration-200"
        style={{
          width: collapsed ? '68px' : '220px',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        {SidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside
            className="relative z-10 flex flex-col w-64 h-full border-r shadow-xl"
            style={{ borderColor: 'var(--sidebar-border)' }}
          >
            {SidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
