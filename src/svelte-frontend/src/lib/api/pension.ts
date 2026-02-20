/**
 * @file src/lib/api/pension.ts
 * @kind api
 * @purpose Stellt API-Zugriffe fuer alle Pension-Typen, Statuswechsel und pensionspezifische Spezialendpunkte bereit.
 * @contains Endpoint-Basen `PENSION_BASE`, `SUMMARIES_BASE` strukturieren die API-Routen des Moduls.
 * @contains Methoden `routeFor()`, `summaryRouteFor()`, `buildPensionApi()`, `createPensionApi()` kapseln Request-Payloads und Response-Mapping.
 * @contains Fehlerbehandlung und Typisierung werden zentral ueber den API-Client abgesichert.
 */

import { api, createApi } from './client';
import {
	PensionType,
	PENSION_ROUTE_MAP,
	type PensionListItem,
	type PensionStatusUpdate,
	type StatePensionProjection,
	type ETFPensionList,
	type ETFPensionStatistics,
	type InsurancePensionList,
	type CompanyPensionList,
	type StatePensionList,
	type SavingsPensionList
} from '$lib/types/pension';

const PENSION_BASE = '/api/v1/pension';
const SUMMARIES_BASE = '/api/v1/pension-summaries';

function routeFor(type: PensionType): string {
	return `${PENSION_BASE}/${PENSION_ROUTE_MAP[type]}`;
}

function summaryRouteFor(type: PensionType, memberId?: number): string {
	const base = `${SUMMARIES_BASE}/${PENSION_ROUTE_MAP[type]}`;
	return memberId ? `${base}?member_id=${memberId}` : base;
}

