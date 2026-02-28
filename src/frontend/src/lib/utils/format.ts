/**
 * @file src/lib/utils/format.ts
 * @kind util
 * @purpose Bietet locale-sensitive Formatierungs- und Parse-Helfer fuer Zahlen, Waehrungen, Prozent und Datum.
 * @contains Hilfsfunktionen `getDecimalSeparator()`, `getThousandsSeparator()`, `getCurrencySymbol()`, `getCurrencyPosition()` kapseln wiederverwendbare Berechnungs- und Transformationslogik.
 * @contains Die Exporte sind seiteneffektarm und fuer komponentenuebergreifende Nutzung ausgelegt.
 */

/**
 * Formatting & parsing utilities (locale-aware).
 *
 * Ported from React `src/frontend/lib/transforms.ts` — simplified for Svelte
 * (no hydration concerns, no SafeNumber wrapper needed for display components).
 */

import { formatIsoDateForLocale, formatIsoDateLocal, isIsoDateOnly } from './date-only';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getDecimalSeparator(locale: string): string {
	return Intl.NumberFormat(locale).format(1.1).replace(/\d/g, '');
}

export function getThousandsSeparator(locale: string): string {
	return Intl.NumberFormat(locale).format(1000).replace(/\d/g, '');
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getCurrencySymbol(locale: string, currency: string): string {
	try {
		return (0)
			.toLocaleString(locale, {
				style: 'currency',
				currency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			})
			.replace(/\d/g, '')
			.trim();
	} catch {
		return currency;
	}
}

export function getCurrencyPosition(locale: string): 'prefix' | 'suffix' {
	try {
		const formatted = (0).toLocaleString(locale, { style: 'currency', currency: 'USD' });
		return formatted.startsWith('$') ? 'prefix' : 'suffix';
	} catch {
		return 'prefix';
	}
}

// ---------------------------------------------------------------------------
// Display formatters
// ---------------------------------------------------------------------------

export function formatCurrency(
	value: number,
	locale: string,
	currency: string,
	decimals = 2
): string {
	const symbol = getCurrencySymbol(locale, currency);
	const position = getCurrencyPosition(locale);
	const numberPart = new Intl.NumberFormat(locale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
		useGrouping: true
	}).format(value);
	return position === 'prefix' ? `${symbol}${numberPart}` : `${numberPart} ${symbol}`;
}

export function formatNumber(value: number, locale: string, decimals = 2): string {
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
		useGrouping: true
	}).format(value);
}

/** Expects a decimal value (e.g. 0.05 for 5%). */
export function formatPercent(value: number, locale: string, decimals = 1): string {
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(value);
}

export function formatDate(
	date: string | Date,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string {
	if (typeof date === 'string' && isIsoDateOnly(date)) {
		return formatIsoDateForLocale(date, locale, options);
	}
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return typeof date === 'string' ? date : '';
	return new Intl.DateTimeFormat(
		locale,
		options ?? { year: 'numeric', month: '2-digit', day: '2-digit' }
	).format(dateObj);
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

export function formatNumberInput(
	value: number | null | undefined,
	locale: string,
	decimals?: number,
	useGrouping = false
): string {
	if (value === null || value === undefined) return '';
	if (decimals !== undefined) {
		return new Intl.NumberFormat(locale, {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
			useGrouping
		}).format(value);
	}
	if (useGrouping) {
		const valueText = value.toString();
		const fractionDigits = valueText.includes('.') ? Math.min(valueText.split('.')[1].length, 20) : 0;
		return new Intl.NumberFormat(locale, {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
			useGrouping: true
		}).format(value);
	}
	return value.toString().replace('.', getDecimalSeparator(locale));
}

export function removeGroupingSeparators(input: string, locale: string): string {
	if (!input) return input;
	const separator = getThousandsSeparator(locale);
	if (!separator) return input;
	if (separator.trim() === '') {
		return input.replace(/\s+/g, '');
	}
	return input.replace(new RegExp(escapeRegExp(separator), 'g'), '');
}

export function parseNumber(input: string, locale: string): number {
	if (!input || input === '.' || input === ',') return 0;
	const decSep = getDecimalSeparator(locale);
	const normalized = input
		.replace(new RegExp(`[^\\d\\${decSep}\\-]`, 'g'), '')
		.replace(decSep, '.');
	if (normalized === '.' || normalized === '-' || normalized.endsWith('.')) return 0;
	const parsed = parseFloat(normalized);
	return isNaN(parsed) ? 0 : parsed;
}

export function toISODate(date: Date): string {
	return formatIsoDateLocal(date);
}
