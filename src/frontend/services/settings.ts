import { Settings, SettingsUpdate } from '@/frontend/types/settings';
import { getSettingsApiRoute } from '@/frontend/lib/routes/api/settings';
import { api } from '@/frontend/lib/api-client';

/**
 * Settings service for managing application settings
 */
export const settingsService = {
  /**
   * Fetch settings from the API
   */
  async getSettings(): Promise<Settings> {
    try {
      return await api.get<Settings>(getSettingsApiRoute());
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update settings via the API
   */
  async updateSettings(settings: SettingsUpdate): Promise<Settings> {
    try {
      // Cast settings to Record<string, unknown> to match ApiData type
      return await api.put<Settings>(
        getSettingsApiRoute(), 
        settings as Record<string, unknown>
      );
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}; 