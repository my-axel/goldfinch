/**
 * Settings types for the application
 */

/**
 * Base settings interface from the API
 */
export interface Settings {
  id: number;
  ui_locale: string;
  number_locale: string;
  currency: string;
  projection_pessimistic_rate: number;
  projection_realistic_rate: number;
  projection_optimistic_rate: number;
  created_at: string;
  updated_at: string;
}

/**
 * Settings update payload type
 */
export interface SettingsUpdate {
  ui_locale?: string;
  number_locale?: string;
  currency?: string;
  projection_pessimistic_rate?: number;
  projection_realistic_rate?: number;
  projection_optimistic_rate?: number;
}

/**
 * Frontend settings type (omits API-specific fields)
 */
export interface FrontendSettings extends Omit<Settings, 'id' | 'created_at' | 'updated_at'> {
  ui_locale: string;
  number_locale: string;
  currency: string;
  projection_pessimistic_rate: number;
  projection_realistic_rate: number;
  projection_optimistic_rate: number;
}

/**
 * Settings state interface for context
 */
export interface SettingsState {
  data: FrontendSettings;
  isLoading: boolean;
  error: string | null;
}

/**
 * Settings context type
 */
export interface SettingsContextType {
  settings: FrontendSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<FrontendSettings>) => Promise<void>;
} 