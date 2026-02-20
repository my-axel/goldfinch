export interface ETFSearchResult {
	id: string;
	symbol: string;
	name: string;
	isin?: string;
	currency?: string;
	last_price?: number;
	last_update?: string;
}

export interface ETFYFinanceResult {
	symbol: string;
	shortName?: string;
	longName?: string;
	currency?: string;
}
