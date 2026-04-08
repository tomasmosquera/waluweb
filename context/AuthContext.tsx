'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_AVATAR, normalizeAvatarEmoji } from '@/lib/avatars';
import type { Profile, Language, Theme } from '@/lib/types';
import { DEFAULT_FEATURE_PREFERENCES } from '@/lib/types';

const DEFAULT_THEME: Theme = 'light';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updatePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  signInAsGuest: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeProfile(data: Partial<Profile> & { id: string }): Profile {
  return {
    id: data.id,
    first_name: data.first_name ?? '',
    last_name: data.last_name ?? '',
    avatar_url: normalizeAvatarEmoji(data.avatar_url),
    email: data.email ?? '',
    language_preference: data.language_preference,
    theme_preference: (data.theme_preference === 'light' || data.theme_preference === 'dark' || data.theme_preference === 'system')
      ? data.theme_preference
      : DEFAULT_THEME,
    connected_tabs_enabled: data.connected_tabs_enabled !== false,
    feature_preferences: data.feature_preferences ?? DEFAULT_FEATURE_PREFERENCES,
    updated_at: data.updated_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const metadata = authUser.user_metadata ?? {};
        const emailPrefix = authUser.email?.split('@')[0]?.trim() ?? '';
        const fallbackName = emailPrefix
          ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
          : '';

        const initialProfile = normalizeProfile({
          id: authUser.id,
          email: authUser.email ?? '',
          first_name: typeof metadata.first_name === 'string' ? metadata.first_name.trim() : fallbackName,
          last_name: typeof metadata.last_name === 'string' ? metadata.last_name.trim() : '',
          avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : DEFAULT_AVATAR,
          language_preference: metadata.language_preference as Language | undefined,
          theme_preference: DEFAULT_THEME,
          connected_tabs_enabled: true,
          feature_preferences: DEFAULT_FEATURE_PREFERENCES,
        });

        await supabase.from('profiles').upsert({
          ...initialProfile,
          updated_at: new Date().toISOString(),
        });

        setProfile(initialProfile);
      } else {
        setProfile(normalizeProfile({ id: authUser.id, email: authUser.email ?? '', ...data }));
      }
    } catch (err) {
      console.error('[auth] fetchProfile error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user);
      } else {
        setProfile(null);
        setIsGuest(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const next = normalizeProfile({
      ...(profile ?? { id: user.id, email: user.email ?? '' }),
      ...updates,
      id: user.id,
    });
    setProfile(next);

    if (isGuest) return;

    await supabase.from('profiles').upsert({
      ...next,
      updated_at: new Date().toISOString(),
    });
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const updatePassword = async (currentPassword: string, nextPassword: string) => {
    if (isGuest || !user?.email) throw new Error('Not available for guests.');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid')) {
        throw new Error('CURRENT_PASSWORD_INCORRECT');
      }
      throw signInError;
    }

    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) throw error;
  };

  const signInAsGuest = () => {
    const guestId = `guest_${Date.now()}`;
    setUser({ id: guestId, email: '' } as unknown as User);
    setProfile({
      id: guestId,
      first_name: 'Guest',
      last_name: '',
      avatar_url: DEFAULT_AVATAR,
      email: '',
      theme_preference: DEFAULT_THEME,
      connected_tabs_enabled: true,
    });
    setIsGuest(true);
    setIsLoading(false);
  };

  const signOut = async () => {
    if (!isGuest) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsGuest(false);
    setIsLoading(false);
  };

  const deleteAccount = async () => {
    if (isGuest) {
      await signOut();
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('Missing session.');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user-account`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(typeof payload.error === 'string' ? payload.error : 'Delete account failed.');
    }

    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsGuest(false);
    setIsLoading(false);
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      isLoading,
      isGuest,
      signOut,
      deleteAccount,
      updatePassword,
      signInAsGuest,
      updateProfile,
      refreshProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, user, profile, isLoading, isGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
