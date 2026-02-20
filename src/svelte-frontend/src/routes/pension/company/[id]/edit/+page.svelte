<!--
@file src/routes/pension/company/[id]/edit/+page.svelte
@kind route
@purpose Rendert die Route 'pension/company/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
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
	import type { CompanyPension, ContributionStep, ContributionFrequency } from '$lib/types/pension';
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
	import PensionStatusActions from '$lib/components/pension/PensionStatusActions.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pensionId = $derived(data.pensionId);

	// Loading/error state
	let loadError = $state('');
	let submitting = $state(false);

	// Pension data
	let pension = $state<CompanyPension | null>(null);

	// Form state
	let name = $state('');
	let employer = $state('');
	let startDate = $state('');
	let contributionAmount = $state(0);
	let contributionFrequency = $state<ContributionFrequency | undefined>(undefined);
	let notes = $state('');

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

	let statements = $state<StatementFormData[]>([]);
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});

	function hydrateForm(p: CompanyPension) {
		name = p.name;
		employer = p.employer;
		startDate = p.start_date;
		contributionAmount = p.contribution_amount ?? 0;
		contributionFrequency = p.contribution_frequency;
		notes = p.notes ?? '';
		statements = (p.statements ?? []).map((s) => ({
			id: s.id,
			pension_id: s.pension_id,
			statement_date: s.statement_date,
			value: s.value,
			note: s.note,
			retirement_projections: (s.retirement_projections ?? []).map((proj) => ({
				id: proj.id,
				retirement_age: proj.retirement_age,
				monthly_payout: proj.monthly_payout,
				total_capital: proj.total_capital
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
		if (!name.trim()) newErrors.name = m.company_pension_name_required();
		if (!startDate) newErrors.start_date = m.company_pension_start_date_required();
		if (!employer.trim()) newErrors.employer = m.company_pension_employer_required();
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
				employer: employer.trim(),
				contribution_amount: contributionAmount || undefined,
				contribution_frequency: contributionFrequency || undefined,
				notes: notes.trim() || '',
				contribution_plan_steps: contributionPlanSteps.map((step) => ({
					id: step.id,
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			await pensionApi.update(PensionType.COMPANY, pensionId, pensionData);

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
							note: s.note || '',
							retirement_projections: s.retirement_projections.map((p) => ({
								retirement_age: p.retirement_age || 67,
								monthly_payout: p.monthly_payout || 0,
								total_capital: p.total_capital || 0
							}))
						};
						return s.id
							? pensionApi.updateCompanyPensionStatement(pensionId, s.id, payload)
							: pensionApi.addCompanyPensionStatement(pensionId, payload);
					})
			);

			toastStore.success(m.company_pension_updated());
			goto('/pension');
		} catch (error) {
			console.error('Error updating company pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.company_pension_update_failed()
			);
		} finally {
			submitting = false;
		}
	}

	async function handlePause(pauseDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.COMPANY, pensionId, {
				status: 'PAUSED',
				paused_at: pauseDate
			});
			pension = await pensionApi.get<CompanyPension>(PensionType.COMPANY, pensionId);
		} catch (error) {
			console.error('Error pausing pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.company_pension_update_failed()
			);
		}
	}

	async function handleResume(resumeDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.COMPANY, pensionId, {
				status: 'ACTIVE',
				resume_at: resumeDate
			});
			pension = await pensionApi.get<CompanyPension>(PensionType.COMPANY, pensionId);
		} catch (error) {
			console.error('Error resuming pension:', error);
			toastStore.error(
				error instanceof Error ? error.message : m.company_pension_update_failed()
			);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.company_pension_edit_title()}
			description={m.company_pension_edit_description()}
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
				{m.company_pension_save()}
			</button>
		</div>
	</div>

	{#if loadError}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{loadError}</p>
		</div>
	{:else if !pension}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{m.company_pension_not_found()}</p>
		</div>
	{:else}
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
					description={m.company_pension_basic_info_edit_description()}
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
					<StatementsCard bind:statements {pensionId} />
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
	{/if}
</div>
