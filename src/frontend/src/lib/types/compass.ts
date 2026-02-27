/**
 * @file src/lib/types/compass.ts
 * @kind type
 * @purpose TypeScript types for the Compass/Gap Analysis feature.
 */

export interface RetirementGapConfig {
	id: number;
	member_id: number;
	net_monthly_income: number;
	desired_monthly_pension: number | null;
	replacement_rate: number; // e.g. 0.80 = 80%
	withdrawal_rate: number; // e.g. 0.04 = 4%
	created_at: string;
	updated_at: string;
}

export interface RetirementGapConfigCreate {
	net_monthly_income: number;
	desired_monthly_pension?: number | null;
	replacement_rate?: number;
	withdrawal_rate?: number;
}

export interface RetirementGapConfigUpdate {
	net_monthly_income?: number;
	desired_monthly_pension?: number | null;
	replacement_rate?: number;
	withdrawal_rate?: number;
}

export interface GapScenarios {
	pessimistic: number;
	realistic: number;
	optimistic: number;
}

export interface GapBreakdown {
	state_monthly: number;
	company_monthly: number;
	insurance_monthly: number;
	etf_projected: GapScenarios;
	savings_projected: GapScenarios;
}

export interface GapAnalysisResult {
	member_id: number;
	needed_monthly: number;
	uses_override: boolean;
	monthly_pension_income: number;
	remaining_monthly_gap: number;
	required_capital: number;
	years_to_retirement: number;
	required_capital_adjusted: number;
	projected_capital: GapScenarios;
	gap: GapScenarios;
	breakdown: GapBreakdown;
	retirement_already_reached: boolean;
}
