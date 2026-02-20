<!--
@file src/routes/pension/etf/new/+page.svelte
@kind route
@purpose Rendert die Route 'pension/etf/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
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
	import type { PageData } from './$types';
	import { PlusCircle, BarChart3, History } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let memberId = $derived(data.memberId);

	// Initialization method
	type InitMethod = 'new' | 'existing' | 'historical';
	let initMethod = $state<InitMethod | null>(null);

	// Form state
	let name = $state('');
	let etfId = $state('');
	let etfDisplayName = $state('');
	let existingUnits = $state(0);
	let referenceDate = $state(todayIsoDate());
	let notes = $state('');
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	const isExistingInvestment = $derived(initMethod === 'existing');

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = 'Name is required';
		if (!etfId) newErrors.etf_id = 'ETF is required';
		if (!initMethod) newErrors.init_method = 'Please select an initialization method';
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
				is_existing_investment: isExistingInvestment,
				existing_units: isExistingInvestment ? existingUnits : 0,
				reference_date: isExistingInvestment ? referenceDate : undefined,
				realize_historical_contributions: initMethod === 'historical',
				notes: notes.trim() || '',
				status: 'ACTIVE' as const,
				total_units: isExistingInvestment ? existingUnits : 0,
				contribution_plan_steps: contributionPlanSteps.map((step) => ({
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			await pensionApi.create(PensionType.ETF_PLAN, pensionData);

			if (isExistingInvestment && existingUnits > 0) {
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
				disabled={submitting || !initMethod}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.etf_pension_create()}
			</button>
		</div>
	</div>

	<form id="etf-pension-form" onsubmit={handleSubmit} class="space-y-8">
		<!-- Initialization Method Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.etf_init_method_title()}</p>
				</Explanation>
			{/snippet}
			<Card title={m.etf_init_method_title()}>
				<div class="space-y-3">
					<!-- New Investment -->
					<label
						class="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group transition-colors {initMethod === 'new' ? 'border-primary bg-primary/5' : ''}"
					>
						<div class="space-y-2">
							<div class="flex items-center space-x-4">
								<input
									type="radio"
									name="init_method"
									value="new"
									checked={initMethod === 'new'}
									onchange={() => (initMethod = 'new')}
									class="accent-primary"
								/>
								<PlusCircle class="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
								<span class="font-medium">{m.etf_init_new()}</span>
							</div>
							<p class="text-sm text-muted-foreground pl-9">{m.etf_init_new_desc()}</p>
						</div>
					</label>

					<!-- Existing Investment -->
					<label
						class="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group transition-colors {initMethod === 'existing' ? 'border-primary bg-primary/5' : ''}"
					>
						<div class="space-y-2">
							<div class="flex items-center space-x-4">
								<input
									type="radio"
									name="init_method"
									value="existing"
									checked={initMethod === 'existing'}
									onchange={() => (initMethod = 'existing')}
									class="accent-primary"
								/>
								<BarChart3 class="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
								<span class="font-medium">{m.etf_init_existing()}</span>
							</div>
							<p class="text-sm text-muted-foreground pl-9">{m.etf_init_existing_desc()}</p>
						</div>
					</label>

					<!-- Historical Contributions -->
					<label
						class="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group transition-colors {initMethod === 'historical' ? 'border-primary bg-primary/5' : ''}"
					>
						<div class="space-y-2">
							<div class="flex items-center space-x-4">
								<input
									type="radio"
									name="init_method"
									value="historical"
									checked={initMethod === 'historical'}
									onchange={() => (initMethod = 'historical')}
									class="accent-primary"
								/>
								<History class="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
								<span class="font-medium">{m.etf_init_historical()}</span>
							</div>
							<p class="text-sm text-muted-foreground pl-9">{m.etf_init_historical_desc()}</p>
						</div>
					</label>
				</div>
			</Card>
		</ContentSection>

		{#if initMethod}
			<!-- Basic Information Section -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.etf_basic_info_explanation_intro()}</p>
						<ExplanationList>
							<ExplanationListItem
								><strong>{m.etf_pension_name()}:</strong>
								{m.etf_basic_info_explanation_name()}</ExplanationListItem
							>
							<ExplanationListItem
								><strong>{m.etf_pension_etf()}:</strong>
								{m.etf_basic_info_explanation_etf()}</ExplanationListItem
							>
							<ExplanationListItem
								><strong>{m.etf_pension_notes()}:</strong>
								{m.etf_basic_info_explanation_notes()}</ExplanationListItem
							>
						</ExplanationList>
					</Explanation>
				{/snippet}
				<Card title={m.etf_pension_new_title()}>
					<BasicInformationCard
						bind:name
						bind:etfId
						bind:etfDisplayName
						bind:existingUnits
						bind:referenceDate
						bind:notes
						{isExistingInvestment}
						isEditing={false}
						{errors}
					/>
				</Card>
			</ContentSection>

			<!-- Contribution Plan Section -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.etf_contribution_explanation_intro()}</p>
						<p class="text-sm text-muted-foreground">{m.etf_contribution_explanation_growth()}</p>
					</Explanation>
				{/snippet}
				<ContributionPlanCard bind:steps={contributionPlanSteps} />
			</ContentSection>
		{/if}
	</form>
</div>
