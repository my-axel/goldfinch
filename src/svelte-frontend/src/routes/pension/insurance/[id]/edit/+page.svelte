<!--
@file src/routes/pension/insurance/[id]/edit/+page.svelte
@kind route
@purpose Rendert die Route 'pension/insurance/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
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
	import { PensionType } from '$lib/types/pension';
	import type { InsurancePension, ContributionStep } from '$lib/types/pension';
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
	import ContributionHistoryCard from '$lib/components/pension/ContributionHistoryCard.svelte';
	import PensionStatusActions from '$lib/components/pension/PensionStatusActions.svelte';
	import ScenarioRatesCard from '$lib/components/pension/ScenarioRatesCard.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pensionId = $derived(data.pensionId);

	// Loading/error state
	let loadError = $state('');
	let submitting = $state(false);

	// Pension data
	let pension = $state<InsurancePension | null>(null);

	// Form state
	let name = $state('');
	let provider = $state('');
	let contractNumber = $state('');
	let startDate = $state('');
	let notes = $state('');

	// Per-pension scenario rates — initialized in hydrateForm() from pension or global fallback
	let pessimisticRate = $state(settingsStore.current.projection_pessimistic_rate / 100);
	let realisticRate = $state(settingsStore.current.projection_realistic_rate / 100);
	let optimisticRate = $state(settingsStore.current.projection_optimistic_rate / 100);

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

	let statements = $state<StatementFormData[]>([]);
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});

	function hydrateForm(p: InsurancePension) {
		name = p.name;
		provider = p.provider;
		contractNumber = p.contract_number ?? '';
		startDate = p.start_date;
		notes = p.notes ?? '';
		// API rates are percentages (7.0 = 7%), convert to decimals for form
		pessimisticRate =
			p.pessimistic_rate != null
				? p.pessimistic_rate / 100
				: settingsStore.current.projection_pessimistic_rate / 100;
		realisticRate =
			p.realistic_rate != null
				? p.realistic_rate / 100
				: settingsStore.current.projection_realistic_rate / 100;
		optimisticRate =
			p.optimistic_rate != null
				? p.optimistic_rate / 100
				: settingsStore.current.projection_optimistic_rate / 100;
		statements = (p.statements ?? []).map((s) => ({
			...s,
			id: s.id ?? 0,
			pension_id: s.pension_id ?? p.id,
			costs_percentage: s.costs_percentage / 100, // API % → form decimal
			projections: (s.projections ?? []).map((proj) => ({
				...proj,
				id: proj.id ?? 0,
				return_rate: proj.return_rate / 100 // API % → form decimal
			}))
		}));
		contributionPlanSteps = (p.contribution_plan_steps ?? []).map((step) => ({ ...step }));
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
		if (!name.trim()) newErrors.name = m.insurance_pension_name_required();
		if (!startDate) newErrors.start_date = m.insurance_pension_start_date_required();
		if (!provider.trim()) newErrors.provider = m.insurance_pension_provider_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate() || !pension) return;

		submitting = true;
		try {
			const pensionData = {
				name: name.trim(),
				start_date: startDate,
				provider: provider.trim(),
				contract_number: contractNumber.trim() || undefined,
				notes: notes.trim() || '',
				pessimistic_rate: pessimisticRate * 100,
				realistic_rate: realisticRate * 100,
				optimistic_rate: optimisticRate * 100,
				contribution_plan_steps: contributionPlanSteps.map((step) => ({
					id: step.id,
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			await pensionApi.update(PensionType.INSURANCE, pensionId, pensionData);

			// Manage statements separately:
			// - id === 0 → new statement, POST
			// - id > 0 → existing statement, PUT to update
			await Promise.all(
				statements
					.filter((s) => s.statement_date)
					.map((s) => {
						const payload = {
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
						};
						return s.id
							? pensionApi.updateInsurancePensionStatement(pensionId, s.id, payload)
							: pensionApi.addInsurancePensionStatement(pensionId, payload);
					})
			);

			toastStore.success(m.insurance_pension_updated());
			goto('/pension');
		} catch (error) {
			console.error('Error updating insurance pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.insurance_pension_update_failed()
			);
		} finally {
			submitting = false;
		}
	}

	async function handlePause(pauseDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.INSURANCE, pensionId, {
				status: 'PAUSED',
				paused_at: pauseDate
			});
			pension = await pensionApi.get<InsurancePension>(PensionType.INSURANCE, pensionId);
		} catch (error) {
			console.error('Error pausing pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.insurance_pension_update_failed()
			);
		}
	}

	async function handleResume(resumeDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.INSURANCE, pensionId, {
				status: 'ACTIVE',
				resume_at: resumeDate
			});
			pension = await pensionApi.get<InsurancePension>(PensionType.INSURANCE, pensionId);
		} catch (error) {
			console.error('Error resuming pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.insurance_pension_update_failed()
			);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.insurance_pension_edit_title()}
			description={m.insurance_pension_edit_description()}
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
				{m.insurance_pension_save()}
			</button>
		</div>
	</div>

	{#if loadError}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{loadError}</p>
		</div>
	{:else if !pension}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{m.insurance_pension_not_found()}</p>
		</div>
	{:else}
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
							<ExplanationListItem><strong>{m.insurance_pension_notes()}:</strong> {m.insurance_pension_explanation_notes()}</ExplanationListItem>
						</ExplanationList>
						<ExplanationAlert>
							{m.insurance_pension_explanation_alert()}
						</ExplanationAlert>
					</Explanation>
				{/snippet}
				<Card
					title={m.insurance_pension_basic_info()}
					description={m.insurance_pension_basic_info_edit_description()}
				>
					{#snippet headerActions()}
						<PensionStatusActions
							status={pension!.status}
							onPause={handlePause}
							onResume={handleResume}
						/>
					{/snippet}
					<BasicInformationCard
						bind:name
						bind:provider
						bind:contractNumber
						bind:startDate
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
					<StatementsCard bind:statements {pensionId} />
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

		<!-- Contribution History Section (read-only, outside form) -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.contribution_history_explanation()}</p>
				</Explanation>
			{/snippet}
			<ContributionHistoryCard contributions={pension.contribution_history ?? []} />
		</ContentSection>
	{/if}
</div>
