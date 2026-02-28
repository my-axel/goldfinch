<!--
@file src/routes/pension/etf/new/+page.svelte
@kind route
@purpose Rendert die Route 'pension/etf/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `$state`, `$derived` und `$effect` organisiert.
@contains Kernfunktionen `validate()`, `handleSubmit()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { PensionType } from '$lib/types/pension';
	import type { ContributionStep } from '$lib/types/pension';
	import { todayIsoDate } from '$lib/utils/date-only';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/etf/BasicInformationCard.svelte';
	import ContributionPlanCard from '$lib/components/pension/ContributionPlanCard.svelte';
	import ScenarioRatesCard from '$lib/components/pension/ScenarioRatesCard.svelte';
	import NumberInput from '$lib/components/ui/NumberInput.svelte';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let memberId = $derived(data.memberId);

	// --- Section toggles ---
	let hasExistingUnits = $state(false);
	let hasPlan = $state(false);
	let realizeHistorical = $state(false);

	// --- Form state ---
	let name = $state('');
	let etfId = $state('');
	let etfDisplayName = $state('');
	// Existing holdings
	let existingUnits = $state(0);
	let referenceDate = $state(todayIsoDate());
	let investedAmount = $state(0);
	// General
	let notes = $state('');
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	// Per-pension scenario rates — initialized from global settings
	let pessimisticRate = $state(settingsStore.current.projection_pessimistic_rate / 100);
	let realisticRate = $state(settingsStore.current.projection_realistic_rate / 100);
	let optimisticRate = $state(settingsStore.current.projection_optimistic_rate / 100);

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = 'Name is required';
		if (!etfId) newErrors.etf_id = 'ETF is required';
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			const pensionData = {
				type: PensionType.ETF_PLAN,
				name: name.trim(),
				member_id: memberId,
				etf_id: etfId,
				is_existing_investment: hasExistingUnits,
				existing_units: hasExistingUnits ? existingUnits : 0,
				reference_date: hasExistingUnits ? referenceDate : undefined,
				invested_amount: hasExistingUnits && investedAmount > 0 ? investedAmount : undefined,
				realize_historical_contributions: hasPlan && realizeHistorical,
				notes: notes.trim() || '',
				status: 'ACTIVE' as const,
				total_units: hasExistingUnits ? existingUnits : 0,
				pessimistic_rate: pessimisticRate * 100,
				realistic_rate: realisticRate * 100,
				optimistic_rate: optimisticRate * 100,
				contribution_plan_steps: hasPlan
					? contributionPlanSteps.map((step) => ({
							amount: step.amount,
							frequency: step.frequency,
							start_date: step.start_date,
							end_date: step.end_date || undefined,
							note: step.note || ''
						}))
					: []
			};

			await pensionApi.create(PensionType.ETF_PLAN, pensionData);

			if (hasExistingUnits && existingUnits > 0) {
				toastStore.success(m.etf_pension_initialized_toast());
			} else {
				toastStore.success(m.etf_pension_created());
			}
			goto('/pension');
		} catch (error) {
			console.error('Error creating ETF pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.etf_pension_create_failed());
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader title={m.etf_pension_new_title()} description={m.etf_pension_new_description()} />
		<div class="flex space-x-4 shrink-0">
			<button
				type="button"
				onclick={() => history.back()}
				class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.cancel()}
			</button>
			<button
				type="submit"
				form="etf-pension-form"
				disabled={submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.etf_pension_create()}
			</button>
		</div>
	</div>

	<form id="etf-pension-form" onsubmit={handleSubmit} class="space-y-8">
		<!-- Section 1: Basic Information -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.etf_basic_info_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem
							><strong>{m.etf_pension_etf()}:</strong>
							{m.etf_basic_info_explanation_etf()}</ExplanationListItem
						>
					</ExplanationList>
					<p class="text-sm font-medium mt-3">{m.etf_basic_info_explanation_search_intro()}</p>
					<ExplanationList>
						<ExplanationListItem>
							<strong>Name:</strong>
							{m.etf_basic_info_explanation_search_by_name()}
						</ExplanationListItem>
						<ExplanationListItem>
							<strong>ISIN:</strong>
							{m.etf_basic_info_explanation_search_by_isin()}
						</ExplanationListItem>
						<ExplanationListItem>
							<strong>Symbol:</strong>
							{m.etf_basic_info_explanation_search_by_symbol()}
						</ExplanationListItem>
					</ExplanationList>
				</Explanation>
			{/snippet}
			<Card title={m.etf_pension_new_title()}>
				<BasicInformationCard
					bind:name
					bind:etfId
					bind:etfDisplayName
					bind:notes
					isEditing={false}
					{errors}
				/>
			</Card>
		</ContentSection>

		<!-- Section 2: Existing Holdings (optional toggle) -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.etf_existing_units_section_description()}</p>
				</Explanation>
			{/snippet}
			<Card title={m.etf_existing_units_section_title()}>
				<div class="space-y-4">
					<!-- Toggle -->
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={hasExistingUnits}
							class="h-4 w-4 rounded border-border accent-primary"
						/>
						<span class="text-sm font-medium">{m.etf_existing_units_toggle()}</span>
					</label>

					{#if hasExistingUnits}
						<div class="grid grid-cols-2 gap-4 pt-2 border-t border-border">
							<!-- Existing Units -->
							<div class="space-y-1">
								<label for="existing-units" class="text-sm font-medium">
									{m.etf_pension_current_units()}
								</label>
								<NumberInput
									bind:value={existingUnits}
									decimals={6}
									placeholder="0.000000"
									min={0}
								/>
							</div>

							<!-- Reference Date -->
							<div class="space-y-1">
								<label for="reference-date" class="text-sm font-medium">
									{m.etf_pension_reference_date()}
								</label>
								<input
									id="reference-date"
									type="date"
									bind:value={referenceDate}
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-9 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<!-- Invested Amount (optional) -->
							<div class="col-span-2 space-y-1">
								<p class="text-sm font-medium">{m.etf_invested_amount_label()}</p>
								<CurrencyInput bind:value={investedAmount} />
								<p class="text-xs text-muted-foreground">{m.etf_invested_amount_hint()}</p>
							</div>
						</div>
					{/if}
				</div>
			</Card>
		</ContentSection>

		<!-- Section 3: Contribution Plan (optional toggle) -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.etf_contribution_plan_section_description()}</p>
					{#if hasPlan}
						<p class="text-sm text-muted-foreground mt-2">{m.etf_contribution_explanation_growth()}</p>
					{/if}
				</Explanation>
			{/snippet}
			<Card title={m.etf_contribution_plan_section_title()}>
				<div class="space-y-4">
					<!-- Toggle -->
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={hasPlan}
							class="h-4 w-4 rounded border-border accent-primary"
						/>
						<span class="text-sm font-medium">{m.etf_contribution_plan_toggle()}</span>
					</label>

					{#if hasPlan}
						<div class="space-y-4 pt-2 border-t border-border">
							<ContributionPlanCard bind:steps={contributionPlanSteps} />

							<!-- Historical realization checkbox -->
							<div class="rounded-lg border border-border p-4 bg-muted space-y-2">
								<label class="flex items-start gap-3 cursor-pointer">
									<input
										type="checkbox"
										bind:checked={realizeHistorical}
										class="h-4 w-4 rounded border-border accent-primary mt-0.5 shrink-0"
									/>
									<div>
										<span class="text-sm font-medium">{m.etf_realize_historical_checkbox()}</span>
										<p class="text-xs text-muted-foreground mt-1">{m.etf_realize_historical_hint()}</p>
									</div>
								</label>
							</div>
						</div>
					{/if}
				</div>
			</Card>
		</ContentSection>

		<!-- Section 4: Scenario Rates -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.pension_scenario_rates_explanation()}</p>
				</Explanation>
			{/snippet}
			<Card title={m.pension_scenario_rates_title()}>
				<ScenarioRatesCard
					bind:pessimisticRate
					bind:realisticRate
					bind:optimisticRate
				/>
			</Card>
		</ContentSection>
	</form>
</div>
