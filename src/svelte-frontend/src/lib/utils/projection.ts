/**
 * @file src/lib/utils/projection.ts
 * @kind util
 * @purpose Berechnet projektionale Szenarien ueber Beitragsplaene, Renditen und Zeitraeume.
 * @contains Hilfsfunktionen `getContributionForDate()`, `calculateCombinedScenarios()` kapseln wiederverwendbare Berechnungs- und Transformationslogik.
 * @contains Die Exporte sind seiteneffektarm und fuer komponentenuebergreifende Nutzung ausgelegt.
 */

import { differenceInMonths } from 'date-fns';
import type {
	ContributionStep,
	ProjectionDataPoint,
	ProjectionScenario,
	CombinedScenariosOutput,
	ScenarioType
} from '$lib/types/pension';
import { ContributionFrequency } from '$lib/types/pension';

const MONTHS_PER_YEAR = 12;

/**
 * Determines the contribution amount for a given date based on contribution steps.
 * Svelte types store dates as strings, so we parse them here.
 */
function getContributionForDate(date: Date, steps: ContributionStep[]): number {
	const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);

	const applicableStep = steps.find((step) => {
		const stepStart = new Date(step.start_date);
		const stepStartNorm = new Date(stepStart.getFullYear(), stepStart.getMonth(), 1);
		const stepEnd = step.end_date ? new Date(step.end_date) : undefined;
		const stepEndNorm = stepEnd
			? new Date(stepEnd.getFullYear(), stepEnd.getMonth() + 1, 0)
			: undefined;

		const isAfterStart = normalizedDate >= stepStartNorm;
		const isBeforeEnd = !stepEndNorm || normalizedDate <= stepEndNorm;
		return isAfterStart && isBeforeEnd;
	});

	if (!applicableStep) return 0;

	const stepStart = new Date(applicableStep.start_date);

	if (applicableStep.frequency === ContributionFrequency.ONE_TIME) {
		const isSameMonth =
			date.getMonth() === stepStart.getMonth() &&
			date.getFullYear() === stepStart.getFullYear();
		return isSameMonth ? Number(applicableStep.amount) : 0;
	}

	switch (applicableStep.frequency) {
		case ContributionFrequency.MONTHLY:
			return Number(applicableStep.amount);
		case ContributionFrequency.QUARTERLY: {
			const monthsSinceStart = differenceInMonths(
				normalizedDate,
				new Date(stepStart.getFullYear(), stepStart.getMonth(), 1)
			);
			return monthsSinceStart % 3 === 0 ? Number(applicableStep.amount) : 0;
		}
		case ContributionFrequency.SEMI_ANNUALLY: {
			const monthsSinceStart = differenceInMonths(
				normalizedDate,
				new Date(stepStart.getFullYear(), stepStart.getMonth(), 1)
			);
			return monthsSinceStart % 6 === 0 ? Number(applicableStep.amount) : 0;
		}
		case ContributionFrequency.ANNUALLY: {
			const isSameMonth = normalizedDate.getMonth() === stepStart.getMonth();
			return isSameMonth ? Number(applicableStep.amount) : 0;
		}
		default:
			return 0;
	}
}

/**
 * Calculates all three projection scenarios (pessimistic, realistic, optimistic)
 * in a single pass for performance.
 *
 * Port of React's calculateCombinedScenarios from src/frontend/lib/projection-utils.ts
 */
