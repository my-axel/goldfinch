/**
 * @file src/lib/utils/retirement-gap.ts
 * @kind util
 * @purpose Shared normalization + aggregation helpers for retirement gap displays.
 */

import type { GapAnalysisResult } from '$lib/types/compass';

export type GapStatus = 'on_track' | 'needs_attention' | 'critical';

export interface GapDisplayValue {
	raw: number;
	absolute: number;
	isSurplus: boolean;
}

export interface NormalizedGapAnalysis {
	pessimistic: number;
	realistic: number;
	optimistic: number;
	requiredCapitalAdjusted: number;
}

export interface GapAggregateSummary {
	count: number;
	totals: {
		pessimistic: number;
		realistic: number;
		optimistic: number;
	};
	totalRequired: number;
}

function toFiniteNumber(value: unknown): number | null {
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function toGapDisplayValue(value: unknown): GapDisplayValue | null {
	const parsed = toFiniteNumber(value);
	if (parsed === null) return null;
	return {
		raw: parsed,
		absolute: Math.abs(parsed),
		isSurplus: parsed <= 0
	};
}

export function normalizeGapAnalysis(
	analysis: GapAnalysisResult | null | undefined
): NormalizedGapAnalysis | null {
	if (!analysis) return null;

	const pessimistic = toFiniteNumber((analysis as { gap?: { pessimistic?: unknown } }).gap?.pessimistic);
	const realistic = toFiniteNumber((analysis as { gap?: { realistic?: unknown } }).gap?.realistic);
	const optimistic = toFiniteNumber((analysis as { gap?: { optimistic?: unknown } }).gap?.optimistic);
	const requiredCapitalAdjusted = toFiniteNumber(
		(analysis as { required_capital_adjusted?: unknown }).required_capital_adjusted
	);

	if (
		pessimistic === null ||
		realistic === null ||
		optimistic === null ||
		requiredCapitalAdjusted === null
	) {
		return null;
	}

	return { pessimistic, realistic, optimistic, requiredCapitalAdjusted };
}

export function aggregateGapAnalyses(
	analyses: (GapAnalysisResult | null | undefined)[]
): GapAggregateSummary {
	const normalized = analyses.map((analysis) => normalizeGapAnalysis(analysis)).filter(Boolean) as NormalizedGapAnalysis[];

	return {
		count: normalized.length,
		totals: {
			pessimistic: normalized.reduce((sum, a) => sum + a.pessimistic, 0),
			realistic: normalized.reduce((sum, a) => sum + a.realistic, 0),
			optimistic: normalized.reduce((sum, a) => sum + a.optimistic, 0)
		},
		totalRequired: normalized.reduce((sum, a) => sum + a.requiredCapitalAdjusted, 0)
	};
}

export function gapStatusFor(realisticGap: unknown, totalRequired: unknown): GapStatus {
	const gap = toFiniteNumber(realisticGap);
	const required = toFiniteNumber(totalRequired);
	if (gap === null || required === null) return 'critical';
	if (gap <= 0) return 'on_track';
	if (required > 0 && gap <= required * 0.25) return 'needs_attention';
	return 'critical';
}
