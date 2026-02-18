const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDateOnly(value: unknown): value is string {
	return typeof value === 'string' && ISO_DATE_RE.test(value);
}

export function parseIsoDateLocal(isoDate: string): Date | null {
	const match = ISO_DATE_RE.exec(isoDate);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const parsed = new Date(year, month - 1, day);

	if (
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return null;
	}

	return parsed;
}

export function formatIsoDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
	return formatIsoDateLocal(new Date());
}

export function addYearsIsoDate(isoDate: string, years: number): string {
	const parsed = parseIsoDateLocal(isoDate);
	if (!parsed) return isoDate;
	parsed.setFullYear(parsed.getFullYear() + years);
	return formatIsoDateLocal(parsed);
}

export function addDaysIsoDate(isoDate: string, days: number): string {
	const parsed = parseIsoDateLocal(isoDate);
	if (!parsed) return isoDate;
	parsed.setDate(parsed.getDate() + days);
	return formatIsoDateLocal(parsed);
}

export function formatIsoDateForLocale(
	isoDate: string,
	locale: string,
	options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
): string {
	const parsed = parseIsoDateLocal(isoDate);
	if (!parsed) return isoDate;
	return new Intl.DateTimeFormat(locale, options).format(parsed);
}

/** YYYY-MM-DD strings compare lexicographically by date. */
export function compareIsoDate(a: string, b: string): number {
	return a.localeCompare(b);
}