export function calculateCombinedScenarios(params: {
	initialValue: number;
	contributionSteps: ContributionStep[];
	rates: { pessimistic: number; realistic: number; optimistic: number };
	startDate: Date;
	endDate: Date;
	historicalContributions?: { amount: number }[];
}): CombinedScenariosOutput {
	const {
		initialValue,
		contributionSteps,
		rates,
		startDate,
		endDate,
		historicalContributions = []
	} = params;

	const startTime = performance.now();

	let pessimisticValue = initialValue;
	let realisticValue = initialValue;
	let optimisticValue = initialValue;

	const monthlyRates = {
		pessimistic: rates.pessimistic / 100 / MONTHS_PER_YEAR,
		realistic: rates.realistic / 100 / MONTHS_PER_YEAR,
		optimistic: rates.optimistic / 100 / MONTHS_PER_YEAR
	};

	const pessimisticPoints: ProjectionDataPoint[] = [];
	const realisticPoints: ProjectionDataPoint[] = [];
	const optimisticPoints: ProjectionDataPoint[] = [];

	let accumulatedContributions = historicalContributions.reduce(
		(sum, c) => sum + Number(c.amount),
		0
	);

	const currentDate = new Date(startDate);

	while (currentDate < endDate) {
		const contribution = getContributionForDate(currentDate, contributionSteps);

		pessimisticValue = (pessimisticValue + contribution) * (1 + monthlyRates.pessimistic);
		realisticValue = (realisticValue + contribution) * (1 + monthlyRates.realistic);
		optimisticValue = (optimisticValue + contribution) * (1 + monthlyRates.optimistic);

		accumulatedContributions += contribution;

		const date = new Date(currentDate);

		pessimisticPoints.push({
			date,
			value: pessimisticValue,
			contributionAmount: contribution,
			accumulatedContributions,
			scenarioType: 'pessimistic',
			isProjection: true
		});
		realisticPoints.push({
			date,
			value: realisticValue,
			contributionAmount: contribution,
			accumulatedContributions,
			scenarioType: 'realistic',
			isProjection: true
		});
		optimisticPoints.push({
			date,
			value: optimisticValue,
			contributionAmount: contribution,
			accumulatedContributions,
			scenarioType: 'optimistic',
			isProjection: true
		});

		currentDate.setMonth(currentDate.getMonth() + 1);
	}

	// Add final retirement date point
	const finalDate = new Date(endDate);
	const finalContribution = getContributionForDate(finalDate, contributionSteps);

	pessimisticValue = (pessimisticValue + finalContribution) * (1 + monthlyRates.pessimistic);
	realisticValue = (realisticValue + finalContribution) * (1 + monthlyRates.realistic);
	optimisticValue = (optimisticValue + finalContribution) * (1 + monthlyRates.optimistic);
	accumulatedContributions += finalContribution;

	pessimisticPoints.push({
		date: finalDate,
		value: pessimisticValue,
		contributionAmount: finalContribution,
		accumulatedContributions,
		scenarioType: 'pessimistic',
		isProjection: true
	});
	realisticPoints.push({
		date: finalDate,
		value: realisticValue,
		contributionAmount: finalContribution,
		accumulatedContributions,
		scenarioType: 'realistic',
		isProjection: true
	});
	optimisticPoints.push({
		date: finalDate,
		value: optimisticValue,
		contributionAmount: finalContribution,
		accumulatedContributions,
		scenarioType: 'optimistic',
		isProjection: true
	});

	const endTime = performance.now();

	return {
		scenarios: {
			pessimistic: {
				type: 'pessimistic' as const,
				dataPoints: pessimisticPoints,
				returnRate: rates.pessimistic,
				finalValue: pessimisticValue,
				totalContributions: accumulatedContributions,
				totalReturns: pessimisticValue - accumulatedContributions - initialValue
			},
			realistic: {
				type: 'realistic' as const,
				dataPoints: realisticPoints,
				returnRate: rates.realistic,
				finalValue: realisticValue,
				totalContributions: accumulatedContributions,
				totalReturns: realisticValue - accumulatedContributions - initialValue
			},
			optimistic: {
				type: 'optimistic' as const,
				dataPoints: optimisticPoints,
				returnRate: rates.optimistic,
				finalValue: optimisticValue,
				totalContributions: accumulatedContributions,
				totalReturns: optimisticValue - accumulatedContributions - initialValue
			}
		},
		metadata: {
			totalCalculationTime: endTime - startTime,
			dataPoints: pessimisticPoints.length,
			startDate,
			endDate,
			totalContributions: accumulatedContributions,
			initialValue
		}
	};
}
