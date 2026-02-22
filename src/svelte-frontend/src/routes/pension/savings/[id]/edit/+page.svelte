<!--
@file src/routes/pension/savings/[id]/edit/+page.svelte
@kind route
@purpose Rendert die Route 'pension/savings/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `\$state`, `\$derived` und `\$effect` organisiert.
@contains Kernfunktionen `hydrateForm()`, `validate()`, `handleSubmit()`, `handlePause()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { PensionType, CompoundingFrequency } from '$lib/types/pension';
	import type { SavingsPension, ContributionStep } from '$lib/types/pension';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/savings/BasicInformationCard.svelte';
	import InterestRatesCard from '$lib/components/pension/savings/InterestRatesCard.svelte';
	import StatementsCard from '$lib/components/pension/savings/StatementsCard.svelte';
	import ContributionPlanCard from '$lib/components/pension/ContributionPlanCard.svelte';
	import ContributionHistoryCard from '$lib/components/pension/ContributionHistoryCard.svelte';
	import OneTimeInvestmentModal from '$lib/components/pension/savings/OneTimeInvestmentModal.svelte';
	import PensionStatusActions from '$lib/components/pension/PensionStatusActions.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pensionId = $derived(data.pensionId);

	// Loading/error state
	let loadError = $state('');
	let submitting = $state(false);
	let showOneTimeModal = $state(false);

	// Pension data
	let pension = $state<SavingsPension | null>(null);

	// Form state
	let name = $state('');
	let startDate = $state('');
	let notes = $state('');
	let compoundingFrequency = $state<CompoundingFrequency>(CompoundingFrequency.ANNUALLY);
	// Rates stored as decimals (0.02 = 2%)
	let pessimisticRate = $state(0.01);
	let realisticRate = $state(0.02);
	let optimisticRate = $state(0.03);

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		balance: number;
		note?: string;
	}
	let statements = $state<StatementFormData[]>([]);
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});

	function hydrateForm(currentPension: SavingsPension) {
		name = currentPension.name;
		startDate = currentPension.start_date;
		notes = currentPension.notes ?? '';
		compoundingFrequency = currentPension.compounding_frequency;
		// API rates are percentages (2.0 = 2%), convert to decimals for form
		pessimisticRate = currentPension.pessimistic_rate / 100;
		realisticRate = currentPension.realistic_rate / 100;
		optimisticRate = currentPension.optimistic_rate / 100;
		statements = (currentPension.statements ?? []).map((statement) => ({
			...statement,
			balance: statement.balance ?? 0
		}));
		contributionPlanSteps = (currentPension.contribution_plan_steps ?? []).map((step) => ({
			...step
		}));
	}

	$effect(() => {
		loadError = data.initialError;
		pension = data.initialPension;
		if (data.initialPension) {
			hydrateForm(data.initialPension);
		}
	});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = m.savings_pension_name_required();
		if (!startDate) newErrors.start_date = m.savings_pension_start_date_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate() || !pension) return;

		submitting = true;
		try {
			// Savings pension does NOT accept statements in the update body —
			// update pension first, then manage statements via their own endpoints.
			const pensionData = {
				name: name.trim(),
				start_date: startDate,
				notes: notes.trim() || '',
				// Convert decimals back to percentages for API
				pessimistic_rate: pessimisticRate * 100,
				realistic_rate: realisticRate * 100,
				optimistic_rate: optimisticRate * 100,
				compounding_frequency: compoundingFrequency,
				contribution_plan_steps: contributionPlanSteps.map(step => ({
					id: step.id,
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			await pensionApi.update(PensionType.SAVINGS, pensionId, pensionData);

			// Manage statements separately:
			// - id === 0 → new statement, POST
			// - id > 0 → existing statement, PUT to update
			await Promise.all(
				statements
					.filter(s => s.statement_date)
					.map(s => {
						const payload = {
							statement_date: s.statement_date,
							balance: s.balance || 0,
							note: s.note || ''
						};
						return s.id
							? pensionApi.updateSavingsPensionStatement(pensionId, s.id, payload)
							: pensionApi.addSavingsPensionStatement(pensionId, payload);
					})
			);

			toastStore.success(m.savings_pension_updated());
			goto('/pension');
		} catch (error) {
			console.error('Error updating savings pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.savings_pension_update_failed());
		} finally {
			submitting = false;
		}
	}

	async function handlePause(pauseDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.SAVINGS, pensionId, {
				status: 'PAUSED',
				paused_at: pauseDate
			});
			pension = await pensionApi.get<SavingsPension>(PensionType.SAVINGS, pensionId);
		} catch (error) {
			console.error('Error pausing pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.savings_pension_update_failed());
		}
	}

	async function handleResume(resumeDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.SAVINGS, pensionId, {
				status: 'ACTIVE',
				resume_at: resumeDate
			});
			pension = await pensionApi.get<SavingsPension>(PensionType.SAVINGS, pensionId);
		} catch (error) {
			console.error('Error resuming pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.savings_pension_update_failed());
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.savings_pension_edit_title()}
			description={m.savings_pension_edit_description()}
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
				{m.savings_pension_save()}
			</button>
		</div>
	</div>

	{#if loadError}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{loadError}</p>
		</div>
	{:else if !pension}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{m.savings_pension_not_found()}</p>
		</div>
	{:else}
		<form id="savings-pension-form" onsubmit={handleSubmit} class="space-y-8">
			<!-- Basic Information Section -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.savings_pension_explanation_intro()}</p>
						<ExplanationList>
							<ExplanationListItem><strong>{m.savings_pension_name()}:</strong> {m.savings_pension_explanation_name()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.savings_pension_start_date()}:</strong> {m.savings_pension_explanation_start_date()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.savings_pension_compounding_frequency()}:</strong> {m.savings_pension_explanation_compounding()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.savings_pension_notes()}:</strong> {m.savings_pension_explanation_notes()}</ExplanationListItem>
						</ExplanationList>
						<ExplanationAlert>
							{m.savings_pension_explanation_alert()}
						</ExplanationAlert>
					</Explanation>
				{/snippet}
				<Card title={m.savings_pension_basic_info()} description={m.savings_pension_basic_info_edit_description()}>
					{#snippet headerActions()}
						<PensionStatusActions
							status={pension!.status}
							onPause={handlePause}
							onResume={handleResume}
						/>
					{/snippet}
					<BasicInformationCard bind:name bind:startDate bind:compoundingFrequency bind:notes {errors} />
				</Card>
			</ContentSection>

			<!-- Interest Rates Section -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.savings_pension_interest_rates_explanation_intro()}</p>
						<ExplanationList>
							<ExplanationListItem><strong>{m.savings_pension_pessimistic_rate()}:</strong> {m.savings_pension_interest_rates_explanation_pessimistic()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.savings_pension_realistic_rate()}:</strong> {m.savings_pension_interest_rates_explanation_realistic()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.savings_pension_optimistic_rate()}:</strong> {m.savings_pension_interest_rates_explanation_optimistic()}</ExplanationListItem>
						</ExplanationList>
						<ExplanationAlert>
							{m.savings_pension_interest_rates_explanation_alert()}
						</ExplanationAlert>
					</Explanation>
				{/snippet}
				<Card title={m.savings_pension_interest_rates()} description={m.savings_pension_interest_rates_description()}>
					<InterestRatesCard bind:pessimisticRate bind:realisticRate bind:optimisticRate />
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
					<StatementsCard bind:statements {pensionId} />
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

		<!-- Contribution History Section (read-only, outside form) -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.contribution_history_explanation()}</p>
				</Explanation>
			{/snippet}
			<ContributionHistoryCard contributions={pension.contribution_history ?? []}>
				{#snippet headerActions()}
					<button
						type="button"
						onclick={() => (showOneTimeModal = true)}
						class="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-medium transition-colors"
					>
						{m.savings_add_one_time_investment()}
					</button>
				{/snippet}
			</ContributionHistoryCard>
		</ContentSection>
	{/if}
</div>

{#if pension}
	<OneTimeInvestmentModal
		open={showOneTimeModal}
		pensionId={pensionId}
		pensionName={pension.name}
		onClose={() => (showOneTimeModal = false)}
		onSuccess={async () => {
			pension = await pensionApi.get<SavingsPension>(PensionType.SAVINGS, pensionId);
		}}
	/>
{/if}
