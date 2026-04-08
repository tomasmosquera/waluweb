export type Language = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  email: string;
  language_preference?: Language;
  theme_preference?: Theme;
  connected_tabs_enabled?: boolean;
  feature_preferences?: Record<string, boolean>;
  updated_at?: string;
}

export const DEFAULT_FEATURE_PREFERENCES: Record<string, boolean> = {
  connectedTabs: true,
  splitTransactions: true,
  budgetForecast: true,
  showDecimals: false,
};
