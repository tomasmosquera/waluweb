'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, Tags, User, Shield, Palette, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { AVATAR_OPTIONS } from '@/lib/avatars';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const cards = [
    {
      icon: <Tag size={20} />,
      title: t.settings.categories,
      description: t.settings.categoriesDesc,
      href: '/settings/categories',
    },
    {
      icon: <Tags size={20} />,
      title: t.settings.labels,
      description: t.settings.labelsDesc,
      href: '/settings/labels',
    },
    {
      icon: <User size={20} />,
      title: t.settings.profile,
      description: t.settings.profileDesc,
      href: '/settings/profile',
    },
    {
      icon: <Shield size={20} />,
      title: t.settings.security,
      description: t.settings.securityDesc,
      href: '/settings/security',
    },
    {
      icon: <Palette size={20} />,
      title: t.settings.appearance,
      description: t.settings.appearanceDesc,
      href: '/settings/appearance',
    },
  ];

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Profile header */}
      {profile && (
        <Link
          href="/settings/profile"
          className="flex items-center gap-4 p-4 rounded-2xl border mb-2 hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: 'var(--bg-subtle)' }}
          >
            {profile.avatar_url || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>
              {displayName || profile.email}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {profile.email}
            </p>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>
      )}

      {/* Setting cards */}
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="flex items-center gap-4 p-4 rounded-2xl border hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#4CAF5018', color: '#4CAF50' }}
          >
            {card.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {card.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {card.description}
            </p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  );
}
