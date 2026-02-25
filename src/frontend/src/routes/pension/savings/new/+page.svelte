<!--
@file src/routes/pension/savings/new/+page.svelte
@kind route
@purpose Rendert die Route 'pension/savings/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `\$state`, `\$derived` und `\$effect` organisiert.
@contains Kernfunktionen `validate()`, `handleSubmit()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { PensionType, CompoundingFrequency } from '$lib/types/pension';
	import type { ContributionStep } from '$lib/types/pension';
	import { todayIsoDate } from '$lib/utils/date-only';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/savings/BasicInformationCard.svelte';
	import ScenarioRatesCard from '$lib/components/pension/ScenarioRatesCard.svelte';
	import StatementsCard from '$lib/components/pension/savings/StatementsCard.svelte';
	import ContributionPlanCard from '$lib/components/pension/ContributionPlanCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		balance: number;
		note?: string;
	}

	// Form state
	let name = $state('');
	let startDate = $state(todayIsoDate());
	let notes = $state('');
	let compoundingFrequency = $state(CompoundingFrequency.ANNUALLY);
	// Rates stored as decimals (0.01 = 1%), PercentInput handles display
	let pessimisticRate = $state(0.01);
	let realisticRate = $state(0.02);
	let optimisticRate = $state(0.03);
	let statements = $state<StatementFormData[]>([]);
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	let memberId = $derived(data.memberId);

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = m.savings_pension_name_required();
		if (!startDate) newErrors.start_date = m.savings_pension_start_date_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			// Savings pension does NOT accept statements in the create body —
			// create the pension first, then POST each statement individually.
			const pensionData = {
				type: PensionType.SAVINGS,
				name: name.trim(),
				member_id: memberId,
				start_date: startDate,
				notes: notes.trim() || '',
				status: 'ACTIVE' as const,
				// Convert decimals to percentages for API
				pessimistic_rate: pessimisticRate * 100,
				realistic_rate: realisticRate * 100,
				optimistic_rate: optimisticRate * 100,
				compounding_frequency: compoundingFrequency,
				contribution_plan_steps: contributionPlanSteps.map(step => ({
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			const created = await pensionApi.create<{ id: number }>(PensionType.SAVINGS, pensionData);

			// Now POST each statement separately
			await Promise.all(
				statements
					.filter(s => s.statement_date)
					.map(s => pensionApi.addSavingsPensionStatement(created.id, {
						statement_date: s.statement_date,
						balance: s.balance || 0,
						note: s.note || ''
					}))
			);

			toastStore.success(m.savings_pension_created());
			goto('/pension');
		} catch (error) {
			console.error('Error creating savings pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.savings_pension_create_failed());
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.savings_pension_new_title()}
			description={m.savings_pension_new_description()}
		/>
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
				form="savings-pension-form"
				disabled={submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.savings_pension_create()}
			</button>
		</div>
	</div>

	<form id="savings-pension-form" onsubmit={handleSubmit} class="space-y-8">
		<!-- Basic Information Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.savings_pension_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.savings_pension_start_date()}:</strong> {m.savings_pension_explanation_start_date()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.savings_pension_compounding_frequency()}:</strong> {m.savings_pension_explanation_compounding()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.savings_pension_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card title={m.savings_pension_basic_info()} description={m.savings_pension_basic_info_description()}>
				<BasicInformationCard bind:name bind:startDate bind:compoundingFrequency bind:notes {errors} />
			</Card>
		</ContentSection>

		<!-- Interest Rates Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.savings_pension_interest_rates_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.pension_scenario_pessimistic_rate()}:</strong> {m.savings_pension_interest_rates_explanation_pessimistic()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.pension_scenario_realistic_rate()}:</strong> {m.savings_pension_interest_rates_explanation_realistic()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.pension_scenario_optimistic_rate()}:</strong> {m.savings_pension_interest_rates_explanation_optimistic()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.savings_pension_interest_rates_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card title={m.savings_pension_interest_rates()} description={m.savings_pension_interest_rates_description()}>
				<ScenarioRatesCard bind:pessimisticRate bind:realisticRate bind:optimisticRate />
			</Card>
		</ContentSection>

		<!-- Statements Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.savings_pension_statements_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.savings_pension_statement_date()}:</strong> {m.savings_pension_statements_explanation_date()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.savings_pension_balance()}:</strong> {m.savings_pension_statements_explanation_balance()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.savings_pension_statement_note()}:</strong> {m.savings_pension_statements_explanation_note()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.savings_pension_statements_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card title={m.savings_pension_statements()} description={m.savings_pension_statements_description()}>
				<StatementsCard bind:statements />
			</Card>
		</ContentSection>

		<!-- Contribution Plan Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.savings_pension_contribution_plan_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.contribution_amount()}:</strong> {m.savings_pension_contribution_plan_explanation_amount()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.contribution_frequency()}:</strong> {m.savings_pension_contribution_plan_explanation_frequency()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.contribution_start_date()} / {m.contribution_end_date()}:</strong> {m.savings_pension_contribution_plan_explanation_dates()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.savings_pension_contribution_plan_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<ContributionPlanCard bind:steps={contributionPlanSteps} />
		</ContentSection>
	</form>
</div>
