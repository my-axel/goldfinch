/**
 * @file src/lib/api/etf.ts
 * @kind api
 * @purpose Stellt API-Zugriffe fuer ETF-Suche und ETF-Details bereit.
 */

import { api } from './client';
import type { ETFSearchResult, ETFYFinanceResult } from '$lib/types/etf';

const ETF_BASE = '/api/v1/etf';

export const etfApi = {
	/** Search ETFs in the local database */
	search: (query: string) =>
		api.get<ETFSearchResult[]>(`${ETF_BASE}?query=${encodeURIComponent(query)}`),

	/** Search ETFs via YFinance (symbol lookup) */
	searchYFinance: (query: string) =>
		api.get<ETFYFinanceResult[]>(`${ETF_BASE}/search?query=${encodeURIComponent(query)}`),

	/** Get a single ETF by ID */
	get: (id: string) => api.get<ETFSearchResult>(`${ETF_BASE}/${encodeURIComponent(id)}`)
};
