'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function PasswordInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 h-11 px-3 rounded-xl border"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
      >
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
        <button type="button" onClick={() => setShow((v) => !v)} style={{ color: 'var(--text-muted)' }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { language, t } = useLanguage();
  const { updatePassword, deleteAccount, isGuest } = useAuth();
  const router = useRouter();

  // Password change
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved,  setPwSaved]  = useState(false);
  const [pwError,  setPwError]  = useState('');

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting,      setDeleting]      = useState(false);
  const [delError,      setDelError]      = useState('');

  const CONFIRM_WORD = language === 'es' ? 'ELIMINAR' : 'DELETE';

  async function handleChangePassword() {
    setPwError('');
    if (!current || !next || !confirm) {
      setPwError(t.auth.fillAllFields);
      return;
    }
    if (next !== confirm) {
      setPwError(t.settings.passwordMismatch);
      return;
    }
    if (next.length < 6) {
      setPwError(t.settings.passwordShort);
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword(current, next);
      setPwSaved(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CURRENT_PASSWORD_INCORRECT') {
        setPwError(t.settings.currentPasswordIncorrect);
      } else {
        setPwError(t.common.error);
      }
    } finally {
      setPwSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== CONFIRM_WORD) return;
    setDeleting(true);
    setDelError('');
    try {
      await deleteAccount();
      router.push('/login');
    } catch {
      setDelError(t.common.error);
      setDeleting(false);
    }
  }

  if (isGuest) {
    return (
      <div className="max-w-lg mx-auto">
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {language === 'es'
              ? 'Inicia sesión para acceder a las opciones de seguridad.'
              : 'Sign in to access security options.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Change password */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {t.settings.updatePassword}
        </h3>

        <PasswordInput
          value={current}
          onChange={setCurrent}
          label={t.settings.currentPassword}
          placeholder="••••••••"
        />
        <PasswordInput
          value={next}
          onChange={setNext}
          label={t.settings.newPassword}
          placeholder="••••••••"
        />
        <PasswordInput
          value={confirm}
          onChange={setConfirm}
          label={t.settings.confirmPassword}
          placeholder="••••••••"
        />

        {pwError && <p className="text-xs" style={{ color: '#F44336' }}>{pwError}</p>}
        {pwSaved && (
          <div className="rounded-xl p-3 text-xs flex items-center gap-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
            <Check size={14} /> {t.settings.passwordUpdated}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={pwSaving}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
        >
          {pwSaving ? <Loader2 size={16} className="animate-spin" /> : t.settings.updatePassword}
        </button>
      </div>

      {/* Danger zone */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'var(--bg-card)', borderColor: '#FFCDD2' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: '#F44336' }} />
          <h3 className="text-sm font-bold" style={{ color: '#F44336' }}>
            {t.settings.dangerZone}
          </h3>
        </div>

        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
            {t.settings.deleteAccount}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.settings.deleteAccountDesc}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {t.settings.confirmDeleteAccount}:{' '}
            <span className="font-bold" style={{ color: '#F44336' }}>{CONFIRM_WORD}</span>
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--bg-subtle)', borderColor: '#FFCDD2', color: 'var(--text)' }}
          />
        </div>

        {delError && <p className="text-xs" style={{ color: '#F44336' }}>{delError}</p>}

        <button
          onClick={handleDeleteAccount}
          disabled={deleting || deleteConfirm !== CONFIRM_WORD}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: '#F44336' }}
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : t.settings.deleteAccount}
        </button>
      </div>
    </div>
  );
}
