'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AVATAR_OPTIONS } from '@/lib/avatars';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

const LANGUAGE_OPTIONS = [
  { value: 'en' as const, label: 'English', flag: '🇺🇸' },
  { value: 'es' as const, label: 'Español', flag: '🇪🇸' },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { signInAsGuest, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSignIn = mode === 'signIn';
  const isSignUp = mode === 'signUp';
  const isForgot = mode === 'forgotPassword';

  function getFormTitle() {
    if (isSignUp) return t.auth.createAccount;
    if (isForgot) return t.auth.resetPassword;
    return t.auth.welcomeBack;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setError('');
    setNotice('');

    if (!email) {
      setError(t.auth.fillAllFields);
      return;
    }

    if (isForgot) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice(t.auth.resetSent);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t.common.error);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError(t.auth.fillAllFields);
      return;
    }

    if (isSignUp) {
      if (!firstName || !lastName) { setError(t.auth.nameRequired); return; }
      if (!avatar) { setError(t.auth.avatarRequired); return; }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              avatar_url: avatar,
              language_preference: language,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          await updateProfile({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            avatar_url: avatar,
            language_preference: language,
            theme_preference: 'light',
          });
          router.push('/');
        } else {
          setNotice(t.auth.accountCreated);
          setMode('signIn');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.error;
      const norm = msg.toLowerCase();

      if (norm.includes('invalid login credentials') || norm.includes('invalid_credentials')) {
        setError(language === 'es' ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.');
      } else if (norm.includes('email not confirmed')) {
        setError(language === 'es'
          ? 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.'
          : 'Your email has not been confirmed yet. Check your inbox.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    signInAsGuest();
    router.push('/');
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
    setNotice('');
    setAttempted(false);
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/icon.png"
          alt="Walu"
          width={90}
          height={90}
          className="rounded-2xl shadow-lg mb-4"
          priority
        />
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>Walu</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {language === 'es' ? 'Tu gestor de finanzas personales' : 'Your personal finance manager'}
        </p>
      </div>

      {/* Language switcher */}
      <div className="flex justify-center gap-2 mb-6">
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLanguage(opt.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all"
            style={language === opt.value ? {
              background: '#4CAF50',
              borderColor: '#4CAF50',
              color: '#fff',
            } : {
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <span className="font-bold text-xs">{opt.value === 'es' ? 'ESP' : 'ENG'}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 shadow-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text)' }}>
          {getFormTitle()}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name fields — sign up only */}
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <InputField
                icon={<User size={16} />}
                type="text"
                placeholder={t.auth.firstName}
                value={firstName}
                onChange={setFirstName}
                hasError={attempted && !firstName}
              />
              <InputField
                icon={<User size={16} />}
                type="text"
                placeholder={t.auth.lastName}
                value={lastName}
                onChange={setLastName}
                hasError={attempted && !lastName}
              />
            </div>
          )}

          {/* Email */}
          <InputField
            icon={<Mail size={16} />}
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={setEmail}
            hasError={attempted && !email}
          />

          {/* Password */}
          {!isForgot && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 h-12 border transition-colors"
              style={{
                background: 'var(--bg-subtle)',
                borderColor: attempted && !password ? '#F44336' : 'var(--border)',
              }}
            >
              <Lock size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.auth.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {/* Avatar picker — sign up only */}
          {isSignUp && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t.auth.selectAvatar}
                </span>
                <span style={{ color: '#F44336' }}>*</span>
                {attempted && !avatar && (
                  <span className="text-xs ml-1" style={{ color: '#F44336' }}>{t.auth.required}</span>
                )}
              </div>
              <div
                className="flex flex-wrap gap-2 p-3 rounded-xl border"
                style={{
                  borderColor: attempted && !avatar ? '#F44336' : 'var(--border)',
                  background: 'var(--bg-subtle)',
                }}
              >
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-all"
                    style={{
                      borderColor: avatar === emoji ? '#4CAF50' : 'transparent',
                      background: avatar === emoji ? '#E8F5E9' : 'var(--bg-card)',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Forgot password link — sign in only */}
          {isSignIn && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => switchMode('forgotPassword')}
                className="text-sm font-semibold"
                style={{ color: '#4CAF50' }}
              >
                {t.auth.forgotPassword}
              </button>
            </div>
          )}

          {/* Error / notice */}
          {error && (
            <div className="rounded-xl p-3 text-sm border" style={{
              background: '#FEF2F2',
              borderColor: '#FECACA',
              color: '#B91C1C',
            }}>
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl p-3 text-sm border" style={{
              background: '#F0FDF4',
              borderColor: '#BBF7D0',
              color: '#166534',
            }}>
              {notice}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : isForgot
                ? t.auth.sendReset
                : isSignUp
                  ? t.auth.signUp
                  : t.auth.signIn}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-5 text-center">
          {isForgot ? (
            <button
              onClick={() => switchMode('signIn')}
              className="text-sm font-medium flex items-center justify-center gap-1 mx-auto"
              style={{ color: '#4CAF50' }}
            >
              ← {t.auth.hasAccount}
            </button>
          ) : (
            <button
              onClick={() => switchMode(isSignUp ? 'signIn' : 'signUp')}
              className="text-sm font-medium"
              style={{ color: '#4CAF50' }}
            >
              {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
            </button>
          )}
        </div>

        {/* Guest mode */}
        {!isSignUp && !isForgot && (
          <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handleGuest}
              className="text-sm flex items-center justify-center gap-1 mx-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.auth.continueAsGuest}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Reusable input field ─────────────────────────────────── */
function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  hasError,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 h-12 border transition-colors"
      style={{
        background: 'var(--bg-subtle)',
        borderColor: hasError ? '#F44336' : 'var(--border)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoCapitalize="off"
        autoComplete={type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'off'}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: 'var(--text)' }}
      />
    </div>
  );
}
