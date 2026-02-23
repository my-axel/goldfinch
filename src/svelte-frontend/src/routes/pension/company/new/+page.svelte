<!--
@file src/routes/pension/company/new/+page.svelte
@kind route
@purpose Rendert die Route 'pension/company/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `\$state`, `\$derived` und `\$effect` organisiert.
@contains Kernfunktionen `validate()`, `handleSubmit()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { PensionType } from '$lib/types/pension';
	import type { ContributionStep, ContributionFrequency } from '$lib/types/pension';
	import { todayIsoDate } from '$lib/utils/date-only';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/company/BasicInformationCard.svelte';
	import StatementsCard from '$lib/components/pension/company/StatementsCard.svelte';
	import ContributionPlanCard from '$lib/components/pension/ContributionPlanCard.svelte';
	import ScenarioRatesCard from '$lib/components/pension/ScenarioRatesCard.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface RetirementProjectionFormData {
		id: number;
		retirement_age: number;
		monthly_payout: number;
		total_capital: number;
	}

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		value: number;
		note?: string;
		retirement_projections: RetirementProjectionFormData[];
	}

	// Form state
	let name = $state('');
	let employer = $state('');
	let startDate = $state(todayIsoDate());
	let contributionAmount = $state(0);
	let contributionFrequency = $state<ContributionFrequency | undefined>(undefined);
	let notes = $state('');
	let statements = $state<StatementFormData[]>([]);
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	// Per-pension scenario rates — initialized from global settings (user can override before creating)
	let pessimisticRate = $state(settingsStore.current.projection_pessimistic_rate / 100);
	let realisticRate = $state(settingsStore.current.projection_realistic_rate / 100);
	let optimisticRate = $state(settingsStore.current.projection_optimistic_rate / 100);

	let memberId = $derived(data.memberId);

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = m.company_pension_name_required();
		if (!startDate) newErrors.start_date = m.company_pension_start_date_required();
		if (!employer.trim()) newErrors.employer = m.company_pension_employer_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			const pensionData = {
				type: PensionType.COMPANY,
				name: name.trim(),
				member_id: memberId,
				start_date: startDate,
				employer: employer.trim(),
				contribution_amount: contributionAmount || undefined,
				contribution_frequency: contributionFrequency || undefined,
				notes: notes.trim() || '',
				status: 'ACTIVE' as const,
				contribution_plan_steps: contributionPlanSteps.map((step) => ({
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				})),
				pessimistic_rate: pessimisticRate * 100,
				realistic_rate: realisticRate * 100,
				optimistic_rate: optimisticRate * 100
			};

			const created = await pensionApi.create<{ id: number }>(PensionType.COMPANY, pensionData);

			// POST each statement separately (company does NOT accept statements in create body)
			await Promise.all(
				statements
					.filter((s) => s.statement_date)
					.map((s) =>
						pensionApi.addCompanyPensionStatement(created.id, {
							statement_date: s.statement_date,
							value: s.value || 0,
							note: s.note || '',
							retirement_projections: s.retirement_projections.map((p) => ({
								retirement_age: p.retirement_age || 67,
								monthly_payout: p.monthly_payout || 0,
								total_capital: p.total_capital || 0
							}))
						})
					)
			);

			toastStore.success(m.company_pension_created());
			goto('/pension');
		} catch (error) {
			console.error('Error creating company pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.company_pension_create_failed()
			);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.company_pension_new_title()}
			description={m.company_pension_new_description()}
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
				form="company-pension-form"
				disabled={submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.company_pension_create()}
			</button>
		</div>
	</div>

	<form id="company-pension-form" onsubmit={handleSubmit} class="space-y-8">
		<!-- Basic Information Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.company_pension_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.company_pension_name()}:</strong> {m.company_pension_explanation_name()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.company_pension_employer()}:</strong> {m.company_pension_explanation_employer()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.company_pension_start_date()}:</strong> {m.company_pension_explanation_start_date()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.company_pension_contribution_amount()}:</strong> {m.company_pension_explanation_contribution()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.company_pension_notes()}:</strong> {m.company_pension_explanation_notes()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.company_pension_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card
				title={m.company_pension_basic_info()}
				description={m.company_pension_basic_info_description()}
			>
				<BasicInformationCard
					bind:name
					bind:employer
					bind:startDate
					bind:contributionAmount
					bind:contributionFrequency
					bind:notes
					{errors}
				/>
			</Card>
		</ContentSection>

		<!-- Statements Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.company_pension_statements_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.company_pension_value()}:</strong> {m.company_pension_statements_explanation_value()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.company_pension_projections()}:</strong> {m.company_pension_statements_explanation_projections()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.company_pension_statements_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card
				title={m.company_pension_statements()}
				description={m.company_pension_statements_description()}
			>
				<StatementsCard bind:statements />
			</Card>
		</ContentSection>

		<!-- Projection Rates Section -->
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

		<!-- Contribution Plan Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<ExplanationList>
						<ExplanationListItem><strong>{m.contribution_amount()}:</strong> {m.contribution_amount()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.contribution_frequency()}:</strong> {m.contribution_frequency()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.contribution_start_date()} / {m.contribution_end_date()}:</strong> {m.contribution_start_date()}</ExplanationListItem>
					</ExplanationList>
				</Explanation>
			{/snippet}
			<ContributionPlanCard bind:steps={contributionPlanSteps} />
		</ContentSection>
	</form>
</div>
