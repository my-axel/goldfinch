import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { parseNumber, parseDate } from './transforms';
import { getSettingsApiRoute } from './routes/api/settings';

// Types for settings API
export interface Settings {
  id: number;
  ui_locale: string;
  number_locale: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface SettingsUpdate {
  ui_locale?: string;
  number_locale?: string;
  currency?: string;
}

// Generic type for API data
export type ApiData = Record<string, unknown>;

// Helper to detect field types
const isDateField = (key: string): boolean => {
  const datePatterns = ['date', '_at', '_on'];
  return datePatterns.some(pattern => key.includes(pattern));
};

const isNumberField = (key: string): boolean => {
  const numberPatterns = ['amount', 'value', 'price', 'units', 'rate'];
  return numberPatterns.some(pattern => key.includes(pattern));
};

class ApiClient {
  private api: AxiosInstance;
  private locale: string = 'en-US';

  constructor() {
    this.api = axios.create();

    // Add request interceptor for data transformation
    this.api.interceptors.request.use(
      (config) => {
        if (config.data) {
          config.data = this.transformRequest(config.data);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Set locale for number parsing
  setLocale(locale: string) {
    this.locale = locale;
  }

  private transformRequest(data: Record<string, unknown>): Record<string, unknown> {
    if (!data || typeof data !== 'object') return data;

    return Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        if (isDateField(key)) {
          acc[key] = parseDate(value);
        } else if (isNumberField(key)) {
          acc[key] = parseNumber(value, this.locale);
        } else {
          acc[key] = value;
        }
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  }

  // Settings API methods
  async getSettings(): Promise<Settings> {
    try {
      const response = await this.api.get<Settings>(getSettingsApiRoute());
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async updateSettings(settings: SettingsUpdate): Promise<Settings> {
    try {
      const response = await this.api.put<Settings>(getSettingsApiRoute(), settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Generic request methods with proper typing
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  async post<T, D extends ApiData = ApiData>(
    url: string,
    data: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error posting to ${url}:`, error);
      throw error;
    }
  }

  async put<T, D extends ApiData = ApiData>(
    url: string,
    data: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${url}:`, error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ${url}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const api = new ApiClient(); 