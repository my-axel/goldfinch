/**
 * @file src/lib/types/pension.ts
 * @kind type
 * @purpose Definiert zentrale Domainmodelle, Enums und Projektionstypen fuer alle Pension-Typen.
 * @contains Das Modul enthaelt 3 Enums, 29 Interfaces und 3 Type-Aliase.
 * @contains Typgruppen decken Domainmodelle, API-Formate und UI-nahe Hilfstypen ab.
 */

// Enums matching backend values

export enum PensionType {
	ETF_PLAN = 'ETF_PLAN',
	INSURANCE = 'INSURANCE',
	COMPANY = 'COMPANY',
	STATE = 'STATE',
	SAVINGS = 'SAVINGS'
}

export enum ContributionFrequency {
	MONTHLY = 'MONTHLY',
	QUARTERLY = 'QUARTERLY',
	SEMI_ANNUALLY = 'SEMI_ANNUALLY',
	ANNUALLY = 'ANNUALLY',
	ONE_TIME = 'ONE_TIME'
}

export enum CompoundingFrequency {
	DAILY = 'DAILY',
	MONTHLY = 'MONTHLY',
	QUARTERLY = 'QUARTERLY',
	SEMI_ANNUALLY = 'SEMI_ANNUALLY',
	ANNUALLY = 'ANNUALLY'
}

// --- Shared interfaces ---

export interface ContributionStep {
	id?: number;
	amount: number;
	frequency: ContributionFrequency;
	start_date: string;
	end_date?: string;
	note?: string;
}

export interface ExtraContribution {
	id: number;
	pension_id: number;
	amount: number;
	contribution_date: string;
	is_manual?: boolean;
	note?: string;
}

export interface PensionStatusUpdate {
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
}

// --- ETF Pension ---

export interface ETFPension {
	id: number;
	type: PensionType.ETF_PLAN;
	name: string;
	member_id: number;
	current_value: number;
	total_units: number;
	notes?: string;
	etf_id: string;
	etf?: { id: string; name: string; symbol: string; isin: string; currency: string; last_price: number; last_update: string };
	is_existing_investment: boolean;
	existing_units?: number;
	reference_date?: string;
	realize_historical_contributions?: boolean;
	contribution_plan_steps: ContributionStep[];
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
}

// --- Insurance Pension ---

export interface InsurancePensionProjection {
	id?: number;
	statement_id?: number;
	scenario_type: 'with_contributions' | 'without_contributions';
	return_rate: number;
	value_at_retirement: number;
	monthly_payout: number;
}

export interface InsurancePensionStatement {
	id?: number;
	pension_id?: number;
	statement_date: string;
	value: number;
	total_contributions: number;
	total_benefits: number;
	costs_amount: number;
	costs_percentage: number;
	note?: string;
	projections?: InsurancePensionProjection[];
}

export interface InsurancePension {
	id: number;
	type: PensionType.INSURANCE;
	name: string;
	member_id: number;
	start_date: string;
	retirement_date?: string;
	notes?: string;
	provider: string;
	contract_number?: string;
	guaranteed_interest?: number;
	expected_return?: number;
	contribution_plan_steps: ContributionStep[];
	contribution_history?: ExtraContribution[];
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	statements?: InsurancePensionStatement[];
}

// --- Company Pension ---

export interface PensionCompanyRetirementProjection {
	id: number;
	statement_id: number;
	retirement_age: number;
	monthly_payout: number;
	total_capital: number;
}

export interface PensionCompanyStatement {
	id: number;
	pension_id: number;
	statement_date: string;
	value: number;
	note?: string;
	retirement_projections?: PensionCompanyRetirementProjection[];
}

export interface CompanyPension {
	id: number;
	type: PensionType.COMPANY;
	name: string;
	member_id: number;
	start_date: string;
	current_value: number;
	notes?: string;
	employer: string;
	contribution_amount?: number;
	contribution_frequency?: ContributionFrequency;
	contribution_plan_steps: ContributionStep[];
	contribution_history?: ExtraContribution[];
	statements?: PensionCompanyStatement[];
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
}

// --- State Pension ---

export interface StatePensionStatement {
	id: number;
	pension_id: number;
	statement_date: string;
	current_monthly_amount?: number;
	projected_monthly_amount?: number;
	current_value?: number;
	note?: string;
}

export interface StatePensionScenario {
	monthly_amount: number;
	annual_amount: number;
	retirement_age: number;
	years_to_retirement: number;
	growth_rate: number;
}

export interface StatePensionProjection {
	planned: {
		pessimistic: StatePensionScenario;
		realistic: StatePensionScenario;
		optimistic: StatePensionScenario;
	};
	possible: {
		pessimistic: StatePensionScenario;
		realistic: StatePensionScenario;
		optimistic: StatePensionScenario;
	};
}

export interface StatePension {
	id: number;
	type: PensionType.STATE;
	name: string;
	member_id: number;
	start_date: string;
	notes?: string;
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	statements?: StatePensionStatement[];
}

// --- Savings Pension ---

export interface SavingsPensionStatement {
	id: number;
	pension_id: number;
	statement_date: string;
	balance: number;
	note?: string;
}

