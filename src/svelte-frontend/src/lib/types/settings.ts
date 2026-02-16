/**
 * Settings types and enums
 */

// --- Enums ---

export enum UILocale {
	EN_US = 'en-US',
	DE_DE = 'de-DE'
}

export enum NumberLocale {
	EN_US = 'en-US',
	EN_GB = 'en-GB',
	DE_DE = 'de-DE'
}

export enum Currency {
	USD = 'USD',
	EUR = 'EUR',
	GBP = 'GBP'
}

export const UI_LOCALE_LABELS: Record<UILocale, string> = {
	[UILocale.EN_US]: 'English',
	[UILocale.DE_DE]: 'Deutsch'
};

export const NUMBER_LOCALE_LABELS: Record<NumberLocale, string> = {
	[NumberLocale.EN_US]: '123,456.78 | 02/23/2024',
	[NumberLocale.EN_GB]: '123,456.78 | 23/02/2024',
	[NumberLocale.DE_DE]: '123.456,78 | 23.02.2024'
};

export const CURRENCY_LABELS: Record<Currency, string> = {
	[Currency.USD]: 'US Dollar (USD)',
	[Currency.EUR]: 'Euro (EUR)',
	[Currency.GBP]: 'British Pound (GBP)'
};

// --- Types ---

export interface Settings {
	id: number;
	ui_locale: string;
	number_locale: string;
	currency: string;
	projection_pessimistic_rate: number;
	projection_realistic_rate: number;
	projection_optimistic_rate: number;
	state_pension_pessimistic_rate: number;
	state_pension_realistic_rate: number;
	state_pension_optimistic_rate: number;
	inflation_rate: number;
	created_at: string;
	updated_at: string;
}

export interface SettingsUpdate {
	ui_locale?: string;
	number_locale?: string;
	currency?: string;
	projection_pessimistic_rate?: number;
	projection_realistic_rate?: number;
	projection_optimistic_rate?: number;
	state_pension_pessimistic_rate?: number;
	state_pension_realistic_rate?: number;
	state_pension_optimistic_rate?: number;
	inflation_rate?: number;
}

export type FrontendSettings = Omit<Settings, 'id' | 'created_at' | 'updated_at'>;