function buildPensionApi(client: ReturnType<typeof createApi>) {
	return {
		/** Fetch all pension summaries across all types, merged into a single array */
		async listAll(memberId?: number): Promise<PensionListItem[]> {
			const [etf, insurance, company, state, savings] = await Promise.all([
				client.get<ETFPensionList[]>(summaryRouteFor(PensionType.ETF_PLAN, memberId)),
				client.get<InsurancePensionList[]>(summaryRouteFor(PensionType.INSURANCE, memberId)),
				client.get<CompanyPensionList[]>(summaryRouteFor(PensionType.COMPANY, memberId)),
				client.get<StatePensionList[]>(summaryRouteFor(PensionType.STATE, memberId)),
				client.get<SavingsPensionList[]>(summaryRouteFor(PensionType.SAVINGS, memberId))
			]);

			return [
				...etf.map((p) => ({ ...p, type: PensionType.ETF_PLAN as const })),
				...insurance.map((p) => ({ ...p, type: PensionType.INSURANCE as const })),
				...company.map((p) => ({ ...p, type: PensionType.COMPANY as const })),
				...state.map((p) => ({ ...p, type: PensionType.STATE as const })),
				...savings.map((p) => ({ ...p, type: PensionType.SAVINGS as const }))
			];
		},

		/** Get a single pension by type and id */
		get: <T>(type: PensionType, id: number) => client.get<T>(`${routeFor(type)}/${id}`),

		/** Create a new pension */
		create: <T>(type: PensionType, data: unknown) => client.post<T>(routeFor(type), data),

		/** Update an existing pension */
		update: <T>(type: PensionType, id: number, data: unknown) =>
			client.put<T>(`${routeFor(type)}/${id}`, data),

		/** Delete a pension */
		delete: (type: PensionType, id: number) => client.delete<void>(`${routeFor(type)}/${id}`),

		/** Update pension status (ACTIVE/PAUSED) */
		updateStatus: (type: PensionType, id: number, data: PensionStatusUpdate) =>
			client.put<void>(`${routeFor(type)}/${id}/status`, data),

		/** Get state pension scenarios/projections */
		getStatePensionScenarios: (pensionId: number) =>
			client.get<StatePensionProjection>(`${PENSION_BASE}/state/${pensionId}/scenarios`),

		/** Delete a state pension statement */
		deleteStatePensionStatement: (pensionId: number, statementId: number) =>
			client.delete<void>(`${PENSION_BASE}/state/${pensionId}/statements/${statementId}`),

		/** Delete a savings pension statement */
		deleteSavingsPensionStatement: (pensionId: number, statementId: number) =>
			client.delete<void>(`${PENSION_BASE}/savings/${pensionId}/statements/${statementId}`),

		/** Add a new statement to a savings pension (statements are NOT part of the pension update body) */
		addSavingsPensionStatement: (pensionId: number, data: { statement_date: string; balance: number; note?: string }) =>
			client.post<void>(`${PENSION_BASE}/savings/${pensionId}/statements`, data),

		/** Update an existing savings pension statement */
		updateSavingsPensionStatement: (pensionId: number, statementId: number, data: { statement_date: string; balance: number; note?: string }) =>
			client.put<void>(`${PENSION_BASE}/savings/${pensionId}/statements/${statementId}`, data),

		/** Add a new statement to an insurance pension (with projections inline) */
		addInsurancePensionStatement: (
			pensionId: number,
			data: {
				statement_date: string;
				value: number;
				total_contributions: number;
				total_benefits: number;
				costs_amount: number;
				costs_percentage: number;
				note?: string;
				projections: Array<{
					scenario_type: 'with_contributions' | 'without_contributions';
					return_rate: number;
					value_at_retirement: number;
					monthly_payout: number;
				}>;
			}
		) => client.post<void>(`${PENSION_BASE}/insurance/${pensionId}/statements`, data),

		/** Update an existing insurance pension statement */
		updateInsurancePensionStatement: (
			pensionId: number,
			statementId: number,
			data: {
				statement_date: string;
				value: number;
				total_contributions: number;
				total_benefits: number;
				costs_amount: number;
				costs_percentage: number;
				note?: string;
				projections: Array<{
					scenario_type: 'with_contributions' | 'without_contributions';
					return_rate: number;
					value_at_retirement: number;
					monthly_payout: number;
				}>;
			}
		) => client.put<void>(`${PENSION_BASE}/insurance/${pensionId}/statements/${statementId}`, data),

		/** Delete an insurance pension statement */
		deleteInsurancePensionStatement: (pensionId: number, statementId: number) =>
			client.delete<void>(`${PENSION_BASE}/insurance/${pensionId}/statements/${statementId}`),

		/** Add a new statement to a company pension (with retirement projections inline) */
		addCompanyPensionStatement: (
			pensionId: number,
			data: {
				statement_date: string;
				value: number;
				note?: string;
				retirement_projections: Array<{
					retirement_age: number;
					monthly_payout: number;
					total_capital: number;
				}>;
			}
		) => client.post<void>(`${PENSION_BASE}/company/${pensionId}/statements`, data),

		/** Update an existing company pension statement */
		updateCompanyPensionStatement: (
			pensionId: number,
			statementId: number,
			data: {
				statement_date: string;
				value: number;
				note?: string;
				retirement_projections: Array<{
					retirement_age: number;
					monthly_payout: number;
					total_capital: number;
				}>;
			}
		) => client.put<void>(`${PENSION_BASE}/company/${pensionId}/statements/${statementId}`, data),

		/** Delete a company pension statement */
		deleteCompanyPensionStatement: (pensionId: number, statementId: number) =>
			client.delete<void>(`${PENSION_BASE}/company/${pensionId}/statements/${statementId}`),

		/** Get ETF pension statistics (value history, contribution history, return metrics) */
		getETFPensionStatistics: (pensionId: number) =>
			client.get<ETFPensionStatistics>(`${PENSION_BASE}/etf/${pensionId}/statistics`),

		/** Add a one-time investment to an ETF pension */
		addETFOneTimeInvestment: (
			pensionId: number,
			data: { amount: number; investment_date: string; note?: string }
		) => client.post<void>(`${PENSION_BASE}/etf/${pensionId}/one-time-investment`, data)
	};
}

// Factory for load functions — pass SvelteKit's fetch to avoid window.fetch warnings
export function createPensionApi(fetchFn: typeof fetch) {
	return buildPensionApi(createApi(fetchFn));
}

// Default singleton — used in stores and event handlers (outside load functions)
export const pensionApi = buildPensionApi(api);