export interface SavingsPensionScenario {
	balance: number;
	retirement_age: number;
	years_to_retirement: number;
	growth_rate: number;
	total_contributions: number;
	balance_without_contributions: number;
}

export interface SavingsPensionProjection {
	planned: {
		pessimistic: SavingsPensionScenario;
		realistic: SavingsPensionScenario;
		optimistic: SavingsPensionScenario;
	};
	possible: {
		pessimistic: SavingsPensionScenario;
		realistic: SavingsPensionScenario;
		optimistic: SavingsPensionScenario;
	};
}

export interface SavingsPension {
	id: number;
	type: PensionType.SAVINGS;
	name: string;
	member_id: number;
	start_date: string;
	notes?: string;
	pessimistic_rate: number;
	realistic_rate: number;
	optimistic_rate: number;
	compounding_frequency: CompoundingFrequency;
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	statements?: SavingsPensionStatement[];
	contribution_plan_steps: ContributionStep[];
}

// --- Union types ---

export type Pension = ETFPension | InsurancePension | CompanyPension | StatePension | SavingsPension;

// --- Lightweight list types (from /pension-summaries endpoints) ---

export interface ETFPensionList {
	id: number;
	name: string;
	member_id: number;
	current_value: number;
	total_units: number;
	etf_id: string;
	etf_name: string;
	status: 'ACTIVE' | 'PAUSED';
	is_existing_investment: boolean;
	existing_units?: number;
	paused_at?: string;
	resume_at?: string;
	current_step_amount?: number;
	current_step_frequency?: ContributionFrequency;
}

export interface InsurancePensionList {
	id: number;
	name: string;
	member_id: number;
	current_value: number;
	provider: string;
	start_date: string;
	contract_number?: string;
	guaranteed_interest?: number;
	expected_return?: number;
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	latest_statement_date?: string;
}

export interface CompanyPensionList {
	id: number;
	name: string;
	member_id: number;
	current_value: number;
	employer: string;
	start_date: string;
	contribution_amount?: number;
	contribution_frequency?: ContributionFrequency;
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	current_step_amount?: number;
	current_step_frequency?: ContributionFrequency;
	latest_statement_date?: string;
	latest_projections?: Array<{
		retirement_age: number;
		monthly_payout: number;
	}>;
}

export interface StatePensionList {
	id: number;
	name: string;
	member_id: number;
	start_date: string;
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	latest_statement_date?: string;
	latest_monthly_amount?: number;
	latest_projected_amount?: number;
	latest_current_value?: number;
	statements_count: number;
}

export interface SavingsPensionList {
	id: number;
	name: string;
	member_id: number;
	status: 'ACTIVE' | 'PAUSED';
	paused_at?: string;
	resume_at?: string;
	latest_balance?: number;
	latest_statement_date?: string;
	pessimistic_rate: number;
	realistic_rate: number;
	optimistic_rate: number;
	compounding_frequency: CompoundingFrequency;
	current_step_amount?: number;
	current_step_frequency?: ContributionFrequency;
}

export type PensionListItem =
	| (ETFPensionList & { type: PensionType.ETF_PLAN })
	| (InsurancePensionList & { type: PensionType.INSURANCE })
	| (CompanyPensionList & { type: PensionType.COMPANY })
	| (StatePensionList & { type: PensionType.STATE })
	| (SavingsPensionList & { type: PensionType.SAVINGS });

// --- ETF Pension Statistics ---

export interface ETFContributionHistory {
	contribution_date: string;
	amount: number;
	is_manual: boolean;
	note?: string;
}

export interface ETFValueHistory {
	date: string;
	value: number;
}

export interface ETFPensionStatistics {
	total_invested_amount: number;
	current_value: number;
	total_return: number;
	annual_return?: number;
	contribution_history: ETFContributionHistory[];
	value_history: ETFValueHistory[];
}

// --- Projection types ---

export type ScenarioType = 'pessimistic' | 'realistic' | 'optimistic';

export interface ProjectionDataPoint {
	date: Date;
	value: number;
	contributionAmount?: number;
	accumulatedContributions?: number;
	scenarioType?: ScenarioType;
	isProjection?: boolean;
}

export interface ProjectionScenario {
	type: ScenarioType;
	dataPoints: ProjectionDataPoint[];
	returnRate?: number;
	finalValue: number;
	totalContributions: number;
	totalReturns: number;
}

export interface CombinedScenariosOutput {
	scenarios: {
		pessimistic: ProjectionScenario;
		realistic: ProjectionScenario;
		optimistic: ProjectionScenario;
	};
	metadata: {
		totalCalculationTime: number;
		dataPoints: number;
		startDate: Date;
		endDate: Date;
		totalContributions: number;
		initialValue: number;
	};
}

// Route segment mapping for API calls
export const PENSION_ROUTE_MAP: Record<PensionType, string> = {
	[PensionType.ETF_PLAN]: 'etf',
	[PensionType.INSURANCE]: 'insurance',
	[PensionType.COMPANY]: 'company',
	[PensionType.STATE]: 'state',
	[PensionType.SAVINGS]: 'savings'
};
