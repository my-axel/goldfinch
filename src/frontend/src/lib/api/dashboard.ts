/**
 * @file src/lib/api/dashboard.ts
 * @kind api
 * @purpose API-Client fuer den Dashboard-Aggregate-Endpoint.
 *          Liefert summierte historische und Projektions-Zeitreihen
 *          fuer den gesamten Haushalt oder einzelne Members.
 */

import { api, createApi } from './client';
import type { AggregateSeriesResponse, PensionSeriesResponse, PensionType } from '$lib/types/pension';

const PENSION_BASE = '/api/v1/pension';
const DASHBOARD_BASE = '/api/v1/dashboard';

// Mapping PensionType to backend route segment
const PENSION_ROUTE: Record<string, string> = {
	ETF_PLAN: 'etf',
	INSURANCE: 'insurance',
	COMPANY: 'company',
	STATE: 'state',
	SAVINGS: 'savings'
};

function buildDashboardApi(client: ReturnType<typeof createApi>) {
	return {
		/**
		 * Get aggregate time series for the entire household or a specific member.
		 *
		 * @param params.member_id  - Filter to one member (undefined = entire household)
		 * @param params.pension_type - Filter to one pension type
		 */
		getAggregateSeries(params: {
			member_id?: number;
			pension_type?: string;
		} = {}): Promise<AggregateSeriesResponse> {
			const qs = new URLSearchParams();
			if (params.member_id !== undefined) qs.set('member_id', String(params.member_id));
			if (params.pension_type) qs.set('pension_type', params.pension_type);
			const query = qs.toString() ? `?${qs}` : '';
			return client.get<AggregateSeriesResponse>(`${DASHBOARD_BASE}/series${query}`);
		},

		/**
		 * Get time series for a single pension plan.
		 *
		 * @param type - Pension type enum value (e.g. PensionType.ETF_PLAN)
		 * @param id   - Pension plan ID
		 */
		getPensionSeries(type: string, id: number): Promise<PensionSeriesResponse> {
			const route = PENSION_ROUTE[type] ?? type.toLowerCase();
			return client.get<PensionSeriesResponse>(`${PENSION_BASE}/${route}/${id}/series`);
		}
	};
}

/** Use in load functions: createDashboardApi(fetch).getAggregateSeries(...) */
export function createDashboardApi(fetchFn: typeof fetch) {
	return buildDashboardApi(createApi(fetchFn));
}

/** Singleton for use in stores and event handlers */
export const dashboardApi = buildDashboardApi(api);
