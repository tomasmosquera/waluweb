'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) { setError(t.auth.passwordShort); return; }
    if (password !== confirm) { setError(t.auth.passwordMismatch); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setNotice(t.common.success);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-subtle)' }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-8 shadow-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text)' }}>
            {t.auth.resetPassword}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { placeholder: t.auth.newPassword, value: password, onChange: setPassword },
              { placeholder: t.auth.confirmPassword, value: confirm, onChange: setConfirm },
            ].map((field, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl px-3 h-12 border"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
              >
                <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>
            ))}

            {error && (
              <div className="rounded-xl p-3 text-sm border" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl p-3 text-sm border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534' }}>
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t.auth.updatePassword}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
