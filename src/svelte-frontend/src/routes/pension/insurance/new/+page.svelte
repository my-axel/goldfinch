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
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/insurance/BasicInformationCard.svelte';
	import StatementsCard from '$lib/components/pension/insurance/StatementsCard.svelte';
	import ContributionPlanCard from '$lib/components/pension/ContributionPlanCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface ProjectionFormData {
		id: number;
		scenario_type: 'with_contributions' | 'without_contributions';
		return_rate: number;
		value_at_retirement: number;
		monthly_payout: number;
	}

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		value: number;
		total_contributions: number;
		total_benefits: number;
		costs_amount: number;
		costs_percentage: number;
		note?: string;
		projections: ProjectionFormData[];
	}

	// Form state
	let name = $state('');
	let provider = $state('');
	let contractNumber = $state('');
	let startDate = $state(todayIsoDate());
	let guaranteedInterest = $state(0); // form decimal
	let expectedReturn = $state(0); // form decimal
	let notes = $state('');
	let statements = $state<StatementFormData[]>([]);
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	let memberId = $derived(data.memberId);

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = m.insurance_pension_name_required();
		if (!startDate) newErrors.start_date = m.insurance_pension_start_date_required();
		if (!provider.trim()) newErrors.provider = m.insurance_pension_provider_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			const pensionData = {
				type: PensionType.INSURANCE,
				name: name.trim(),
				member_id: memberId,
				start_date: startDate,
				provider: provider.trim(),
				contract_number: contractNumber.trim() || undefined,
				guaranteed_interest: guaranteedInterest ? guaranteedInterest * 100 : undefined,
				expected_return: expectedReturn ? expectedReturn * 100 : undefined,
				notes: notes.trim() || '',
				status: 'ACTIVE' as const,
				contribution_plan_steps: contributionPlanSteps.map((step) => ({
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			const created = await pensionApi.create<{ id: number }>(PensionType.INSURANCE, pensionData);

			// POST each statement separately (insurance does NOT accept statements in create body)
			await Promise.all(
				statements
					.filter((s) => s.statement_date)
					.map((s) =>
						pensionApi.addInsurancePensionStatement(created.id, {
							statement_date: s.statement_date,
							value: s.value || 0,
							total_contributions: s.total_contributions || 0,
							total_benefits: s.total_benefits || 0,
							costs_amount: s.costs_amount || 0,
							costs_percentage: s.costs_percentage * 100, // decimal → API %
							note: s.note || '',
							projections: s.projections.map((p) => ({
								scenario_type: p.scenario_type,
								return_rate: p.return_rate * 100, // decimal → API %
								value_at_retirement: p.value_at_retirement || 0,
								monthly_payout: p.monthly_payout || 0
							}))
						})
					)
			);

			toastStore.success(m.insurance_pension_created());
			goto('/pension');
		} catch (error) {
			console.error('Error creating insurance pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.insurance_pension_create_failed()
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
			title={m.insurance_pension_new_title()}
			description={m.insurance_pension_new_description()}
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
				form="insurance-pension-form"
				disabled={submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.insurance_pension_create()}
			</button>
		</div>
	</div>

	<form id="insurance-pension-form" onsubmit={handleSubmit} class="space-y-8">
		<!-- Basic Information Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.insurance_pension_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.insurance_pension_name()}:</strong> {m.insurance_pension_explanation_name()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_provider()}:</strong> {m.insurance_pension_explanation_provider()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_contract_number()}:</strong> {m.insurance_pension_explanation_contract_number()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_start_date()}:</strong> {m.insurance_pension_explanation_start_date()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_guaranteed_interest()}:</strong> {m.insurance_pension_explanation_guaranteed()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_expected_return()}:</strong> {m.insurance_pension_explanation_expected()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_notes()}:</strong> {m.insurance_pension_explanation_notes()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.insurance_pension_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card
				title={m.insurance_pension_basic_info()}
				description={m.insurance_pension_basic_info_description()}
			>
				<BasicInformationCard
					bind:name
					bind:provider
					bind:contractNumber
					bind:startDate
					bind:guaranteedInterest
					bind:expectedReturn
					bind:notes
					{errors}
				/>
			</Card>
		</ContentSection>

		<!-- Statements Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.insurance_pension_statements_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.insurance_pension_value()}:</strong> {m.insurance_pension_statements_explanation_value()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_total_contributions()}:</strong> {m.insurance_pension_statements_explanation_contributions()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_total_benefits()}:</strong> {m.insurance_pension_statements_explanation_benefits()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_costs_amount()} / {m.insurance_pension_costs_percentage()}:</strong> {m.insurance_pension_statements_explanation_costs()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.insurance_pension_projections()}:</strong> {m.insurance_pension_statements_explanation_projections()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.insurance_pension_statements_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card
				title={m.insurance_pension_statements()}
				description={m.insurance_pension_statements_description()}
			>
				<StatementsCard bind:statements />
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
