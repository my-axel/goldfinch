<!--
@file src/lib/components/compass/GapMemberSection.svelte
@kind component
@purpose Per-member expandable section: Card on the left, plain Explanation on the right — matching the Settings/Pension page pattern.
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import GapConfigForm from './GapConfigForm.svelte';
	import GapResultDisplay from './GapResultDisplay.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { HouseholdMember } from '$lib/types/household';
	import type { RetirementGapConfig, GapAnalysisResult } from '$lib/types/compass';
	import { gapStatusFor } from '$lib/utils/retirement-gap';

	let {
		member,
		config: initialConfig,
		analysis: initialAnalysis
	}: {
		member: HouseholdMember;
		config: RetirementGapConfig | null;
		analysis: GapAnalysisResult | null;
	} = $props();

	// Use untrack to read initial prop values once without creating reactive dependencies.
	// This is intentional: config/analysis are local state managed by user actions after mount.
	let config = $state<RetirementGapConfig | null>(untrack(() => initialConfig));
	let analysis = $state<GapAnalysisResult | null>(untrack(() => initialAnalysis));
	let open = $state(false); // collapsed by default

	function handleSave(savedConfig: RetirementGapConfig, result: GapAnalysisResult) {
		config = savedConfig;
		analysis = result;
	}

	function handleDelete() {
		config = null;
		analysis = null;
	}

	const statusLabel = $derived.by(() => {
		if (!analysis) return null;
		const status = gapStatusFor(analysis.gap.realistic, analysis.required_capital_adjusted);
		if (status === 'on_track')
			return {
				label: m.compass_gap_on_track(),
				cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
			};
		if (status === 'needs_attention')
			return {
				label: m.compass_gap_needs_attention(),
				cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
			};
		return {
			label: m.compass_gap_critical(),
			cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
		};
	});
</script>

<!-- Section header — sits inside a divide-y accordion container in the parent -->
<div>
	<button
		class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
		onclick={() => (open = !open)}
	>
		<div class="flex items-center gap-3">
			<svg
				class="w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 {open
					? 'rotate-90'
					: ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
			<h3 class="text-base font-semibold">
				{m.compass_gap_member_section_title({ name: member.first_name })}
			</h3>
			{#if config}
				<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
					{m.compass_gap_configured()}
				</span>
			{/if}
		</div>
		{#if statusLabel}
			<span class="text-xs px-2.5 py-1 rounded-full font-medium {statusLabel.cls}">
				{statusLabel.label}
			</span>
		{/if}
	</button>

	<!-- Expanded content — follows the Settings/Pension page pattern exactly -->
	{#if open}
		<div class="px-6 pb-8 pt-4 space-y-8 border-t border-border bg-muted/20">
			<!-- 1. Configuration: Card left, Explanation right -->
			<ContentSection>
				<Card
					title={m.compass_gap_setup_title()}
					description={m.compass_gap_setup_description()}
				>
					<GapConfigForm
						memberId={member.id}
						{config}
						onSave={handleSave}
						onDelete={handleDelete}
					/>
				</Card>

				{#snippet aside()}
					<Explanation title={m.compass_explanation_title()}>
						<p class="italic">{m.compass_explanation_formula()}</p>
						<ExplanationList>
							<li>{m.compass_explanation_replacement_rate()}</li>
							<li>{m.compass_explanation_withdrawal_rate()}</li>
							<li>{m.compass_explanation_desired_pension()}</li>
						</ExplanationList>
					</Explanation>
				{/snippet}
			</ContentSection>

			<!-- 2. Results: Card left, income breakdown + capital context right -->
			{#if analysis}
				<ContentSection>
					<Card title={m.compass_gap_results_card_title()}>
						<GapResultDisplay result={analysis} />
					</Card>

					{#snippet aside()}
						<!-- Income sources — explains where the monthly pension income figure comes from -->
						<Explanation title={m.compass_explanation_income_sources()}>
							<div class="space-y-1.5 text-sm">
								<div class="flex justify-between">
									<span>{m.compass_gap_breakdown_state()}</span>
									<span class="font-medium text-foreground">
										<FormattedCurrency value={analysis.breakdown.state_monthly} decimals={0} />
									</span>
								</div>
								<div class="flex justify-between">
									<span>{m.compass_gap_breakdown_company()}</span>
									<span class="font-medium text-foreground">
										<FormattedCurrency value={analysis.breakdown.company_monthly} decimals={0} />
									</span>
								</div>
								<div class="flex justify-between">
									<span>{m.compass_gap_breakdown_insurance()}</span>
									<span class="font-medium text-foreground">
										<FormattedCurrency value={analysis.breakdown.insurance_monthly} decimals={0} />
									</span>
								</div>
							</div>
						</Explanation>

						<!-- Required capital context -->
						<Explanation title={m.compass_explanation_capital_note_title()}>
							<p>{m.compass_explanation_capital_note_text()}</p>
							<p class="font-medium text-foreground mt-1">
								<FormattedCurrency value={analysis.required_capital_adjusted} decimals={0} />
							</p>
						</Explanation>
					{/snippet}
				</ContentSection>
			{:else if !config}
				<p class="text-sm text-muted-foreground">{m.compass_gap_no_config_cta()}</p>
			{/if}
		</div>
	{/if}
</div>
