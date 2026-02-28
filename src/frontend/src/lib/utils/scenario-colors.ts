/**
 * @file src/lib/utils/scenario-colors.ts
 * @kind util
 * @purpose Central color tokens for pessimistic/realistic/optimistic scenarios.
 */

export const scenarioColors = {
	pessimistic: 'hsl(320, 65%, 60%)',
	realistic: 'hsl(15, 75%, 55%)',
	optimistic: 'hsl(30, 80%, 55%)'
} as const;

