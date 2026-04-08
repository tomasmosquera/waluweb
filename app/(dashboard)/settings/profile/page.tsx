'use client';

import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { AVATAR_OPTIONS } from '@/lib/avatars';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { profile, updateProfile, isGuest } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [avatar,    setAvatar]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name  ?? '');
      setAvatar(profile.avatar_url   ?? '');
    }
  }, [profile]);

  async function handleSave() {
    if (!firstName.trim()) {
      setError(t.auth.nameRequired);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        avatar_url: avatar,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Avatar */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Current avatar preview */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
            style={{ background: 'var(--bg-subtle)' }}
          >
            {avatar || '👤'}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {firstName || profile?.first_name} {lastName || profile?.last_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {profile?.email}
            </p>
          </div>
        </div>

        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          {t.settings.avatar}
        </p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setAvatar(emoji)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-all"
              style={{
                borderColor: avatar === emoji ? '#4CAF50' : 'transparent',
                background:  avatar === emoji ? '#E8F5E9' : 'var(--bg-subtle)',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Name fields */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {t.settings.firstName}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isGuest}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none disabled:opacity-50"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {t.settings.lastName}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isGuest}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none disabled:opacity-50"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        {error && <p className="text-xs" style={{ color: '#F44336' }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || isGuest}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <><Check size={16} /> {t.settings.saved}</>
          ) : (
            t.settings.saveChanges
          )}
        </button>
      </div>
    </div>
  );
}
