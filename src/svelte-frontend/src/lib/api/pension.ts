import { api } from './client';
import {
	PensionType,
	PENSION_ROUTE_MAP,
	type PensionListItem,
	type PensionStatusUpdate,
	type ETFPensionList,
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

export const pensionApi = {
	/** Fetch all pension summaries across all types, merged into a single array */
	async listAll(memberId?: number): Promise<PensionListItem[]> {
		const [etf, insurance, company, state, savings] = await Promise.all([
			api.get<ETFPensionList[]>(summaryRouteFor(PensionType.ETF_PLAN, memberId)),
			api.get<InsurancePensionList[]>(summaryRouteFor(PensionType.INSURANCE, memberId)),
			api.get<CompanyPensionList[]>(summaryRouteFor(PensionType.COMPANY, memberId)),
			api.get<StatePensionList[]>(summaryRouteFor(PensionType.STATE, memberId)),
			api.get<SavingsPensionList[]>(summaryRouteFor(PensionType.SAVINGS, memberId))
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
	get: <T>(type: PensionType, id: number) => api.get<T>(`${routeFor(type)}/${id}`),

	/** Create a new pension */
	create: <T>(type: PensionType, data: unknown) => api.post<T>(routeFor(type), data),

	/** Update an existing pension */
	update: <T>(type: PensionType, id: number, data: unknown) =>
		api.put<T>(`${routeFor(type)}/${id}`, data),

	/** Delete a pension */
	delete: (type: PensionType, id: number) => api.delete<void>(`${routeFor(type)}/${id}`),

	/** Update pension status (ACTIVE/PAUSED) */
	updateStatus: (type: PensionType, id: number, data: PensionStatusUpdate) =>
		api.put<void>(`${routeFor(type)}/${id}/status`, data)
};
