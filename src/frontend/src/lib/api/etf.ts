/**
 * @file src/lib/api/etf.ts
 * @kind api
 * @purpose Stellt API-Zugriffe fuer ETF-Suche und ETF-Details bereit.
 */

import { api } from './client';
import type { ETFSearchResult, ETFYFinanceResult } from '$lib/types/etf';
import type { ETFSearchResultWithSource } from '$lib/types/data_source';

const ETF_BASE = '/api/v1/etf';

export const etfApi = {
	/** Search ETFs in the local database */
	search: (query: string) =>
		api.get<ETFSearchResult[]>(`${ETF_BASE}?query=${encodeURIComponent(query)}`),

	/** Search ETFs via FinanceDatabase (multi-source, returns source-annotated results) */
	searchExternal: (query: string) =>
		api.get<ETFSearchResultWithSource[]>(`${ETF_BASE}/search?query=${encodeURIComponent(query)}`),

	/** @deprecated Use searchExternal instead */
	searchYFinance: (query: string) =>
		api.get<ETFYFinanceResult[]>(`${ETF_BASE}/search?query=${encodeURIComponent(query)}`),

	/** Get a single ETF by ID */
	get: (id: string) => api.get<ETFSearchResult>(`${ETF_BASE}/${encodeURIComponent(id)}`)
};
