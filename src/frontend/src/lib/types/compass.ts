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
	annual_salary_growth_rate: number; // e.g. 2.0 = 2% per year
	pension_deduction_rate: number | null; // e.g. 15.0 = 15% gross-to-net deduction
	created_at: string;
	updated_at: string;
}

export interface RetirementGapConfigCreate {
	net_monthly_income: number;
	desired_monthly_pension?: number | null;
	replacement_rate?: number;
	withdrawal_rate?: number;
	annual_salary_growth_rate?: number;
	pension_deduction_rate?: number | null;
}

export interface RetirementGapConfigUpdate {
	net_monthly_income?: number;
	desired_monthly_pension?: number | null;
	replacement_rate?: number;
	withdrawal_rate?: number;
	annual_salary_growth_rate?: number;
	pension_deduction_rate?: number | null;
}

export interface GapScenarios {
	pessimistic: number;
	realistic: number;
	optimistic: number;
}

export interface GapBreakdown {
	state_monthly: GapScenarios;
	company_monthly: number;
	insurance_monthly: number;
	etf_projected: GapScenarios;
	savings_projected: GapScenarios;
}

export interface GapAnalysisResult {
	member_id: number;
	needed_monthly: number;
	needed_monthly_at_retirement: number;
	salary_at_retirement: number;
	uses_override: boolean;
	monthly_pension_income: GapScenarios;
	remaining_monthly_gap: GapScenarios;
	required_capital: GapScenarios;
	years_to_retirement: number;
	required_capital_adjusted: GapScenarios;
	projected_capital: GapScenarios;
	gap: GapScenarios;
	breakdown: GapBreakdown;
	retirement_already_reached: boolean;
}

export interface GapTimelinePoint {
	year: number;
	years_from_now: number;
	required_monthly: number;
	pension_income: GapScenarios;
	state_income: GapScenarios;
	fixed_income: number;
	capital_income: GapScenarios;
}

export interface GapTimeline {
	member_id: number;
	start_year: number;
	retirement_year: number;
	points: GapTimelinePoint[];
	gap_at_retirement: GapScenarios;
}
